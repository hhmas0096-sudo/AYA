// This is a new Netlify serverless function for Text-to-Speech.
// It receives text and voice preferences, adds the secret API key,
// and calls the Google Gemini TTS API using the official SDK.

import { GoogleGenAI, Modality } from "@google/genai";

export const handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'API_KEY environment variable not set in Netlify.' }) 
    };
  }
  
  try {
    const { text, voice } = JSON.parse(event.body);
    if (!text || !text.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Text is required.' }) };
    }

    const model = "gemini-2.5-flash-preview-tts";
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' } // Default to Kore (female)
          }
        }
      }
    });

    const audioContent = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioContent) {
        console.error('Failed to extract audio content from response:', JSON.stringify(response, null, 2));
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to extract audio content from Gemini response.' })
        };
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioContent: audioContent }),
    };

  } catch (error) {
    console.error('TTS Proxy Function Error:', error);
    const errorMessage = error.message || 'An error occurred in the TTS proxy function.';
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};