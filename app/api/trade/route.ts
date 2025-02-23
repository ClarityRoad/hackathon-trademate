import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Validation function for the trading signal format
function isValidTradingSignal(signal: string): boolean {
  console.log('🔍 Validating signal:', signal);
  
  const pattern = /^TYPE: (Long|Short), EP: (\d+(\.\d+)?), TP: (\d+(\.\d+)?), SL: (\d+(\.\d+)?)$/;
  if (!pattern.test(signal)) {
    console.log('❌ Signal format validation failed');
    return false;
  }

  const matches = signal.match(pattern);
  if (!matches) {
    console.log('❌ No matches found in signal');
    return false;
  }

  const type = matches[1];
  const ep = parseFloat(matches[2]);
  const tp = parseFloat(matches[4]);
  const sl = parseFloat(matches[6]);

  console.log('📊 Parsed values:', { type, ep, tp, sl });

  // Validate price relationships based on position type
  if (type === 'Long') {
    const isValid = tp > ep && sl < ep;
    console.log('📈 Long position validation:', isValid ? 'Valid ✅' : 'Invalid ❌');
    return isValid;
  } else {
    const isValid = tp < ep && sl > ep;
    console.log('📉 Short position validation:', isValid ? 'Valid ✅' : 'Invalid ❌');
    return isValid;
  }
}

export async function POST(req: Request) {
  try {
    console.log('🚀 New trading request received');
    const { input, marketData, marketInfo } = await req.json();
    
    console.log('📊 Market Info:', marketInfo);
    console.log('📈 Last candle from Market Data:', marketData[marketData.length - 1]);

    const systemPrompt = `You are a trading analysis AI. Your ONLY task is to analyze market data and provide trading signals in a strict format.
    
Rules:
1. ONLY respond with a trading signal in this exact format:
   TYPE: {Long/Short}, EP: {entryPrice}, TP: {takeProfit}, SL: {stopLoss}
2. If no clear trading opportunity exists, respond with "NO_SIGNAL"
3. All prices must be valid numbers
4. For Long positions: TP must be higher than EP, SL must be lower than EP
5. For Short positions: TP must be lower than EP, SL must be higher than EP
6. Do not include any additional text or explanations
7. Use current market price as reference for EP`;

    console.log('🤖 Requesting OpenAI completion...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Market Data: ${JSON.stringify(marketData)}\nMarket Info: ${JSON.stringify(marketInfo)}\n\n${input}`
        }
      ],
      max_tokens: 100,
      temperature: 0.1,
      presence_penalty: 0,
      frequency_penalty: 0,
    });

    const response = completion.choices[0].message.content?.trim();
    console.log('🤖 AI Response:', response);

    // Handle NO_SIGNAL response
    if (response === 'NO_SIGNAL') {
      console.log('ℹ️ No trading opportunity detected');
      return NextResponse.json({ signal: null, message: 'No trading opportunity detected' });
    }

    // Validate the signal format
    if (!response || !isValidTradingSignal(response)) {
      console.error('❌ Invalid signal format received:', response);
      return NextResponse.json(
        { error: 'Invalid trading signal format' },
        { status: 400 }
      );
    }

    console.log('✅ Valid trading signal generated');
    return NextResponse.json({ 
      signal: response,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('🔥 Error in trade route:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
