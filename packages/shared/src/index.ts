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
    features: ['5 AI Agents', 'Website Chat + WhatsApp', 'Inbound Voice AI', 'Advanced RAG Knowledge', 'Tools & Integrations', '10,000 messages / mo'],
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
