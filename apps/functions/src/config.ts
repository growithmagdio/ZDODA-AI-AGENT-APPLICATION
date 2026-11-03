import type { LlmProvider } from '@zdoda/shared';

const env = (key: string, fallback = ''): string => (process.env[key] ?? fallback).trim();

export const config = {
  get webAppUrl() {
    return env('WEB_APP_URL', 'http://localhost:5173').replace(/\/$/, '');
  },
  get publicApiUrl() {
    // Base URL that embedded widgets call. Defaults to the web app (Hosting rewrites /api to the function).
    return env('PUBLIC_API_URL', this.webAppUrl).replace(/\/$/, '');
  },
  get corsOrigins() {
    return env('CORS_ALLOWED_ORIGINS', this.webAppUrl)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  },
  get encryptionKey() {
    return env('ENCRYPTION_KEY');
  },
  get llmProvider(): LlmProvider {
    const p = env('LLM_PROVIDER', 'auto');
    if (p === 'anthropic' || p === 'openai' || p === 'gemini' || p === 'mock') return p;
    if (this.anthropicKey) return 'anthropic';
    if (this.openaiKey) return 'openai';
    if (this.geminiKey) return 'gemini';
    return 'mock';
  },
  get anthropicKey() {
    return env('ANTHROPIC_API_KEY');
  },
  get openaiKey() {
    return env('OPENAI_API_KEY');
  },
  get geminiKey() {
    return env('GEMINI_API_KEY');
  },
  get defaultModels(): Record<Exclude<LlmProvider, 'mock'>, string> {
    return {
      anthropic: env('ANTHROPIC_DEFAULT_MODEL', 'claude-haiku-5-5'),
      openai: env('OPENAI_DEFAULT_MODEL', 'gpt-4.1-mini'),
      gemini: env('GEMINI_DEFAULT_MODEL', 'gemini-2.5-flash'),
    };
  },
  get embeddingProvider(): 'openai' | 'gemini' | 'mock' {
    const p = env('EMBEDDING_PROVIDER', 'auto');
    if (p === 'openai' || p === 'gemini' || p === 'mock') return p;
    if (this.openaiKey) return 'openai';
    if (this.geminiKey) return 'gemini';
    return 'mock';
  },
  get stripeSecretKey() {
    return env('STRIPE_SECRET_KEY');
  },
  get stripeWebhookSecret() {
    return env('STRIPE_WEBHOOK_SECRET');
  },
  stripePrice(plan: string, interval: 'month' | 'year') {
    return env(`STRIPE_PRICE_${plan.toUpperCase()}_${interval === 'month' ? 'MONTHLY' : 'YEARLY'}`);
  },
  get resendKey() {
    return env('RESEND_API_KEY');
  },
  get emailFrom() {
    return env('EMAIL_FROM', 'Zdoda <noreply@zdoda.app>');
  },
  get trialDays() {
    return Number(env('TRIAL_DAYS', '14')) || 14;
  },
  get ingestMode(): 'inline' | 'trigger' {
    return env('INGEST_MODE', 'inline') === 'trigger' ? 'trigger' : 'inline';
  },
  get maxSitemapPages() {
    return Number(env('MAX_SITEMAP_PAGES', '50')) || 50;
  },
  get allowPrivateUrls() {
    // Only for local testing: lets the crawler fetch localhost pages.
    return env('ALLOW_PRIVATE_URLS') === 'true';
  },
};
