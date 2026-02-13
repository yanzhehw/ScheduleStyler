import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase client for token validation
function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

// Validate activation token against database
async function validateActivationToken(token: string): Promise<{ valid: boolean; code?: string }> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('passcodes')
      .select('code,status,activation_token,expires_at')
      .eq('activation_token', token)
      .maybeSingle();

    if (error || !data) {
      return { valid: false };
    }

    const now = new Date();
    const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
    const isExpired = !expiresAt || expiresAt <= now;

    if (data.status !== 'ACTIVATED' || isExpired) {
      return { valid: false };
    }

    return { valid: true, code: data.code };
  } catch {
    return { valid: false };
  }
}

// Mark token as used after successful extraction
async function markTokenAsUsed(code: string): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase
      .from('passcodes')
      .update({
        status: 'USED',
        used_at: new Date().toISOString(),
        activation_token: null,
      })
      .eq('code', code);
  } catch (error) {
    console.error('Failed to mark token as used:', error);
  }
}

const SYSTEM_INSTRUCTION = `
You are an expert OCR and course schedule extraction assistant.
Your goal is to extract university class schedules from a screenshot.
Analyze the image layout carefully.
- Columns usually represent days (Monday to Sunday).
  - Monday is dayIndex 0, Sunday is Day index 6.  
- Rows represent time.
- Extract the **Course Code** (e.g., "MATH 101", "CS 202", "BIOL 100") as the 'title'.
- Identify the **Class Type** (Lecture, Tutorial, Lab, Seminar).
  - Look for keywords like "Lec", "Tut", "Lab".
  - If a section number is present (e.g., L01, T02), infer the type (L=Lecture, T=Tutorial).
  - If unsure, use "Lecture" as default or "Custom".
- Extract **Metadata** into a list. This includes:
  - CRN (Course Registration Number, usually a 4-5 digit number like "2082").
  - Duration/Frequency strings (e.g., "2 times 1.5 hrs/wk").
  - Instructor names if visible.
- Extract **Location** (Room numbers, Building names, Addresses). Note that the address is often the last line.
- If the exact time is not written, ESTIMATE it based on position.
- Return strictly structured JSON.
`;

function getAiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { base64Image, apiKey: userApiKey, activationToken } = req.body;

  if (!base64Image) {
    return res.status(400).json({ error: 'base64Image is required' });
  }

  let apiKey: string;
  let tokenCode: string | undefined;

  if (userApiKey) {
    // BYOK mode: use user's API key directly, no token validation needed
    apiKey = userApiKey;
  } else {
    // Server key mode: REQUIRE and validate activation token
    if (!activationToken) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide an invitation code or your own API key.'
      });
    }

    const validation = await validateActivationToken(activationToken);
    if (!validation.valid) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        message: 'Your invitation code has expired or is invalid. Please try again.'
      });
    }

    tokenCode = validation.code;
    apiKey = process.env.GEMINI_API_KEY!;

    if (!apiKey) {
      return res.status(500).json({ error: 'Server API key not configured' });
    }
  }

  try {
    const ai = getAiClient(apiKey);
    const model = "gemini-2.0-flash";

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Image,
            },
          },
          {
            text: "Extract all class events from this schedule image. Separate Course Code, Class Type, and Metadata. If the course type is not clear, use 'Unknown'.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  courseCode: { type: Type.STRING, description: "The course identifier, e.g. CS 101" },
                  classType: { type: Type.STRING, enum: ["Unknown", "Lecture", "Tutorial", "Lab", "Seminar", "Custom"] },
                  customClassType: { type: Type.STRING },
                  startTime: { type: Type.STRING, description: "HH:MM 24h" },
                  endTime: { type: Type.STRING, description: "HH:MM 24h" },
                  dayIndex: { type: Type.INTEGER },
                  location: { type: Type.STRING },
                  metadata: { type: Type.ARRAY, items: { type: Type.STRING }, description: "CRN, frequency, extra info" },
                  isConfidenceLow: { type: Type.BOOLEAN },
                },
                required: ["courseCode", "startTime", "endTime", "dayIndex"],
              },
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: 'No response from Gemini' });
    }

    const data = JSON.parse(text);

    // Mark token as used AFTER successful extraction (only for server key mode)
    if (tokenCode) {
      await markTokenAsUsed(tokenCode);
    }

    return res.json(data);

  } catch (error: any) {
    console.error('Extraction failed:', error);

    // Parse error for user-friendly messages
    const errorMessage = error.message || '';

    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'API quota exhausted. Please wait a moment and try again, or use your own Gemini API key.'
      });
    }

    if (errorMessage.includes('INVALID_API_KEY') || errorMessage.includes('401')) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The API key is invalid. Please check your key and try again.'
      });
    }

    return res.status(500).json({
      error: 'Extraction failed',
      message: errorMessage || 'An unexpected error occurred. Please try again.'
    });
  }
}
