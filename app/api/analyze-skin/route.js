import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client
// Note: This requires OPENAI_API_KEY to be set in your .env.local file
const openai = new OpenAI();

export async function POST(request) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert, highly professional AI Skincare Analyst. 
Your goal is to look at the provided image and assess the user's skin.

Provide your response EXACTLY as a JSON object with the following structure, and do not include any markdown formatting or extra text outside this JSON object:
{
  "skinType": "estimated skin type (e.g., Dry, Oily, Combination, Normal)",
  "concerns": ["list", "of", "visible", "concerns"],
  "ingredients": ["list", "of", "recommended", "ingredients", "like", "Niacinamide"]
}

Important: Add a disclaimer that this is a cosmetic AI analysis and not medical advice.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Please analyze my skin from this picture and provide recommendations." },
            { type: "image_url", image_url: { url: image, detail: "low" } }
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const aiMessage = response.choices[0].message.content;
    const parsedData = JSON.parse(aiMessage);

    return NextResponse.json({ success: true, analysis: parsedData });

  } catch (error) {
    console.error('Error in Skin Analysis route:', error);
    return NextResponse.json(
      { error: 'An error occurred during analysis.' },
      { status: 500 }
    );
  }
}
