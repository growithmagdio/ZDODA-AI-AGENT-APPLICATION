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
import { Phone } from 'lucide-react';
import { ToastProvider } from './context/ToastContext';
import { AgentsPage } from './pages/agents/AgentsPage';
import { AgentBuilderPage } from './pages/agents/AgentBuilderPage';
import { KnowledgePage } from './pages/knowledge/KnowledgePage';
import { ToolsPage } from './pages/tools/ToolsPage';
import { ChannelsPage } from './pages/channels/ChannelsPage';
import { WidgetStudioPage } from './pages/widget/WidgetStudioPage';
import { InboxPage } from './pages/inbox/InboxPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { TeamPage } from './pages/team/TeamPage';
import { BillingPage } from './pages/billing/BillingPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { InvitePage } from './pages/invite/InvitePage';
import { AuthActionPage } from './pages/auth/AuthActionPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, err: any) => count < 2 && !(err?.status >= 400 && err?.status < 500),
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
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
            <Route path="/auth/action" element={<AuthActionPage />} />
            <Route path="/invite/:token" element={<InvitePage />} />

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

              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/agents/:id" element={<AgentBuilderPage />} />
              <Route path="/knowledge" element={<KnowledgePage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/channels" element={<ChannelsPage />} />
              <Route path="/widget-studio" element={<WidgetStudioPage />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route
                path="/phone-numbers"
                element={
                  <FeaturePlaceholderPage
                    title="Phone Numbers"
                    description="Buy or port a phone number and let your agent answer calls with a natural voice. Voice AI is the next release."
                    phase={5}
                    icon={<Phone className="w-8 h-8" />}
                  />
                }
              />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* 4. Catch-all Designed 404 Route (Never redirects to /login) */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
