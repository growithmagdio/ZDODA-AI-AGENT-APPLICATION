import { z } from 'zod';

// ============================================================================
// Roles & Authorization
// ============================================================================
export const WorkspaceRoleEnum = z.enum(['OWNER', 'ADMIN', 'BUILDER', 'AGENT', 'VIEWER']);
export type WorkspaceRole = z.infer<typeof WorkspaceRoleEnum>;

export const GlobalRoleEnum = z.enum(['USER', 'SUPERADMIN']);
export type GlobalRole = z.infer<typeof GlobalRoleEnum>;

export interface RequestContext {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  email: string;
}

// ============================================================================
// Auth DTOs & Schemas
// ============================================================================
export const SignupInputSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  workspaceName: z.string().min(2, 'Workspace name must be at least 2 characters').optional(),
});
export type SignupInput = z.infer<typeof SignupInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const ForgotPasswordInputSchema = z.object({
  email: z.string().email('Invalid email address'),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;

export const ResetPasswordInputSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;

export const VerifyEmailInputSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});
export type VerifyEmailInput = z.infer<typeof VerifyEmailInputSchema>;

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable().optional(),
  emailVerified: z.boolean(),
  role: GlobalRoleEnum,
  createdAt: z.string(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

// ============================================================================
// Workspace & Onboarding DTOs
// ============================================================================
export const CreateWorkspaceInputSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and dashes').optional(),
  category: z.string().optional(),
});
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInputSchema>;

export const WorkspaceListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().nullable().optional(),
  role: WorkspaceRoleEnum,
  isDefault: z.boolean().optional(),
});
export type WorkspaceListItem = z.infer<typeof WorkspaceListItemSchema>;

export const OnboardingProgressSchema = z.object({
  currentStep: z.number().int().min(1).max(7),
  completedSteps: z.array(z.number()),
  isComplete: z.boolean(),
});
export type OnboardingProgress = z.infer<typeof OnboardingProgressSchema>;

export const UpdateOnboardingInputSchema = z.object({
  step: z.number().int().min(1).max(7),
  businessName: z.string().optional(),
  category: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
});
export type UpdateOnboardingInput = z.infer<typeof UpdateOnboardingInputSchema>;

// ============================================================================
// Plans, Quotas & Demo Values
// ============================================================================
export interface PlanQuota {
  planId: string;
  name: string;
  slug: 'starter' | 'pro' | 'business' | 'agency';
  priceMonthlyCents: number;
  priceYearlyCents: number;
  showPrice: boolean;
  messageLimit: number;
  voiceSecondsLimit: number;
  agentLimit: number;
  features: string[];
}

export const DEMO_PLANS: PlanQuota[] = [
  {
    planId: 'plan_starter',
    name: 'Starter',
    slug: 'starter',
    priceMonthlyCents: 4900,
    priceYearlyCents: 3900 * 12,
    showPrice: true,
    messageLimit: 1000,
    voiceSecondsLimit: 0,
    agentLimit: 1,
    features: ['1 AI Agent', 'Website Chat Widget', 'Basic Knowledge Base', 'Essential Integrations', '1,000 messages / mo'],
  },
  {
    planId: 'plan_pro',
    name: 'Pro',
    slug: 'pro',
    priceMonthlyCents: 9900,
    priceYearlyCents: 7900 * 12,
    showPrice: true,
    messageLimit: 10000,
    voiceSecondsLimit: 3600,
    agentLimit: 5,
    features: ['5 AI Agents', 'Website Chat (WhatsApp soon)', 'Inbound Voice AI (soon)', 'Advanced RAG Knowledge', 'Tools & Integrations', '10,000 messages / mo'],
  },
  {
    planId: 'plan_business',
    name: 'Business',
    slug: 'business',
    priceMonthlyCents: 19900,
    priceYearlyCents: 15900 * 12,
    showPrice: true,
    messageLimit: 50000,
    voiceSecondsLimit: 18000,
    agentLimit: 999999,
    features: ['Unlimited Agents', 'White-Label Widget', 'Multi-Workspace Support', 'Custom Integrations', 'Priority Support', '50,000 messages / mo'],
  },
  {
    planId: 'plan_agency',
    name: 'Agency',
    slug: 'agency',
    priceMonthlyCents: 0,
    priceYearlyCents: 0,
    showPrice: false,
    messageLimit: 250000,
    voiceSecondsLimit: 90000,
    agentLimit: 999999,
    features: ['Client Sub-Workspaces', 'White-Label & Custom Domains', 'Agency Consolidated Billing', 'Dedicated Success Architect'],
  },
];

// ============================================================================
// Status Pill Contract (Honesty Contract - Rule 01)
// ============================================================================
export const StatusPillEnum = z.enum(['live', 'test_mode', 'demo', 'setup_required', 'coming_soon']);
export type StatusPillState = z.infer<typeof StatusPillEnum>;

// ============================================================================
// WidgetConfigV1 Schema & Defaults (Rule 04)
// ============================================================================
export const WidgetConfigV1Schema = z.object({
  schemaVersion: z.literal(1).default(1),
  brand: z.object({
    botName: z.string().default('Dental Assistant'),
    tagline: z.string().default('Always here to assist with appointments & clinic questions'),
    logoUrl: z.string().optional(),
    avatar: z.object({
      type: z.enum(['upload', 'initials', 'generated']).default('initials'),
      url: z.string().optional(),
      initials: z.string().default('DA'),
    }).default({ type: 'initials', initials: 'DA' }),
    headerImageUrl: z.string().optional(),
  }).default({
    botName: 'Dental Assistant',
    tagline: 'Always here to assist with appointments & clinic questions',
    avatar: { type: 'initials', initials: 'DA' },
  }),
  theme: z.object({
    preset: z.enum(['violet', 'glass', 'midnight', 'mint', 'coral', 'graphite']).default('violet'),
    primary: z.string().default('#6538F5'),
    palette: z.enum(['auto', 'custom']).default('auto'),
    colors: z.object({
      header: z.string().optional(),
      headerText: z.string().optional(),
      userBubble: z.string().optional(),
      userText: z.string().optional(),
      botBubble: z.string().optional(),
      botText: z.string().optional(),
      button: z.string().optional(),
      buttonText: z.string().optional(),
      surface: z.string().optional(),
      text: z.string().optional(),
    }).optional(),
    appearance: z.enum(['light', 'dark', 'auto']).default('light'),
    fontFamily: z.enum(['system', 'inter', 'serif', 'rounded']).default('system'),
    radius: z.union([z.literal(8), z.literal(14), z.literal(20), z.literal(28)]).default(14),
    density: z.enum(['compact', 'comfortable']).default('comfortable'),
  }).default({
    preset: 'violet',
    primary: '#6538F5',
    palette: 'auto',
    appearance: 'light',
    fontFamily: 'system',
    radius: 14,
    density: 'comfortable',
  }),
  background: z.object({
    type: z.enum(['solid', 'gradient', 'aurora', 'particles', 'waves', 'bokeh', 'image', 'video', 'lottie']).default('solid'),
    colors: z.array(z.string()).default(['#F7F8FF', '#FFFFFF']),
    speed: z.number().min(0).max(2).default(1),
    opacity: z.number().min(0).max(1).default(1),
    blur: z.number().min(0).max(40).default(0),
    imageUrl: z.string().optional(),
    videoUrl: z.string().optional(),
    lottieUrl: z.string().optional(),
    respectReducedMotion: z.boolean().default(true),
  }).default({
    type: 'solid',
    colors: ['#F7F8FF', '#FFFFFF'],
    speed: 1,
    opacity: 1,
    blur: 0,
    respectReducedMotion: true,
  }),
  launcher: z.object({
    style: z.enum(['icon', 'text', 'icon_text']).default('icon'),
    shape: z.enum(['circle', 'pill', 'square']).default('circle'),
    icon: z.string().default('message-circle'),
    label: z.string().default('Chat with us'),
    size: z.number().min(48).max(72).default(56),
    position: z.enum(['right', 'left']).default('right'),
    offsetX: z.number().default(20),
    offsetY: z.number().default(20),
    entrance: z.enum(['none', 'fade', 'pop', 'slide']).default('pop'),
    unreadBadge: z.boolean().default(true),
    glass: z.boolean().default(false),
  }).default({
    style: 'icon',
    shape: 'circle',
    icon: 'message-circle',
    label: 'Chat with us',
    size: 56,
    position: 'right',
    offsetX: 20,
    offsetY: 20,
    entrance: 'pop',
    unreadBadge: true,
    glass: false,
  }),
  texts: z.object({
    welcomeTitle: z.string().default('Smile Dental Clinic Assistant'),
    welcomeMessage: z.string().default('Hello! I can answer questions about our dental services, pricing, and book your appointment in seconds.'),
    placeholder: z.string().default('Type your question here...'),
    disclaimer: z.string().default('AI Agent powered by Zdoda. Never replaces medical consultation.'),
    footerText: z.string().default('Powered by Zdoda'),
    privacyUrl: z.string().optional(),
    quickReplies: z.array(z.string()).default(['Book an appointment', 'Check treatment pricing', 'Clinic hours & directions', 'Emergency contact']),
    language: z.string().default('auto'),
    translate: z.boolean().default(true),
  }).default({
    welcomeTitle: 'Smile Dental Clinic Assistant',
    welcomeMessage: 'Hello! I can answer questions about our dental services, pricing, and book your appointment in seconds.',
    placeholder: 'Type your question here...',
    disclaimer: 'AI Agent powered by Zdoda. Never replaces medical consultation.',
    footerText: 'Powered by Zdoda',
    quickReplies: ['Book an appointment', 'Check treatment pricing', 'Clinic hours & directions', 'Emergency contact'],
    language: 'auto',
    translate: true,
  }),
  layout: z.object({
    mode: z.enum(['bubble', 'inline', 'side_panel', 'popup', 'fullpage']).default('bubble'),
    width: z.number().default(400),
    height: z.number().default(640),
    inlineSelector: z.string().optional(),
  }).default({
    mode: 'bubble',
    width: 400,
    height: 640,
  }),
  behavior: z.object({
    proactiveGreeting: z.object({
      enabled: z.boolean().default(false),
      delaySec: z.number().default(5),
      message: z.string().default('Need help scheduling a visit today?'),
    }).optional(),
    openOnLoad: z.boolean().default(false),
    soundOnMessage: z.boolean().default(true),
  }).default({
    openOnLoad: false,
    soundOnMessage: true,
  }),
  advanced: z.object({
    customCss: z.string().optional(),
    hideBranding: z.boolean().default(false),
  }).default({
    hideBranding: false,
  }),
});
export type WidgetConfigV1 = z.infer<typeof WidgetConfigV1Schema>;
export const DEFAULT_WIDGET_CONFIG: WidgetConfigV1 = WidgetConfigV1Schema.parse({});

// ============================================================================
// Firebase chat MVP — domain DTOs shared by web, functions and widget
// ============================================================================
export const EMBEDDING_DIMENSIONS = 768;

export const LlmProviderEnum = z.enum(['anthropic', 'openai', 'gemini', 'mock']);
export type LlmProvider = z.infer<typeof LlmProviderEnum>;

export interface ModelOption {
  id: string;
  provider: LlmProvider;
  label: string;
  note?: string;
}

/** Models offered in the Agent builder. Any other model id can be typed in as "custom". */
export const MODEL_CATALOG: ModelOption[] = [
  { id: 'claude-sonnet-5-5', provider: 'anthropic', label: 'Claude Sonnet 5.5', note: 'Best quality' },
  { id: 'claude-haiku-5-5', provider: 'anthropic', label: 'Claude Haiku 5.5', note: 'Fast & low cost' },
  { id: 'gpt-5-mini', provider: 'openai', label: 'GPT-5 mini' },
  { id: 'gpt-4.1-mini', provider: 'openai', label: 'GPT-4.1 mini' },
  { id: 'gemini-2.5-flash', provider: 'gemini', label: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro', provider: 'gemini', label: 'Gemini 2.5 Pro' },
  { id: 'zdoda-demo', provider: 'mock', label: 'Demo model', note: 'No API key needed — answers from your knowledge base only' },
];

export const AgentInputSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(280).optional().default(''),
  systemPrompt: z.string().max(8000).default(''),
  greeting: z.string().max(500).default('Hi! How can I help you today?'),
  fallbackMessage: z
    .string()
    .max(500)
    .default("I'm not sure about that. Would you like me to connect you with our team?"),
  model: z
    .object({
      provider: LlmProviderEnum.default('mock'),
      id: z.string().min(1).default('zdoda-demo'),
      temperature: z.number().min(0).max(1).default(0.3),
    })
    .default({ provider: 'mock', id: 'zdoda-demo', temperature: 0.3 }),
  language: z.string().default('auto'),
  knowledgeSourceIds: z.array(z.string()).default([]), // empty = all sources in the workspace
  useKnowledge: z.boolean().default(true),
  strictKnowledge: z.boolean().default(true), // only answer from the knowledge base
  handoffEnabled: z.boolean().default(true),
  handoffMessage: z.string().max(500).default('Sure — I have notified our team. Someone will reply here shortly.'),
  leadCapture: z.boolean().default(true),
  bookingUrl: z.string().url().optional().or(z.literal('')).default(''),
});
export type AgentInput = z.infer<typeof AgentInputSchema>;

export interface AgentDTO extends AgentInput {
  id: string;
  status: 'draft' | 'published';
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const KnowledgeSourceTypeEnum = z.enum(['url', 'sitemap', 'file', 'text', 'faq']);
export type KnowledgeSourceType = z.infer<typeof KnowledgeSourceTypeEnum>;
export type KnowledgeSourceStatus = 'queued' | 'processing' | 'ready' | 'failed';

export const CreateKnowledgeSourceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('url'), url: z.string().url(), name: z.string().max(120).optional() }),
  z.object({
    type: z.literal('sitemap'),
    url: z.string().url(),
    name: z.string().max(120).optional(),
    maxPages: z.number().int().min(1).max(500).optional(),
  }),
  z.object({ type: z.literal('text'), name: z.string().min(1).max(120), text: z.string().min(1).max(200_000) }),
  z.object({
    type: z.literal('faq'),
    name: z.string().min(1).max(120),
    items: z.array(z.object({ q: z.string().min(1).max(500), a: z.string().min(1).max(4000) })).min(1).max(500),
  }),
]);
export type CreateKnowledgeSourceInput = z.infer<typeof CreateKnowledgeSourceSchema>;

export interface KnowledgeSourceDTO {
  id: string;
  type: KnowledgeSourceType;
  name: string;
  url?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  status: KnowledgeSourceStatus;
  error?: string | null;
  chunkCount: number;
  charCount: number;
  pageCount?: number;
  embeddingModel?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Citation {
  sourceId: string;
  title: string;
  url?: string | null;
  snippet: string;
}

export type ChannelType = 'web' | 'test' | 'whatsapp' | 'voice';
export type ConversationStatus = 'open' | 'handoff' | 'resolved';
export type MessageRole = 'user' | 'assistant' | 'human' | 'system';

export interface MessageDTO {
  id: string;
  role: MessageRole;
  text: string;
  citations?: Citation[];
  authorName?: string | null;
  createdAt: string;
}

export interface ConversationDTO {
  id: string;
  channel: ChannelType;
  agentId: string;
  agentName?: string;
  widgetId?: string | null;
  status: ConversationStatus;
  takeover: boolean;
  assignedTo?: string | null;
  contact: { name?: string | null; email?: string | null; phone?: string | null };
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  pageUrl?: string | null;
  createdAt: string;
}

export interface WidgetDTO {
  id: string;
  name: string;
  agentId: string;
  draftConfig: WidgetConfigV1;
  publishedConfig: WidgetConfigV1 | null;
  publishedVersion: number;
  hasUnpublishedChanges: boolean;
  allowedOrigins: string[];
  publishedAt?: string | null;
  updatedAt: string;
}

export interface UsageDTO {
  period: string; // YYYY-MM
  messages: number;
  messageLimit: number;
  agents: number;
  agentLimit: number;
}

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';

export interface BillingDTO {
  plan: PlanQuota['slug'];
  status: SubscriptionStatus;
  provider: 'stripe' | 'mock';
  interval: 'month' | 'year';
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  stripeConfigured: boolean;
}

export interface SystemStatusDTO {
  llm: { provider: LlmProvider; live: boolean; available: LlmProvider[] };
  embeddings: { provider: 'openai' | 'gemini' | 'mock'; live: boolean; model: string };
  payments: { provider: 'stripe' | 'mock'; live: boolean };
  email: { provider: 'resend' | 'log'; live: boolean };
  storage: { live: boolean };
}

export function getPlan(slug: string | undefined | null): PlanQuota {
  return DEMO_PLANS.find((p) => p.slug === slug) || DEMO_PLANS[0];
}

export function usagePeriod(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export const IntegrationKindEnum = z.enum(['webhook', 'booking_link', 'google_sheets', 'slack', 'hubspot', 'zapier', 'make', 'n8n', 'google_calendar']);
export type IntegrationKind = z.infer<typeof IntegrationKindEnum>;

export interface IntegrationDTO {
  id: string;
  kind: IntegrationKind;
  name: string;
  status: 'connected' | 'error';
  config: Record<string, unknown>;
  events: string[];
  lastRunAt?: string | null;
  lastError?: string | null;
  createdAt: string;
}
