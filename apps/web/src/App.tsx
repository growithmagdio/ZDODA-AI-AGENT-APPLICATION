import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth } from './components/guards/RequireAuth';
import { PublicOnlyRoute } from './components/guards/PublicOnlyRoute';
import { LandingPage } from './pages/public/LandingPage';
import { PricingPage } from './pages/public/PricingPage';
import { PublicTemplatesPage } from './pages/public/PublicTemplatesPage';
import { NotFoundPage } from './pages/public/NotFoundPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { DesignPage } from './pages/design/DesignPage';
import { FeaturePlaceholderPage } from './pages/placeholder/FeaturePlaceholderPage';
import {
  Bot,
  BookOpen,
  Wrench,
  Radio,
  Palette,
  Inbox,
  Phone,
  BarChart3,
  Boxes,
  Users,
  CreditCard,
  Settings,
} from 'lucide-react';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* 1. Public Routes (No authentication required, zero redirects) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/templates" element={<PublicTemplatesPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* 2. Public-Only Routes (Guests only; if authenticated, redirects to /dashboard) */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>

            {/* 3. Protected Routes (Authenticated only; shows skeleton on loading, bounces to /login with returnTo) */}
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/design" element={<DesignPage />} />

              {/* Phased Feature Placeholders with Honest Status */}
              <Route
                path="/agents"
                element={
                  <FeaturePlaceholderPage
                    title="Agent Builder & Catalog"
                    description="Build, tune, and publish multi-channel conversational agents with model configuration, streaming test sandbox, and prompt editing."
                    phase={3}
                    icon={<Bot className="w-8 h-8" />}
                  />
                }
              />
              <Route
                path="/knowledge"
                element={
                  <FeaturePlaceholderPage
                    title="Knowledge Base & Ingestion"
                    description="Upload PDFs, sync website sitemaps, and train your agents with BullMQ RAG chunking and pgvector search."
                    phase={3}
                    icon={<BookOpen className="w-8 h-8" />}
                  />
                }
              />
              <Route
                path="/tools"
                element={
                  <FeaturePlaceholderPage
                    title="Tools & Integrations"
                    description="Connect Google Calendar, Slack, HubSpot, Make, n8n, and custom REST API endpoints with AES-256-GCM token encryption."
                    phase={5}
                    icon={<Wrench className="w-8 h-8" />}
                  />
                }
              />
              <Route
                path="/channels"
                element={
                  <FeaturePlaceholderPage
                    title="Channels Directory"
                    description="Configure Website Chat, WhatsApp Cloud API, and Twilio Inbound Voice telephony from one dashboard."
                    phase={5}
                    icon={<Radio className="w-8 h-8" />}
                  />
                }
              />
              <Route
                path="/widget-studio"
                element={
                  <FeaturePlaceholderPage
                    title="Widget Studio"
                    description="Zdoda's core differentiator: No-code visual editor with live sub-100ms Shadow DOM runtime preview, theme presets, and background shaders."
                    phase={4}
                    icon={<Palette className="w-8 h-8" />}
                  />
                }
              />
              <Route
                path="/inbox"
                element={
                  <FeaturePlaceholderPage
                    title="Omnichannel Inbox"
                    description="Live conversation viewer with audio player, contact dossiers, and instant human takeover."
                    phase={5}
                    icon={<Inbox className="w-8 h-8" />}
                  />
                }
              />
              <Route
                path="/phone-numbers"
                element={
                  <FeaturePlaceholderPage
                    title="Phone Numbers"
                    description="Search, buy, port, and assign telephony phone numbers directly to conversational voice agents."
                    phase={5}
                    icon={<Phone className="w-8 h-8" />}
                  />
                }
              />
              <Route
                path="/analytics"
                element={
                  <FeaturePlaceholderPage
                    title="Analytics & Reports"
                    description="Omnichannel volume breakdowns, resolution rates, agent performance leaderboards, and CSV exports."
                    phase={6}
                    icon={<BarChart3 className="w-8 h-8" />}
                  />
                }
              />
              <Route
                path="/team"
                element={
                  <FeaturePlaceholderPage
                    title="Team & Collaboration"
                    description="Manage workspace members, assign RBAC roles (Owner, Admin, Builder, Agent, Viewer), and inspect the audit log."
                    phase={6}
                    icon={<Users className="w-8 h-8" />}
                  />
                }
              />
              <Route
                path="/billing"
                element={
                  <FeaturePlaceholderPage
                    title="Billing & Subscription"
                    description="Stripe Checkout, customer portal, invoices, plan quotas, and usage meter tracking."
                    phase={2}
                    icon={<CreditCard className="w-8 h-8" />}
                  />
                }
              />
              <Route
                path="/settings"
                element={
                  <FeaturePlaceholderPage
                    title="Settings & Accessibility"
                    description="User profile, security sessions, and accessibility settings (Reduce Motion, Reduce Transparency, Theme preferences)."
                    phase={6}
                    icon={<Settings className="w-8 h-8" />}
                  />
                }
              />
            </Route>

            {/* 4. Catch-all Designed 404 Route (Never redirects to /login) */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
