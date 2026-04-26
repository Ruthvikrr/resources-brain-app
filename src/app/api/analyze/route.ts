import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import * as cheerio from 'cheerio';
// Configure Groq
const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// Configure Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export const dynamic = 'force-dynamic';
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

    // Step 1: Extract Text from the input and handle file storage
    if (file) {
      console.log("Parsing File:", file.name);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // 📂 Save File to Supabase Storage Bucket ('documents')
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error("Storage Upload Error:", uploadError);
        // We continue even if upload fails, but the URL will be empty
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);
        targetUrl = publicUrl;
        console.log("File uploaded to storage:", targetUrl);
      }

      try {
        // @ts-ignore
        const pdfParse = (await import('pdf-parse')).default || await import('pdf-parse');
        const pdfData = await (pdfParse as any)(buffer);
        // Clean out binary garbage but KEEP standard unicode (bullets, quotes, emojis, etc)
        cleanText = pdfData.text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '').replace(/\s+/g, ' ').trim().substring(0, 5000);
      } catch (e) {
        // Fallback to raw text if not physical PDF
        cleanText = buffer.toString('utf-8').replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '').substring(0, 5000);
      }
      pageTitle = file.name;
    } else if (url) {
      console.log("Fetching URL via AI Reader Engine:", url);
      
      try {
        // 🚀 High-Performance Reader Agent Integration
        // This bypasses login walls and JavaScript rendering issues on Instagram, Twitter, etc.
        const readerResponse = await fetch(`https://r.jina.ai/${url}`, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (readerResponse.ok) {
          const readerData = await readerResponse.json();
          cleanText = readerData.data?.content || "";
          pageTitle = readerData.data?.title || url;
          console.log("Successfully extracted clean data via AI Reader.");
        } else {
          throw new Error("Reader failed, falling back to local scraper");
        }
      } catch (error) {
        console.warn("AI Reader Engine failed. Using local Cheerio scraper fallback.", error);
        
        // 🛡️ Local Fallback Scraper (Standard metadata extraction)
        const response = await fetch(url, { 
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const ogTitle = $('meta[property="og:title"]').attr('content');
        const ogDescription = $('meta[property="og:description"]').attr('content');
        const metaDescription = $('meta[name="description"]').attr('content');

        $('script, style, nav, footer, header').remove();
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim(); 

        cleanText = [ogTitle, ogDescription, metaDescription, bodyText]
          .filter(Boolean)
          .join('\n')
          .substring(0, 6000);

        pageTitle = ogTitle || $('title').text() || url;
      }
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
    let vectorMath: number[] = new Array(384).fill(0);
    try {
      const { generateEmbedding } = await import('@/agents/Retriever/embeddingLayer');
      vectorMath = await generateEmbedding(object.summary);
    } catch (vectorError) {
      console.warn("Embedding Math Engine crashed on Vercel Node Runtime. Safely bypassing to protect data save.", vectorError);
    }

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
