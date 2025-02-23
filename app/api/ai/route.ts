import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


const threadCache = new Map();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { input, threadId, marketData, marketInfo } = body;
    

    let thread;
    if (threadId && threadCache.has(threadId)) {
      thread = { id: threadId };
    } else {
      thread = await openai.beta.threads.create();
      threadCache.set(thread.id, true);
    }


    if (threadCache.size > 100) {
      threadCache.clear();
    }


    const marketSummary = {
      price: marketInfo.lastPrice,
      change: marketInfo.change24h,
      high: marketInfo.high,
      low: marketInfo.low,
      last20candle: marketData.slice(-20)
    };

    console.log(marketSummary);
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `${input}\nMarket Summary: ${JSON.stringify(marketSummary)}`
    });


    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.ASSISTANT_ID || '',
    });


    const maxAttempts = 10; 
    const pollInterval = 500; 

    for (let i = 0; i < maxAttempts; i++) {
      const runStatus = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );

      if (runStatus.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(thread.id);
        const response = messages.data[0].content[0];
        
        return NextResponse.json({
          threadId: thread.id,
          response: response.type === 'text' ? response.text.value : 'Error'
        });
      }

      if (runStatus.status === 'failed' || runStatus.status === 'expired') {
        throw new Error(`Run ${runStatus.status}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Timeout');

  } catch (error) {
    console.error('🔥 Erreur:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 