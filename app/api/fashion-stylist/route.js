import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

export async function POST(request) {
  try {
    const { image, event } = await request.json();

    if (!image || !event) {
      return NextResponse.json({ error: 'Image and event are required' }, { status: 400 });
    }

    // Step 1: Vision analysis to extract traits and get text recommendations
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert celebrity fashion stylist. Based on the user's provided image and the event they are attending, evaluate their physical traits (gender layout, skin tone, hair color, body type, general vibe) and recommend 3 distinct stellar fashion outfits for the specified event.

Return your response EXACTLY as a JSON object with this structure:
{
  "userTraits": "Brief description of physical traits (e.g., 'a young woman with olive skin, long dark wavy hair, and a slim athletic build')",
  "recommendations": [
    {
      "name": "Name of Style (e.g., 'Chic Bohemian')",
      "description": "Detailed description of the outfit",
      "generationPrompt": "An exact DALL-E 3 prompt to generate a photorealistic fashion editorial of this exact person wearing this outfit at this event. Format: A photorealistic fashion editorial photo of [userTraits] wearing [outfit description], [event] background, cinematic lighting, 8k resolution, highly detailed."
    },
    ... (2 more)
  ]
}`
        },
        {
          role: "user",
          content: [
            { type: "text", text: `I am attending a ${event}. Please recommend 3 outfits based on my appearance.` },
            { type: "image_url", image_url: { url: image, detail: "low" } }
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const aiMessage = visionResponse.choices[0].message.content;
    const parsedData = JSON.parse(aiMessage);

    // Step 2: Generate DALL-E image for ONLY the first recommendation
    let firstImageUrl = null;
    try {
      const firstPrompt = parsedData.recommendations[0].generationPrompt;
      const dallEResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: firstPrompt,
        n: 1,
        size: "1024x1024",
      });
      firstImageUrl = dallEResponse.data[0].url;
      parsedData.recommendations[0].imageUrl = firstImageUrl;
    } catch (e) {
      console.error("DALL-E generation failed for the first option:", e);
      // Fallback if image generation fails (like policy block)
      parsedData.recommendations[0].imageUrl = null;
    }

    return NextResponse.json({ success: true, analysis: parsedData });

  } catch (error) {
    console.error('Error in Fashion Stylist route:', error);
    return NextResponse.json(
      { error: 'An error occurred during analysis.' },
      { status: 500 }
    );
  }
}
