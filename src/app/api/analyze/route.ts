import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import { generateEmbedding } from '@/agents/Retriever/embeddingLayer';

// Configure Groq
const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// Configure Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const url = formData.get('url') as string | null;
    const file = formData.get('file') as File | null;

    if (!url && !file) {
      return NextResponse.json({ error: 'URL or File is required' }, { status: 400 });
    }

    let cleanText = "";
    let pageTitle = "";
    let targetUrl = url || "";

    // Step 1: Extract Text from the input
    if (file) {
      console.log("Parsing File:", file.name);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      try {
        const pdfData = await pdfParse(buffer);
        // Clean out binary garbage but KEEP standard unicode (bullets, quotes, emojis, etc)
        cleanText = pdfData.text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '').replace(/\s+/g, ' ').trim().substring(0, 5000);
      } catch (e) {
        // Fallback to raw text if not physical PDF
        cleanText = buffer.toString('utf-8').replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '').substring(0, 5000);
      }
      pageTitle = file.name;
    } else if (url) {
      console.log("Fetching URL:", url);
      const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
      const html = await response.text();
      
      const $ = cheerio.load(html);
      // Remove scripts, styles, nav, and footers to keep it clean
      $('script, style, nav, footer, header').remove();
      cleanText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000); 

      pageTitle = $('title').text() || url;
    }

    console.log(`Extracted total text length to analyze: ${cleanText.length} characters.`);
    if (cleanText.length < 10) {
      cleanText = "No readable text could be extracted from this resource (it might be an image or protected file).";
    }

// You will need this changed at the top:
// import { generateText } from 'ai';

    // Step 2: Use Groq LLM to analyze and categorize the data instantly
    const { text } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      maxTokens: 1000,
      prompt: `You are an expert curator organizing a massive knowledge base. 
      Read the following text extracted from a webpage and classify it, summarize it, and generate tags for it.
      
      TITLE: ${pageTitle}
      URL: ${url}
      CONTENT SNIPPET: ${cleanText}

      You must return ONLY a JSON object and absolutely nothing else. Even if there is no content snippet or the content is unreadable, you MUST return a valid JSON object. Use this exact schema:
      {
        "summary": "Do NOT write just 2-3 sentences. Write a comprehensive, highly detailed analysis. Extract key points, important skills, primary takeaways, and thoroughly summarize the exact exact details found inside the document. Be as informative as possible.",
        "category": "Generate a dynamic, highly accurate 1-2 word category (e.g. 'Software Resume', 'UI Design Toolkit', etc.). Do not use a hardcoded generic list.",
        "tags": ["Tag1", "Tag2", "Tag3", "Tag4"] 
      }
      `,
    });

    // Parse the JSON out of the response
    console.log("Raw AI Response:", text);
    let object;
    try {
      // Find the first { and the last }
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1) throw new Error("No JSON brackets found");
      
      const jsonStr = text.substring(startIdx, endIdx + 1);
      object = JSON.parse(jsonStr);
    } catch (e) {
      console.warn("AI did not return valid JSON. Using fallback. Error:", e);
      object = {
        summary: "The memory has been saved, but the document content may have been encrypted or image-based, meaning exact text could not be extracted.",
        category: file ? "PDF" : "Other",
        tags: ["Unstructured"]
      };
    }

    // Step 3: Run the local Embedding Agent to calculate its Mathematical Vectors
    console.log("Generating semantic vectors for RAG...");
    const vectorMath = await generateEmbedding(object.summary);

    // Step 4: Save EVERYTHING to Supabase Memory Cache (including Vectors)
    console.log("Saving vectors and metadata to Supabase DB...");
    const { data, error } = await supabase.from('resources').insert([
      {
        url: targetUrl,
        title: pageTitle,
        summary: object.summary,
        category: object.category,
        tags: object.tags,
        source_type: file ? 'document' : 'url',
        raw_content: cleanText,
        embedding: vectorMath // <--- This enables Chat with your Brain!
      }
    ]).select();

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: 'Failed to save to database' }, { status: 500 });
    }

    // Step 4: Return success to the UI!
    return NextResponse.json({ success: true, data: data[0] });

  } catch (err: any) {
    console.error("Analysis Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
