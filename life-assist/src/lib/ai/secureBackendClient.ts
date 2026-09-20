import type { AiClient, AiTurn, AiTool } from './types';
import { getAppCheckToken } from '@/lib/firebase';

/**
 * Production client: calls the Firebase Function in functions/src/index.ts
 * instead of Gemini directly. The API key lives only on the server; this
 * class never sees it. See functions/README.md for deployment.
 */
export class SecureBackendClient implements AiClient {
  label = 'LifeAssist server';

  constructor(private apiUrl: string) {}

  isConfigured() {
    return this.apiUrl.trim().length > 0;
  }

  async send(history: AiTurn[], prompt: string, tools?: AiTool[]): Promise<string> {
    const appCheckToken = await getAppCheckToken();

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (appCheckToken) headers['X-Firebase-AppCheck'] = appCheckToken;

    const requestBody: any = { history, prompt };
    
    // In a real implementation, the backend would also need to be updated to forward
    // these tools to the Gemini API and handle the multi-turn function calling protocol.
    if (tools && tools.length > 0) {
      requestBody.tools = tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      }));
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const message = result?.error ?? `Request failed (${response.status}).`;
      throw new Error(message);
    }
    if (!result?.text) {
      throw new Error('The assistant returned an empty response. Try rephrasing.');
    }
    return result.text as string;
  }
}
