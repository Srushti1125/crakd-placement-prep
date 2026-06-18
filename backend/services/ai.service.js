import { GoogleGenAI } from '@google/genai';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const isGeminiConfigured = () => !!process.env.GEMINI_API_KEY;

// Initialize LangChain ChatModel and Embeddings
const chatModel = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "gemini-2.5-flash",
  model: "gemini-2.5-flash",
  temperature: 0.7,
});

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "gemini-embedding-2",
  model: "gemini-embedding-2",
});

// Cache + queue to avoid rate limits
const geminiCache = new Map();
let geminiQueue = Promise.resolve();

async function callGemini(prompt, cacheKey = null) {
  if (cacheKey && geminiCache.has(cacheKey)) {
    const { result, timestamp } = geminiCache.get(cacheKey);
    if (Date.now() - timestamp < 10 * 60 * 1000) return result;
  }

  // Queue calls with 500ms gap
  geminiQueue = geminiQueue.then(() => new Promise(r => setTimeout(r, 500)));
  await geminiQueue;

  const attempt = async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text;
  };

  try {
    const result = await attempt();
    if (cacheKey) geminiCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  } catch (err) {
    const isRateLimit = err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
    if (isRateLimit) {
      const waitSec = parseInt(err?.message?.match(/retry.*?(\d+)s/i)?.[1] || '15');
      const waitMs = Math.min(waitSec * 1000, 20000);
      console.warn(`⏳ Rate limited. Waiting ${waitMs / 1000}s...`);
      await new Promise(r => setTimeout(r, waitMs));
      try {
        const result = await attempt();
        if (cacheKey) geminiCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      } catch { throw new Error('RATE_LIMITED'); }
    }
    throw err;
  }
}

export {
  ai,
  isGeminiConfigured,
  callGemini,
  chatModel,
  embeddings
};

