/**
 * PREDATOR MLIP — SOCINT Service
 * Social Intelligence: Telegram, GitHub, OSINT profile lookups.
 */
import { SocintResult } from '../../src/types/mlip';

export class SocintService {

  // ─── Telegram Public Profile Search ──────────────────────────────────
  async searchTelegram(_query: string): Promise<SocintResult[]> {
    const results: SocintResult[] = [];
    
    // In production, this would use MTProto API (Telethon/GramJS) or a scraping service.
    // Here we use a generic placeholder for the backend implementation.
    const botToken = process.env['TELEGRAM_BOT_TOKEN'];
    if (botToken) {
      try {
        // Fallback to bot API if MTProto is unavailable (limited to bot interactions)
        // Usually, SOCINT requires user-bot MTProto to search public channels.
        console.warn('[SOCINT] Using Bot API for Telegram search (limited scope).');
      } catch (e) {
        console.error('[SOCINT] Telegram search failed', e);
      }
    }

    return results;
  }

  // ─── GitHub Profile Lookup ────────────────────────────────────────────
  async getGithubProfile(username: string): Promise<SocintResult> {
    const result: SocintResult = {
      platform: 'GITHUB',
      username,
      profileUrl: `https://github.com/${username}`,
      metadata: {},
      activityScore: 0,
    };

    const token = process.env['GITHUB_TOKEN'];
    const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json' };
    if (token) headers['Authorization'] = `token ${token}`;

    try {
      const res = await fetch(`https://api.github.com/users/${username}`, {
        headers,
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        result.metadata = {
          name: data.name,
          company: data.company,
          blog: data.blog,
          location: data.location,
          email: data.email,
          bio: data.bio,
          public_repos: data.public_repos,
          followers: data.followers,
          following: data.following,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        // Calculate basic activity score (0-100)
        result.activityScore = Math.min(100, (data.public_repos * 2) + (data.followers * 0.5));
      }
    } catch (e) {
      console.error('[SOCINT] GitHub profile lookup failed', e);
    }

    return result;
  }
}

export const socintService = new SocintService();
