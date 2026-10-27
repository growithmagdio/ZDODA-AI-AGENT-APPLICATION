import React, { useState, useEffect } from 'react';
import { Sheet, Button, TextField, Select } from '@zdoda/ui';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { CheckCircle2, Circle } from 'lucide-react';

export const OnboardingSheet: React.FC = () => {
  const { activeWorkspace, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState(activeWorkspace?.name || '');
  const [category, setCategory] = useState('Healthcare');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('zdoda:open-onboarding', handleOpen);
    return () => window.removeEventListener('zdoda:open-onboarding', handleOpen);
  }, []);

  const stepsList = [
    { num: 1, title: 'Business Profile', desc: 'Tell us about your organization' },
    { num: 2, title: 'Workspace Setup', desc: 'Configure default channels & language' },
    { num: 3, title: 'Subscription Plan', desc: 'Choose a quota tier (Phase 2)' },
    { num: 4, title: 'Create First Agent', desc: 'Configure prompt & voice (Phase 3)' },
    { num: 5, title: 'Connect Knowledge', desc: 'Upload documents or site (Phase 3)' },
    { num: 6, title: 'Deploy Chat Widget', desc: 'Embed snippet on site (Phase 4)' },
    { num: 7, title: 'Publish Live', desc: 'Run end-to-end test and launch' },
  ];

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
          }),
        });
      }
      if (step < 2) {
        setStep(step + 1);
      } else {
        setOpen(false);
        await refresh();
      }
    } catch (err) {
      console.error('Onboarding step error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      title="Set up your Zdoda Workspace"
      description="One Agent. Every Channel. Complete your initial business profile to get started."
    >
      <div className="space-y-6">
        {/* Step Progress Checklist */}
        <div className="p-3 bg-[var(--surface-2)] rounded-[14px] border border-[var(--separator)] divide-y divide-[var(--separator)]">
          {stepsList.map((s) => {
            const isCompleted = s.num < step;
            const isCurrent = s.num === step;

            return (
              <div key={s.num} className="flex items-center gap-3 py-2 px-1 text-[13px]">
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-[var(--accent)] flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                  </div>
                ) : (
                  <Circle className="w-4 h-4 text-[var(--ink-3)] shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className={isCurrent ? 'font-semibold text-[var(--ink)]' : 'text-[var(--ink-2)]'}>
                    {s.title}
                  </span>
                  {s.num > 2 && (
                    <span className="ml-2 text-[10px] font-semibold tracking-wider uppercase text-[var(--ink-3)]">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Step 1 Form */}
        {step === 1 && (
          <div className="space-y-4">
            <TextField
              label="Business or Organization Name"
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
                { label: 'Healthcare & Dental', value: 'Healthcare' },
                { label: 'Restaurant & Hospitality', value: 'Restaurant' },
                { label: 'Real Estate & Property', value: 'RealEstate' },
                { label: 'Home Services & Trades', value: 'HomeServices' },
                { label: 'E-commerce & Retail', value: 'Ecommerce' },
                { label: 'Agency & Consulting', value: 'Agency' },
              ]}
            />
            <TextField
              label="Website URL (Optional)"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://smiledentalclinic.com"
            />
          </div>
        )}

        {/* Step 2 Form */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-4 rounded-[14px] bg-[var(--surface-2)] border border-[var(--separator)] text-[14px] text-[var(--ink-2)] leading-relaxed">
              <p className="font-semibold text-[var(--ink)] mb-1">Workspace Initialized</p>
              Your multi-tenant workspace <strong>{businessName || 'Zdoda Workspace'}</strong> is configured with strict tenant isolation, seed credentials, and default English language support.
            </div>
            <p className="text-[13px] text-[var(--ink-3)]">
              Next phases will configure your subscription plan, agent instructions, and RAG knowledge base.
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--separator)]">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button variant="primary" loading={loading} onClick={handleNext}>
            {step === 1 ? 'Save & Continue' : 'Finish Step 2'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
};
