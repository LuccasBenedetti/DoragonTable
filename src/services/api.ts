// DoragonTable API Client (Conecta à Vercel ou usa cache local offline)

export const API_BASE_URL = localStorage.getItem('doragontable_api_url') || 'https://doragontable.vercel.app';

export class DoragonAPI {
  public static setBaseUrl(url: string) {
    localStorage.setItem('doragontable_api_url', url.replace(/\/+$/, ''));
  }

  public static getBaseUrl(): string {
    return localStorage.getItem('doragontable_api_url') || 'https://doragontable.vercel.app';
  }

  // Verifica se o servidor Vercel está online
  public static async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/campaigns`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  // Registro de usuário na Vercel
  public static async register(email: string, username: string, password?: string) {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/auth?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[DoragonAPI] Servidor remoto offline, operando em modo local.');
      return null;
    }
  }

  // Login de usuário na Vercel
  public static async login(email: string, password?: string) {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/auth?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[DoragonAPI] Servidor remoto offline, operando em modo local.');
      return null;
    }
  }
}
