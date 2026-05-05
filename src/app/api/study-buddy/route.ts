import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import * as cheerio from 'cheerio';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let cleanText = "";
    let pageTitle = url;

    console.log("Fetching URL for Study Buddy:", url);
    
    try {
      const response = await fetch(url, { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html'
        }
      });
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Remove scripts, styles, navs
      $('script, style, nav, footer, header, aside, iframe, noscript').remove();
      
      pageTitle = $('title').text() || $('meta[property="og:title"]').attr('content') || url;
      cleanText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 8000);
      
    } catch (error) {
      console.warn("Failed basic fetch, trying Jina...", error);
      try {
        const readerResponse = await fetch(`https://r.jina.ai/${url}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (readerResponse.ok) {
          const readerData = await readerResponse.json();
          cleanText = readerData.data?.content?.substring(0, 8000) || "";
          pageTitle = readerData.data?.title || url;
        } else {
          throw new Error("Reader failed");
        }
      } catch (jinaError) {
        cleanText = "Could not extract text from this URL. Please provide general context based on the URL name.";
      }
    }

    // Generate Questions via Groq
    const { text } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      prompt: `You are an expert tutor and study buddy. Read the following text extracted from a webpage and generate a study quiz.
      
      TITLE: ${pageTitle}
      URL: ${url}
      CONTENT SNIPPET: ${cleanText}

      You must return ONLY a JSON object and absolutely nothing else. Use this exact schema:
      {
        "title": "A short, catchy title for this study session based on the content",
        "mcqs": [
          { 
            "q": "A thoughtful multiple-choice question testing a key concept.",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "The exact string of the correct option"
          },
          ... generate exactly 3 MCQs ...
        ],
        "qa": [
          {
            "q": "A deep-thinking open-ended discussion question.",
            "a": "A brief, correct answer to guide the discussion."
          },
          ... generate exactly 2 Open-Ended Q&As ...
        ]
      }
      `,
    });

    let object;
    try {
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1) throw new Error("No JSON brackets found");
      
      const jsonStr = text.substring(startIdx, endIdx + 1);
      object = JSON.parse(jsonStr);
    } catch (e) {
      console.warn("AI did not return valid JSON. Error:", e);
      return NextResponse.json({ error: "Failed to generate study materials" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: object });

  } catch (err: any) {
    console.error("Study Buddy Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
