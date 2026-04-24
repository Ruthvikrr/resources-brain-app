import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { generateEmbedding } from '@/agents/Retriever/embeddingLayer';

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
      // 1. Math: Convert the user's text question into Vector math coordinates
      const queryEmbedding = await generateEmbedding(latestMessage);

      // 2. Search: Find the closest memories in Supabase based on math distance
      const { data: matchedResources, error } = await supabase.rpc('match_resources', {
        query_embedding: queryEmbedding,
        match_threshold: 0.1, // Fairly loose to ensure we return *something* related
        match_count: 4 // Bring back top 4 most relevant files/URLs
      });

      if (error) throw error;

      // 3. Construct the RAG Context Knowledge snippet
      if (matchedResources && matchedResources.length > 0) {
        contextData = matchedResources.map((res: any) => 
          `Title: ${res.title}\nURL: ${res.url}\nSummary: ${res.summary}\nExtracted Text: ${res.content?.substring(0, 500)}...`
        ).join("\n\n---\n\n");
      }
    }

    // 4. Fire the Groq LLM with the context and stream the answer back to the UI smoothly!
    const result = await streamText({
      model: groq('llama-3.1-8b-instant'),
      system: `You are the Resource Brain Assistant, a highly intelligent curator and knowledge-base search agent.
      Answer the user's questions strictly using the Context Knowledge provided below. It was just retrieved via Mathematical Vector Search from the user's personal database.
      If the context does not contain the answer, say "I couldn't find an exact match in your uploaded modules, but here is what I know..."
      Keep answers structured, highly intelligent, and very readable (use bullets where necessary).
      
      RETRIEVED CONTEXT KNOWLEDGE:
      ${contextData}`,
      messages,
    });

    // Return a readable text stream directly to the Next.js UI
    return result.toTextStreamResponse();
    
  } catch (err: any) {
    console.error("Chat Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
