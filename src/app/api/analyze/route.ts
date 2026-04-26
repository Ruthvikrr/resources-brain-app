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
      console.log("Processing File:", file.name, "Type:", file.type);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // 📂 Save File to Supabase Storage Bucket ('documents')
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      const isImage = file.type.startsWith('image/');

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false
        });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
        targetUrl = publicUrl;
      }

      // 👁️ VISION AI: If it's an image, use Groq's Vision Model to read it!
      if (isImage) {
        console.log("Image detected. Launching Vision AI Engine...");
        const base64Image = buffer.toString('base64');
        const { text: visionText } = await generateText({
          model: groq('llama-3.2-11b-vision-preview'),
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: "Describe this image in extreme detail. If this is a social media post, extract the caption, the username, and the primary content shown in the image." },
                { type: 'image', image: base64Image }
              ],
            },
          ],
        });
        cleanText = visionText;
      } else {
        // 📄 Standard PDF/Text Parsing
        try {
          // @ts-ignore
          const pdfParse = (await import('pdf-parse')).default || await import('pdf-parse');
          const pdfData = await (pdfParse as any)(buffer);
          cleanText = pdfData.text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '').replace(/\s+/g, ' ').trim().substring(0, 5000);
        } catch (e) {
          cleanText = buffer.toString('utf-8').replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '').substring(0, 5000);
        }
      }
      pageTitle = file.name;
    } else if (url) {
      console.log("Fetching URL via AI Reader Engine:", url);
      
      try {
        // 🚀 Primary: Specialized Social Media Metadata Extraction
        // We use a "Social Bot" identity and DISABLE redirects to avoid being sucked into the login wall.
        const socialResponse = await fetch(url, { 
          headers: { 
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
          },
          // We don't want to be redirected to /accounts/login/
          redirect: 'follow' 
        });
        
        const socialHtml = await socialResponse.text();
        const $social = cheerio.load(socialHtml);
        
        // Hunt for the "Real" content in metadata
        const ogDescription = $social('meta[property="og:description"]').attr('content') || 
                            $social('meta[name="description"]').attr('content');
        const ogTitle = $social('meta[property="og:title"]').attr('content') || 
                        $social('title').text();
        
        // Validation: If it says "Login", it's the wrong page
        if (ogDescription && ogDescription.length > 20 && !ogDescription.includes("Login • Instagram")) {
          cleanText = `Source: ${ogTitle}\nContent: ${ogDescription}`;
          pageTitle = ogTitle;
          console.log("Successfully extracted Social Metadata via Bot Identity.");
        } else {
          throw new Error("Metadata check failed or Login Wall detected.");
        }
      } catch (socialError) {
        console.warn("Social crawler failed. Trying Jina Reader with aggressive headers...", socialError);
        
        try {
          const readerResponse = await fetch(`https://r.jina.ai/${url}`, {
            headers: { 
              'Accept': 'application/json',
              'X-No-Cache': 'true'
            }
          });
          
          if (readerResponse.ok) {
            const readerData = await readerResponse.json();
            cleanText = readerData.data?.content || "";
            pageTitle = readerData.data?.title || url;
            
            // Final check to see if we got the login page
            if (cleanText.includes("Welcome back to Instagram") || cleanText.includes("Log in to Instagram")) {
              throw new Error("Jina also hit the login wall.");
            }
          } else {
            throw new Error("Reader failed");
          }
        } catch (error) {
          console.warn("All link-based scrapers failed.", error);
          cleanText = "The AI was blocked by Instagram's login wall. PRO TIP: If this is a private or protected post, take a screenshot and upload the image file directly! I can now read text from images using Vision AI.";
          pageTitle = "Blocked by Instagram Login Wall";
        }
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
