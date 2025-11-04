// This is the Netlify serverless function that acts as a proxy.
// It receives requests from our frontend, adds the secret API key,
// and forwards them to the Google Gemini API using the official SDK.

import { GoogleGenAI } from "@google/genai";

export const handler = async function(event) {
  // Only allow POST requests
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
    const { model, contents, config = {} } = JSON.parse(event.body);
    
    if (!model || !contents) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing "model" or "contents" in request body.' }) };
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model,
        contents,
        config: config,
    });

    const text = response.text;
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text }),
    };

  } catch (error) {
    console.error('Proxy Function Error:', error);
    const errorMessage = error.message || 'An error occurred in the proxy function.';
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};