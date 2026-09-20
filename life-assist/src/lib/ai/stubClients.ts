import type { AiClient, AiTool } from './types';

export class StubClient implements AiClient {
  label: string;

  constructor(private providerName: string) {
    this.label = providerName;
  }

  isConfigured() {
    return false;
  }

  async send(_history: { role: 'user' | 'model'; text: string }[], _prompt: string, _tools?: AiTool[]): Promise<string> {
    return `[${this.providerName} Integration] Currently, only Google Gemini is fully implemented for local use. Please switch to Gemini in settings or deploy the secure backend.`;
  }
}
