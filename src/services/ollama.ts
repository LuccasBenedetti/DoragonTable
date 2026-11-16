export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  details: {
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export class OllamaService {
  private static baseUrl = 'http://127.0.0.1:11434';

  public static setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  public static getBaseUrl(): string {
    return this.baseUrl;
  }

  public static async checkConnection(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  public static async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.models || []).map((m: any) => m.name);
    } catch (err) {
      console.warn('Could not fetch models from Ollama:', err);
      return [
        'fluffy/llama-3.1-8b-stheno-v3.4:latest',
        'richardyoung/llama-3.1-8b-instruct-abliterated:latest',
        'dolphin3:latest',
        'Dark-Eve:latest'
      ];
    }
  }

  public static async generateChatResponse(
    model: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    temperature: number = 0.7,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        options: {
          temperature,
          num_ctx: 8192,
        },
        stream: !!onChunk,
      }),
    });

    if (!res.ok) {
      throw new Error(`Erro na comunicação com Ollama (${res.status}): ${res.statusText}`);
    }

    if (onChunk && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter((l) => l.trim() !== '');
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              fullText += parsed.message.content;
              onChunk(parsed.message.content);
            }
          } catch {
            // ignore partial JSON chunk
          }
        }
      }
      return fullText;
    } else {
      const data = await res.json();
      return data.message?.content || '';
    }
  }
}
