import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  StatusPill,
  Card,
  LiquidGlass,
  Badge,
} from '@zdoda/ui';
import { useAuth } from '../../context/AuthContext';
import {
  Check,
  Minus,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  HelpCircle,
  ChevronDown,
  LayoutDashboard,
} from 'lucide-react';

export const PricingPage: React.FC = () => {
  const { status } = useAuth();
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const plans = [
    {
      name: 'Starter',
      price: cycle === 'monthly' ? '$49' : '$39',
      period: '/mo',
      savings: cycle === 'yearly' ? 'Billed annually ($468/yr)' : 'Billed monthly',
      desc: 'Ideal for single-location clinics, solo practices, and boutique businesses.',
      ctaText: 'Start with Starter',
      ctaVariant: 'secondary' as const,
      highlight: false,
      features: [
        '1 Published AI Agent',
        'Website Chat Widget',
        'Basic Knowledge Base (up to 20 docs)',
        'Standard Essential Integrations',
        '1,000 Messages included/mo',
        'Email Support',
      ],
    },
    {
      name: 'Pro',
      badge: 'Most Popular',
      price: cycle === 'monthly' ? '$99' : '$79',
      period: '/mo',
      savings: cycle === 'yearly' ? 'Billed annually ($948/yr)' : 'Billed monthly',
      desc: 'For growing businesses demanding WhatsApp messaging and Inbound AI Voice.',
      ctaText: 'Start 14-Day Free Trial',
      ctaVariant: 'primary' as const,
      highlight: true,
      features: [
        '5 Published AI Agents',
        'Website Chat + WhatsApp Cloud API',
        'Inbound Telephony AI Voice Engine',
        'Advanced Knowledge (Sitemaps & PDFs)',
        'Tools, Calendar & Webhook Integrations',
        '10,000 Messages included/mo',
        '100 Voice Minutes included/mo',
        'Priority Chat & Email Support',
      ],
    },
    {
      name: 'Business',
      price: cycle === 'monthly' ? '$199' : '$159',
      period: '/mo',
      savings: cycle === 'yearly' ? 'Billed annually ($1,908/yr)' : 'Billed monthly',
      desc: 'High-volume businesses needing white-label widgets and multi-workspace access.',
      ctaText: 'Scale with Business',
      ctaVariant: 'secondary' as const,
      highlight: false,
      features: [
        'Unlimited AI Agents',
        'All Channels (Web + WhatsApp + Voice)',
        'White-Label Widget Customization',
        'Multi-Workspace Management',
        'Custom REST API Tools & Webhooks',
        '50,000 Messages included/mo',
        '500 Voice Minutes included/mo',
        'Dedicated Support & SLA',
      ],
    },
    {
      name: 'Agency',
      showPrice: false,
      price: 'Custom',
      period: '',
      savings: 'Flexible client seat billing',
      desc: 'Agencies building and managing branded AI agents for dozens of client accounts.',
      ctaText: 'Talk to Sales',
      ctaVariant: 'secondary' as const,
      highlight: false,
      features: [
        'Unlimited Client Workspaces',
        'Full White-Label Client Portals',
        'Custom Domains (cname)',
        'Sub-Account Client Billing & Quotas',
        'Team Member RBAC & Audit Logs',
        'Custom Volume Quotas',
        'Dedicated Account Manager',
      ],
    },
  ];

  const comparisonRows = [
    {
      category: 'Channels & Delivery',
      items: [
        { feature: 'Website Chat Widget (Shadow DOM)', starter: 'Yes', pro: 'Yes', business: 'Yes', agency: 'Yes' },
        { feature: 'WhatsApp Cloud API Integration', starter: false, pro: 'Yes', business: 'Yes', agency: 'Yes' },
        { feature: 'Inbound Voice Telephony Engine', starter: false, pro: 'Yes', business: 'Yes', agency: 'Yes' },
        { feature: 'Unified Omnichannel Inbox & Takeover', starter: 'Basic', pro: 'Full', business: 'Full', agency: 'Full' },
      ],
    },
    {
      category: 'Knowledge & AI Brain',
      items: [
        { feature: 'Included AI Agents', starter: '1 Agent', pro: '5 Agents', business: 'Unlimited', agency: 'Unlimited' },
        { feature: 'Knowledge Documents & PDFs', starter: '20 docs', pro: '250 docs', business: 'Unlimited', agency: 'Unlimited' },
        { feature: 'Website Sitemap Auto-Sync', starter: false, pro: 'Daily', business: 'Real-time', agency: 'Real-time' },
        { feature: 'pgvector Semantic Search (RAG)', starter: 'Yes', pro: 'Yes', business: 'Yes', agency: 'Yes' },
        { feature: 'Prompt Engineering & System Personas', starter: 'Standard', pro: 'Advanced', business: 'Advanced', agency: 'Advanced' },
      ],
    },
    {
      category: 'Quotas & Metering',
      items: [
        { feature: 'Monthly Included Messages', starter: '1,000', pro: '10,000', business: '50,000', agency: 'Custom' },
        { feature: 'Monthly Included Voice Minutes', starter: '-', pro: '100 min', business: '500 min', agency: 'Custom' },
        { feature: 'Extra Messages Rate', starter: '$0.02 / msg', pro: '$0.01 / msg', business: '$0.006 / msg', agency: 'Tiered' },
      ],
    },
    {
      category: 'Customization & Branding',
      items: [
        { feature: 'Widget Studio Visual Editor', starter: 'Yes', pro: 'Yes', business: 'Yes', agency: 'Yes' },
        { feature: 'Remove "Powered by Zdoda" Branding', starter: false, pro: false, business: 'Yes', agency: 'Yes' },
        { feature: 'Custom Domain for Widget & Portal', starter: false, pro: false, business: false, agency: 'Yes' },
        { feature: 'Multi-Workspace Architecture', starter: false, pro: false, business: 'Yes', agency: 'Yes' },
      ],
    },
  ];

  const faqs = [
    {
      q: 'Can I switch between monthly and annual billing at any time?',
      a: 'Yes. You can upgrade, downgrade, or switch billing cadences directly from your Billing settings. Upgrades take effect immediately with prorated adjustments.',
    },
    {
      q: 'What happens if my business exceeds the monthly message quota?',
      a: 'Zdoda will never cut off your customer conversations. Additional messages are billed at the transparent overage rate for your plan tier, or you can seamlessly upgrade to the next tier.',
    },
    {
      q: 'Is there a setup fee or long-term contract?',
      a: 'No. All plans are pay-as-you-go with no setup fees. You can cancel your subscription at any time without penalties.',
    },
    {
      q: 'How does the WhatsApp Cloud API integration work?',
      a: 'You can connect your Meta Business WhatsApp number directly through our guided onboarding. Customers text your business number, and your Zdoda AI agent replies instantly 24/7.',
    },
    {
      q: 'Can human agents intervene in AI conversations?',
      a: 'Always. In your unified Omnichannel Inbox, human staff can view real-time transcripts, click "Take over" to respond manually, and hand back control when finished.',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col">
      {/* Sticky Top Glass Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[var(--surface)]/80 border-b border-[var(--separator)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center font-bold text-[16px] shadow-sm">
              Z
            </div>
            <span className="font-bold text-[18px] tracking-tight">Zdoda</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-[14px] text-[var(--ink-2)] font-medium">
            <Link to="/" className="hover:text-[var(--ink)] transition-colors">Overview</Link>
            <Link to="/pricing" className="text-[var(--ink)] font-semibold">Pricing</Link>
            <Link to="/templates" className="hover:text-[var(--ink)] transition-colors">Templates</Link>
          </nav>

          <div className="flex items-center gap-3">
            {status === 'authenticated' ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm" icon={<LayoutDashboard className="w-4 h-4" />}>
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-16 space-y-16">
        {/* Header Title */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent-ink)] text-[12px] font-semibold border border-[var(--accent)]/20">
            <Sparkles className="w-3.5 h-3.5" />
            Transparent, Predictable Plans
          </div>
          <h1 className="text-[38px] md:text-[46px] font-extrabold tracking-tight text-[var(--ink)] leading-tight">
            One AI Agent. Every Channel. Predictable Pricing.
          </h1>
          <p className="text-[16px] text-[var(--ink-2)] leading-relaxed">
            Deploy your business agent to website chat, WhatsApp, and phone voice. Switch plans anytime with zero locked contracts.
          </p>

          {/* Billing Cadence Selector */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <div className="inline-flex p-1 rounded-full bg-[var(--surface-2)] border border-[var(--separator)]">
              <button
                type="button"
                onClick={() => setCycle('monthly')}
                className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
                  cycle === 'monthly'
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setCycle('yearly')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
                  cycle === 'yearly'
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                Yearly
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--success)]/15 text-[var(--success)]">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => (
            <Card
              key={p.name}
              className={`p-6 flex flex-col justify-between relative rounded-2xl transition-all ${
                p.highlight
                  ? 'border-2 border-[var(--accent)] bg-[var(--surface)] shadow-lg shadow-[var(--accent)]/5 scale-[1.02]'
                  : 'bg-[var(--surface)] border border-[var(--separator)]'
              }`}
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[20px] font-bold text-[var(--ink)]">{p.name}</h3>
                    <p className="text-[12px] text-[var(--ink-3)] mt-0.5">{p.savings}</p>
                  </div>
                  {p.badge && (
                    <Badge variant="accent" className="font-semibold text-[11px]">
                      {p.badge}
                    </Badge>
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-[36px] font-extrabold tracking-tight text-[var(--ink)]">
                    {p.price}
                  </span>
                  <span className="text-[14px] text-[var(--ink-2)]">{p.period}</span>
                  <div className="ml-auto">
                    <StatusPill status="demo" />
                  </div>
                </div>

                <p className="text-[13px] text-[var(--ink-2)] min-h-[38px] leading-relaxed">
                  {p.desc}
                </p>

                <div className="pt-4 border-t border-[var(--separator)] space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
                    Included capabilities:
                  </p>
                  <ul className="space-y-2.5">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13px] text-[var(--ink)]">
                        <Check className="w-4 h-4 text-[var(--accent-ink)] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[var(--separator)]">
                <Link to={status === 'authenticated' ? '/billing' : '/signup'} className="block w-full">
                  <Button variant={p.ctaVariant} className="w-full">
                    {p.ctaText}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Complete Feature Comparison Table */}
        <div className="space-y-6 pt-10">
          <div className="text-center space-y-2">
            <h2 className="text-[28px] font-bold tracking-tight text-[var(--ink)]">
              Feature-by-Feature Comparison
            </h2>
            <p className="text-[14px] text-[var(--ink-2)]">
              Detailed breakdown of channels, limits, and technical features across every tier.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--separator)] bg-[var(--surface)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--separator)] bg-[var(--surface-2)] text-[13px] font-semibold text-[var(--ink)]">
                  <th className="p-4 w-1/3">Feature</th>
                  <th className="p-4 text-center w-1/6">Starter</th>
                  <th className="p-4 text-center w-1/6 text-[var(--accent-ink)]">Pro</th>
                  <th className="p-4 text-center w-1/6">Business</th>
                  <th className="p-4 text-center w-1/6">Agency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--separator)] text-[13px]">
                {comparisonRows.map((cat, cIdx) => (
                  <React.Fragment key={cIdx}>
                    <tr className="bg-[var(--surface-2)]/60">
                      <td colSpan={5} className="py-2.5 px-4 font-bold text-[12px] uppercase tracking-wider text-[var(--ink-2)]">
                        {cat.category}
                      </td>
                    </tr>
                    {cat.items.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[var(--surface-2)]/30 transition-colors">
                        <td className="p-4 font-medium text-[var(--ink)]">{row.feature}</td>
                        <td className="p-4 text-center text-[var(--ink-2)]">
                          {row.starter === true ? (
                            <Check className="w-4 h-4 text-[var(--success)] mx-auto" />
                          ) : row.starter === false ? (
                            <Minus className="w-4 h-4 text-[var(--ink-3)] mx-auto" />
                          ) : (
                            row.starter
                          )}
                        </td>
                        <td className="p-4 text-center font-semibold text-[var(--accent-ink)]">
                          {row.pro === true ? (
                            <Check className="w-4 h-4 text-[var(--accent-ink)] mx-auto" />
                          ) : row.pro === false ? (
                            <Minus className="w-4 h-4 text-[var(--ink-3)] mx-auto" />
                          ) : (
                            row.pro
                          )}
                        </td>
                        <td className="p-4 text-center text-[var(--ink)]">
                          {row.business === true ? (
                            <Check className="w-4 h-4 text-[var(--success)] mx-auto" />
                          ) : row.business === false ? (
                            <Minus className="w-4 h-4 text-[var(--ink-3)] mx-auto" />
                          ) : (
                            row.business
                          )}
                        </td>
                        <td className="p-4 text-center text-[var(--ink)]">
                          {row.agency === true ? (
                            <Check className="w-4 h-4 text-[var(--success)] mx-auto" />
                          ) : row.agency === false ? (
                            <Minus className="w-4 h-4 text-[var(--ink-3)] mx-auto" />
                          ) : (
                            row.agency
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing FAQ Section */}
        <div className="max-w-3xl mx-auto space-y-6 pt-10">
          <div className="text-center space-y-2">
            <h2 className="text-[26px] font-bold text-[var(--ink)] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-[14px] text-[var(--ink-2)]">
              Got questions about billing, plans, or channel integration? We have answers.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-[var(--separator)] bg-[var(--surface)] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-[15px] text-[var(--ink)] hover:bg-[var(--surface-2)]/50 transition-colors"
                  >
                    <span>{f.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[var(--ink-3)] transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-[14px] text-[var(--ink-2)] leading-relaxed border-t border-[var(--separator)]/50 pt-3">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Final CTA Strip */}
        <div className="rounded-3xl p-8 md:p-12 bg-gradient-to-br from-[var(--surface-2)] via-[var(--surface)] to-[var(--surface-2)] border border-[var(--separator)] text-center space-y-5">
          <h2 className="text-[28px] md:text-[34px] font-extrabold tracking-tight text-[var(--ink)]">
            Ready to deploy your first agent?
          </h2>
          <p className="text-[15px] text-[var(--ink-2)] max-w-xl mx-auto">
            Experience the power of omnichannel conversational AI. Start your 14-day free trial today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/signup">
              <Button variant="primary" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                Get Started Free
              </Button>
            </Link>
            <Link to="/templates">
              <Button variant="secondary" size="lg">
                Explore Industry Templates
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-[var(--separator)] text-center text-[12px] text-[var(--ink-3)]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[var(--accent)] text-white flex items-center justify-center text-[11px] font-bold">
              Z
            </div>
            <span className="font-semibold text-[var(--ink)]">Zdoda</span>
            <span>• One Agent. Every Channel.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-[var(--ink)]">Home</Link>
            <Link to="/pricing" className="hover:text-[var(--ink)]">Pricing</Link>
            <Link to="/templates" className="hover:text-[var(--ink)]">Templates</Link>
            <Link to="/login" className="hover:text-[var(--ink)]">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
