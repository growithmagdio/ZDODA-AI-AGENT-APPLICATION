import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  TextField,
  Select,
  Card,
  StatusPill,
} from '@zdoda/ui';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import {
  Bot,
  MessageSquare,
  Radio,
  Phone,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  Sliders,
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { activeWorkspace, refresh } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Business Profile
  const [businessName, setBusinessName] = useState(activeWorkspace?.name || 'Smile Dental Clinic');
  const [category, setCategory] = useState('Healthcare');
  const [websiteUrl, setWebsiteUrl] = useState('https://smiledentalclinic.com');

  // Step 2: Channels
  const [channels, setChannels] = useState<{ web: boolean; whatsapp: boolean; voice: boolean }>({
    web: true,
    whatsapp: true,
    voice: true,
  });

  // Step 3: Agent Configuration
  const [agentName, setAgentName] = useState('Dental Assistant');
  const [persona, setPersona] = useState('Friendly, professional, and helpful');
  const [language, setLanguage] = useState('English + Auto-detect');

  const handleNext = async () => {
    setLoading(true);
    try {
      if (activeWorkspace) {
        await apiRequest(`/workspaces/${activeWorkspace.id}/onboarding`, {
          method: 'PATCH',
          body: JSON.stringify({
            step: step + 1,
            businessName,
            category,
            websiteUrl,
            channels,
            agentName,
            persona,
            language,
          }),
        }).catch(() => {
          // If backend onboarding patch is pending, gracefully advance
        });
      }

      if (step < 3) {
        setStep(step + 1);
      } else {
        await refresh();
        navigate('/dashboard', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex flex-col text-[var(--ink)]">
      {/* Top minimal header */}
      <header className="h-16 px-6 border-b border-[var(--separator)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center font-bold text-[16px] shadow-sm">
            Z
          </div>
          <span className="font-bold text-[18px] tracking-tight">Zdoda</span>
        </div>
        <button
          type="button"
          onClick={handleSkip}
          className="text-[13px] font-medium text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
        >
          Skip to Dashboard
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl space-y-8">
          {/* Progress Indicator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[12px] font-semibold text-[var(--ink-3)] uppercase tracking-wider">
              <span>Step {step} of 3</span>
              <span>
                {step === 1 && 'Business Profile'}
                {step === 2 && 'Channel Deployment'}
                {step === 3 && 'First Agent Persona'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-[var(--surface-2)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300 rounded-full"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          <Card className="p-8 space-y-6 bg-[var(--surface)] border border-[var(--separator)] shadow-lg shadow-black/5 rounded-3xl">
            {/* Step 1: Business Profile */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--accent-ink)] mb-1">
                    <Building2 className="w-4 h-4" />
                    Organization Setup
                  </div>
                  <h2 className="text-[24px] font-bold tracking-tight text-[var(--ink)]">
                    Tell us about your business
                  </h2>
                  <p className="text-[14px] text-[var(--ink-2)]">
                    We will automatically configure domain-specific knowledge and channel defaults.
                  </p>
                </div>

                <div className="space-y-4">
                  <TextField
                    label="Business or Clinic Name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Smile Dental Clinic"
                    required
                  />

                  <Select
                    label="Business Category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    options={[
                      { label: 'Healthcare & Dental Practice', value: 'Healthcare' },
                      { label: 'Restaurant & Dining', value: 'Restaurant' },
                      { label: 'Real Estate & Brokerage', value: 'RealEstate' },
                      { label: 'Home Services, Plumbing & HVAC', value: 'HomeServices' },
                      { label: 'E-commerce & Retail Store', value: 'Ecommerce' },
                      { label: 'Agency & Professional Consulting', value: 'Agency' },
                    ]}
                  />

                  <TextField
                    label="Business Website URL"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://smiledentalclinic.com"
                    hint="Zdoda will automatically crawl your sitemap for instant RAG answers."
                  />
                </div>
              </div>
            )}

            {/* Step 2: Channel Activation */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--accent-ink)] mb-1">
                    <Sliders className="w-4 h-4" />
                    Omnichannel Deployment
                  </div>
                  <h2 className="text-[24px] font-bold tracking-tight text-[var(--ink)]">
                    Select your active channels
                  </h2>
                  <p className="text-[14px] text-[var(--ink-2)]">
                    Your single agent will seamlessly sync across all selected customer touchpoints.
                  </p>
                </div>

                <div className="space-y-3">
                  <label
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                      channels.web
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                        : 'border-[var(--separator)] bg-[var(--surface-2)]/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={channels.web}
                      onChange={(e) => setChannels({ ...channels, web: e.target.checked })}
                      className="mt-1 accent-[var(--accent)]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[var(--accent-ink)]" />
                        <span className="font-semibold text-[15px] text-[var(--ink)]">
                          Website Chat Widget
                        </span>
                        <StatusPill status="demo" />
                      </div>
                      <p className="text-[13px] text-[var(--ink-2)] mt-1">
                        High-speed Shadow DOM widget embeddable via a single script tag with live customization in Widget Studio.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                      channels.whatsapp
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                        : 'border-[var(--separator)] bg-[var(--surface-2)]/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={channels.whatsapp}
                      onChange={(e) => setChannels({ ...channels, whatsapp: e.target.checked })}
                      className="mt-1 accent-[var(--accent)]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-[15px] text-[var(--ink)]">
                          WhatsApp Cloud API
                        </span>
                        <StatusPill status="demo" />
                      </div>
                      <p className="text-[13px] text-[var(--ink-2)] mt-1">
                        Two-way instant messaging on official WhatsApp Business accounts with template triggers and media handling.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                      channels.voice
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                        : 'border-[var(--separator)] bg-[var(--surface-2)]/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={channels.voice}
                      onChange={(e) => setChannels({ ...channels, voice: e.target.checked })}
                      className="mt-1 accent-[var(--accent)]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-[15px] text-[var(--ink)]">
                          Inbound Telephony AI Voice
                        </span>
                        <StatusPill status="demo" />
                      </div>
                      <p className="text-[13px] text-[var(--ink-2)] mt-1">
                        Sub-second natural conversational voice engine answering customer phone calls 24/7.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Agent Brain Configuration */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--accent-ink)] mb-1">
                    <Bot className="w-4 h-4" />
                    Agent Brain Persona
                  </div>
                  <h2 className="text-[24px] font-bold tracking-tight text-[var(--ink)]">
                    Configure your first agent
                  </h2>
                  <p className="text-[14px] text-[var(--ink-2)]">
                    Choose your AI assistant's name, communication style, and language abilities.
                  </p>
                </div>

                <div className="space-y-4">
                  <TextField
                    label="Agent Display Name"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="e.g. Dental Assistant"
                    required
                  />

                  <TextField
                    label="Personality & Tone"
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    placeholder="e.g. Friendly, professional, and empathetic"
                  />

                  <Select
                    label="Primary Language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    options={[
                      { label: 'English + Auto-detect (Multi-lingual)', value: 'English + Auto-detect' },
                      { label: 'Spanish (Español)', value: 'Spanish' },
                      { label: 'French (Français)', value: 'French' },
                      { label: 'German (Deutsch)', value: 'German' },
                    ]}
                  />

                  <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--separator)] flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[var(--accent-ink)] shrink-0 mt-0.5" />
                    <div className="text-[13px] text-[var(--ink-2)] leading-relaxed">
                      We will seed your workspace with sample conversations, FAQs, and a live preview widget ready to test immediately!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="pt-4 border-t border-[var(--separator)] flex items-center justify-between">
              {step > 1 ? (
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              ) : (
                <div />
              )}

              <Button variant="primary" loading={loading} onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />}>
                {step === 3 ? 'Launch Workspace' : 'Continue'}
              </Button>
            </div>
          </Card>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-4 text-center text-[12px] text-[var(--ink-3)] border-t border-[var(--separator)]">
        Zdoda • One Agent. Every Channel.
      </footer>
    </div>
  );
};
