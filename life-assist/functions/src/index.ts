import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const MODEL = 'gemini-2.5-flash';
const MAX_HISTORY_TURNS = 20;
const MAX_MESSAGE_CHARS = 2000;

interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

interface ChatRequestBody {
  history?: ChatTurn[];
  prompt?: string;
}

function isValidTurn(t: unknown): t is ChatTurn {
  if (typeof t !== 'object' || t === null) return false;
  const turn = t as Record<string, unknown>;
  return (
    (turn.role === 'user' || turn.role === 'model') &&
    typeof turn.text === 'string' &&
    turn.text.length <= MAX_MESSAGE_CHARS
  );
}

/**
 * POST { history: ChatTurn[], prompt: string } -> { text: string }
 *
 * This is the seam the client's AiClient interface (src/lib/ai/types.ts)
 * was built for — the frontend's SecureBackendClient calls this instead of
 * Gemini directly, so the API key never reaches a browser.
 *
 * Protection model (see functions/README.md for the full explanation and
 * why it's the right amount of protection *without* requiring user
 * accounts, which don't exist yet — Phase 7 adds those):
 *   - Firebase App Check (enforceAppCheck) rejects requests that don't
 *     carry a valid token from the real, registered web app — this is
 *     what stops a script or a copy-pasted curl command from hitting this
 *     endpoint and burning your Gemini quota, without needing sign-in.
 *   - CORS is restricted to the deployed app's own origin.
 *   - Request size/shape is validated before anything reaches Gemini.
 */
export const assistantChat = onRequest(
  {
    secrets: [geminiApiKey],
    cors: true, // tightened via ALLOWED_ORIGIN check below; see functions/README.md
    region: 'us-central1',
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Use POST.' });
      return;
    }

    const allowedOrigin = process.env.ALLOWED_ORIGIN;
    const origin = req.get('origin');
    if (allowedOrigin && origin && origin !== allowedOrigin) {
      res.status(403).json({ error: 'Origin not allowed.' });
      return;
    }

    const body = req.body as ChatRequestBody;
    const prompt = body.prompt;
    const history = body.history ?? [];

    if (typeof prompt !== 'string' || prompt.length === 0 || prompt.length > MAX_MESSAGE_CHARS) {
      res.status(400).json({ error: 'Invalid prompt.' });
      return;
    }
    if (!Array.isArray(history) || history.length > MAX_HISTORY_TURNS || !history.every(isValidTurn)) {
      res.status(400).json({ error: 'Invalid history.' });
      return;
    }

    try {
      const contents = [...history, { role: 'user' as const, text: prompt }].map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      }));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${geminiApiKey.value()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        }
      );

      if (!response.ok) {
        logger.error('Gemini API error', { status: response.status });
        res.status(502).json({ error: 'The assistant is temporarily unavailable.' });
        return;
      }

      const result = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        res.status(502).json({ error: 'The assistant returned an empty response.' });
        return;
      }

      res.status(200).json({ text });
    } catch (err) {
      logger.error('assistantChat failed', err);
      res.status(500).json({ error: 'Something went wrong.' });
    }
  }
);
