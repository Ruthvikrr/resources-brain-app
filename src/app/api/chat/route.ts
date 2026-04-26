import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

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
    const { messages, resourceId } = await req.json();
    const latestMessage = messages[messages.length - 1].content;

    console.log("Chat trigger! User asks:", latestMessage);

    let contextData = "No exact relevant knowledge found in the database.";

    // Targeted Single-Document Chat Mode
    if (resourceId) {
      console.log("Targeted chat mode activated for Resource ID:", resourceId);
      const { data: specificRes, error } = await supabase.from('resources').select('*').eq('id', resourceId).single();
      
      if (error) throw error;
      if (specificRes) {
        contextData = `Title: ${specificRes.title}\nURL: ${specificRes.url}\nSummary: ${specificRes.summary}\nExtracted Text: ${specificRes.raw_content}`;
      }
    } 
    // Global AI Mathematical Vector Search (RAG)
    else {
      // 1. Math: Convert the user's text question into Vector math coordinates dynamically
      const { generateEmbedding } = await import('@/agents/Retriever/embeddingLayer');
      const queryEmbedding = await generateEmbedding(latestMessage);

      // 2. Search: Find the closest memories in Supabase based on math distance
      const { data: matchedResources, error } = await supabase.rpc('match_resources', {
        query_embedding: queryEmbedding,
        match_threshold: 0.1, // Fairly loose to ensure we return *something* related
        match_count: 5 // Bring back top 5 most relevant files/URLs
      });

      if (error) throw error;

      // 3. Construct the RAG Context Knowledge snippet
      if (matchedResources && matchedResources.length > 0) {
        contextData = matchedResources.map((res: any) => 
          `[Resource: ${res.title}]\nURL: ${res.url}\nSummary: ${res.summary}\nExtracted Content: ${res.content?.substring(0, 1500)}...`
        ).join("\n\n---\n\n");
      }
    }

    // Ensure messages array is perfectly sanitized for Groq (no extraneous fields like IDs)
    const cleanMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    // 4. Fire the Groq LLM with the context and stream the answer back to the UI smoothly!
    const result = await streamText({
      model: groq('llama-3.3-70b-versatile'), // Upgraded to 70B for massive 128k context window and elite reasoning
      system: `You are the Resource Brain Assistant, an elite, highly intelligent knowledge-synthesizing AI.
      You are speaking directly to the user who owns this data. Your sole purpose is to analyze the provided Context Knowledge (which is exact data extracted from their personal saved resources, PDFs, and links) and answer their questions flawlessly.
      
      CRITICAL INSTRUCTIONS:
      1. DO NOT give generic, hallucinatory answers. Ground your ENTIRE response strictly in the provided Context Knowledge.
      2. If the user asks a question and the answer is actively found in the Context Knowledge, extract it deeply and explain it with high clarity.
      3. Use exceptional formatting: break down complex ideas into crisp bullet points, bold important keywords, and keep paragraphs punchy.
      4. If the Context Knowledge does NOT contain the answer, say EXACTLY: "I couldn't find the exact answer inside your saved resources, but based on my general knowledge..." and then provide the answer.
      5. Always act like a brilliant research assistant—insightful, precise, and highly professional.
      
      RETRIEVED CONTEXT KNOWLEDGE:
      ===================================
      ${contextData}
      ===================================`,
      messages: cleanMessages,
    });

    // Return a readable text stream directly to the Next.js UI
    return result.toTextStreamResponse();
    
  } catch (err: any) {
    console.error("Chat Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
