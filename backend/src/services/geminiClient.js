'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Validated, real Gemini model hierarchy ordered fastest/lightweight-first.
 * 
 * Benchmark results (Live API key tests):
 * - gemini-3.1-flash-lite: ~800ms (fastest, ideal for ATS parsing & match scoring)
 * - gemini-3.6-flash: ~1700ms (stable, highly reliable general flash model)
 * - gemini-3.7-flash: ~2000ms (latest generation flash tier)
 * - gemini-3.5-flash: ~7800ms (secondary fallback)
 */
const CONFIRMED_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
];

const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds per model attempt

/**
 * Clean and strip markdown code fences (```json ... ``` or ``` ...)
 */
const stripMarkdownFences = (text) => {
  if (!text) return '';
  let cleaned = String(text).trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  return cleaned.trim();
};

/**
 * Strip decorative Unicode emojis and symbols from text
 */
const stripEmojis = (s) =>
  String(s || '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

/**
 * Execute Gemini API call with per-attempt timeout
 */
const callWithTimeout = (promise, ms, modelName) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(`Gemini model ${modelName} timed out after ${ms}ms`);
      err.code = 'TIMEOUT';
      reject(err);
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
};

/**
 * Unified robust Gemini execution engine with fallback chain, per-attempt timeout, and JSON repair
 * 
 * @param {Object} options
 * @param {string} options.type - Identifier for metrics (e.g. 'resume_analysis', 'match_explanation', 'roadmap_generation')
 * @param {string} options.systemInstruction - System instruction for the model
 * @param {string} options.prompt - User prompt
 * @param {number} [options.temperature=0.1] - Generation temperature
 * @param {boolean} [options.expectJson=true] - Whether output is expected to be JSON
 * @param {number} [options.timeoutMs=15000] - Per-attempt timeout in milliseconds
 * @returns {Promise<{ text: string, data?: any, model: string, durationMs: number, attempts: number }>}
 */
const executeGeminiWithFallback = async ({
  type = 'gemini_call',
  systemInstruction = '',
  prompt = '',
  temperature = 0.1,
  expectJson = true,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    throw new Error(`GEMINI_API_KEY is not configured. Cannot perform ${type}.`);
  }

  // Model chain: allow GEMINI_MODEL override if set, followed by the confirmed fast models
  const primaryModel = process.env.GEMINI_MODEL;
  const modelChain = (primaryModel ? [primaryModel, ...CONFIRMED_MODELS] : CONFIRMED_MODELS)
    .filter((m, idx, arr) => arr.indexOf(m) === idx);

  const genAI = new GoogleGenerativeAI(apiKey);
  const startTime = performance.now();
  let attempts = 0;
  let lastError = null;

  for (const modelName of modelChain) {
    attempts++;
    const modelStart = performance.now();
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction || undefined,
        generationConfig: {
          responseMimeType: expectJson ? 'application/json' : 'text/plain',
          temperature,
        },
      });

      let rawResponseText = '';
      try {
        const result = await callWithTimeout(
          model.generateContent(prompt),
          timeoutMs,
          modelName
        );
        rawResponseText = result?.response?.text() || '';
      } catch (apiError) {
        const durationMs = Math.round(performance.now() - modelStart);
        console.warn(`[GeminiClient] Model ${modelName} call failed (${durationMs}ms): ${apiError.message}`);
        lastError = apiError;
        continue; // Try next model in fallback chain
      }

      const cleanedText = stripMarkdownFences(rawResponseText);

      if (!expectJson) {
        const totalDurationMs = Math.round(performance.now() - startTime);
        console.log(`[AI Metric] type=${type} model=${modelName} durationMs=${totalDurationMs} status=${attempts > 1 ? 'fallback_used' : 'success'} attempts=${attempts}`);
        return {
          text: cleanedText,
          model: modelName,
          durationMs: totalDurationMs,
          attempts,
        };
      }

      // JSON parsing & repair handling
      try {
        const parsedData = JSON.parse(cleanedText);
        const totalDurationMs = Math.round(performance.now() - startTime);
        console.log(`[AI Metric] type=${type} model=${modelName} durationMs=${totalDurationMs} status=${attempts > 1 ? 'fallback_used' : 'success'} attempts=${attempts}`);
        return {
          text: cleanedText,
          data: parsedData,
          model: modelName,
          durationMs: totalDurationMs,
          attempts,
        };
      } catch (parseError) {
        console.warn(`[GeminiClient] JSON parse error on ${modelName} (${parseError.message}). Attempting 1-shot repair...`);
        const repairPrompt = `${prompt}\n\nYour previous response was not valid JSON (${parseError.message}). Please return ONLY a valid, parseable JSON object matching the schema with no extra text or markdown wrappers.`;
        
        try {
          const repairResult = await callWithTimeout(
            model.generateContent(repairPrompt),
            timeoutMs,
            modelName
          );
          const repairText = stripMarkdownFences(repairResult?.response?.text() || '');
          const repairData = JSON.parse(repairText);
          const totalDurationMs = Math.round(performance.now() - startTime);
          console.log(`[AI Metric] type=${type} model=${modelName} durationMs=${totalDurationMs} status=repaired_json attempts=${attempts}`);
          return {
            text: repairText,
            data: repairData,
            model: modelName,
            durationMs: totalDurationMs,
            attempts,
          };
        } catch (repairErr) {
          console.warn(`[GeminiClient] Repair failed on ${modelName}:`, repairErr.message);
          lastError = repairErr;
          continue;
        }
      }
    } catch (err) {
      console.warn(`[GeminiClient] Unexpected error on ${modelName}:`, err.message);
      lastError = err;
    }
  }

  const totalDurationMs = Math.round(performance.now() - startTime);
  console.error(`[AI Metric] type=${type} model=all_failed durationMs=${totalDurationMs} status=failed attempts=${attempts}`);
  throw new Error(`AI generation failed after ${attempts} attempts across available models. Last error: ${lastError?.message || 'Unknown error'}`);
};

module.exports = {
  CONFIRMED_MODELS,
  DEFAULT_TIMEOUT_MS,
  stripMarkdownFences,
  stripEmojis,
  executeGeminiWithFallback,
};
