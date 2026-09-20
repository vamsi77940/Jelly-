export interface AiTurn {
  role: 'user' | 'model';
  text: string;
}

export interface AiTool {
  name: string;
  description: string;
  parameters: any; // JSON schema for arguments
  execute: (args: any) => Promise<string> | string;
}

export interface AiClient {
  /** Human-readable name for display in Settings ("Gemini · dev key", "LifeAssist server", ...). */
  label: string;
  /** Whether the client is currently usable (key present, backend reachable, etc). */
  isConfigured(): boolean;
  send(history: AiTurn[], prompt: string, tools?: AiTool[]): Promise<string>;
}

export class UnconfiguredAiClient implements AiClient {
  label = 'Not configured';
  isConfigured() {
    return false;
  }
  async send(): Promise<string> {
    throw new Error(
      'The AI Assistant isn\u2019t configured yet. Add a Gemini API key in Settings to enable it for local development.'
    );
  }
}
