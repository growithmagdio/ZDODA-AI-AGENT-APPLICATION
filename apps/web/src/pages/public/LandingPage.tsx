import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  StatusPill,
  Badge,
} from '@zdoda/ui';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  MessageSquare,
  Radio,
  Phone,
  Check,
  ChevronDown,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Sliders,
  Bot,
  BookOpen,
  Wrench,
  BarChart3,
  Palette,
  Layers,
  Calendar,
  FileSpreadsheet,
  Cpu,
  Mic,
  MicOff,
  PhoneOff,
  Stethoscope,
  Utensils,
  Home,
  ShoppingBag,
  Building2,
  Users,
  Menu,
  X,
  ExternalLink,
  Laptop,
  Smartphone,
  ChevronRight,
  Send,
  HelpCircle,
  Clock,
  Play,
  Search,
  CheckCircle2,
  Activity,
  Maximize2,
  Volume2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { status } = useAuth();

  // Navigation states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false);

  // Watch Demo Modal
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  // Section 5 & 6: Multi-Channel & Interactive Sandbox Tab
  const [activeChannelTab, setActiveChannelTab] = useState<'web' | 'whatsapp' | 'voice'>('web');
  const [voiceIsMuted, setVoiceIsMuted] = useState(false);
  const [voiceCallActive, setVoiceCallActive] = useState(true);

  // Section 8: Widget Studio Showcase Interactive State
  const [widgetTab, setWidgetTab] = useState<'brand' | 'theme' | 'background' | 'launcher' | 'texts'>('brand');
  const [widgetPrimaryColor, setWidgetPrimaryColor] = useState('#6538F5');
  const [widgetTheme, setWidgetTheme] = useState<'light' | 'dark' | 'glass'>('glass');
  const [widgetBackground, setWidgetBackground] = useState<'gradient' | 'aurora' | 'particles' | 'waves' | 'solid'>('gradient');
  const [widgetOpacity, setWidgetOpacity] = useState(88);
  const [widgetBlur, setWidgetBlur] = useState(20);
  const [widgetSpeed, setWidgetSpeed] = useState(50);
  const [widgetDevice, setWidgetDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [widgetWelcomeText, setWidgetWelcomeText] = useState('Hi there! How can I help you today?');
  const [widgetHeaderTitle, setWidgetHeaderTitle] = useState('Dental Assistant');
  const [widgetLauncherText, setWidgetLauncherText] = useState('Ask Assistant');
  const [widgetPublishedToast, setWidgetPublishedToast] = useState(false);

  // Section 11: Pricing Cadence
  const [pricingCycle, setPricingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Section 15: FAQ Accordion State (8 questions)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Pre-seed demo chat messages in interactive sandbox
  const [demoChatMessages, setDemoChatMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; time: string }>>([
    { sender: 'user', text: 'Hi! Can I reschedule my dental cleaning to tomorrow afternoon?', time: '11:42 AM' },
    { sender: 'agent', text: 'Hello! I found your booking for Sarah Mitchell. We have openings tomorrow at 2:30 PM and 4:00 PM with Dr. Rivera. Which works best for you?', time: '11:42 AM' },
  ]);
  const [demoInput, setDemoInput] = useState('');

  const handleSendDemoMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoInput.trim()) return;
    const userMsg = demoInput.trim();
    setDemoChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: userMsg, time: 'Just now' },
      { sender: 'agent', text: `Thanks for asking! According to our clinic policies and schedule, I can confirm that right away for you.`, time: 'Just now' },
    ]);
    setDemoInput('');
  };

  const handlePublishWidget = () => {
    setWidgetPublishedToast(true);
    setTimeout(() => setWidgetPublishedToast(false), 3000);
  };

  const faqs = [
    {
      q: 'What is Zdoda?',
      a: 'Zdoda is an all-in-one AI-Agent-as-a-Service SaaS platform that allows businesses to build a single intelligent agent and deploy it simultaneously across Website Chat, WhatsApp Cloud API, and Inbound Telephony Voice from one unified workspace.',
    },
    {
      q: 'How do AI agents work?',
      a: 'Zdoda agents use advanced Retrieval-Augmented Generation (RAG) combined with high-performance LLMs. When a customer speaks or types, the agent retrieves verified facts from your uploaded documents and website sitemap to answer accurately with zero hallucinations.',
    },
    {
      q: 'Can I use my own website content?',
      a: 'Yes. Simply enter your website URL or sitemap link. Zdoda automatically crawls, extracts, chunks, and embeds your pages into isolated pgvector storage so your agent always cites your official content.',
    },
    {
      q: 'Which channels are supported?',
      a: 'Zdoda supports Website Chat (via an ultra-fast Preact Shadow DOM widget), WhatsApp Business (via official Meta Cloud API), and Inbound Phone Telephony (via our low-latency voice engine).',
    },
    {
      q: 'Can I customize the chatbot?',
      a: 'Completely! Our signature Widget Studio gives you visual controls over branding, theme palettes, liquid glass shaders, animated backgrounds (Aurora, Gradient Flow, Particles), custom launchers, and localized text greetings.',
    },
    {
      q: 'Can I change my subscription?',
      a: 'Yes. You can upgrade, downgrade, or switch between monthly and annual billing at any time from your Billing settings. Upgrades take effect immediately with automated proration.',
    },
    {
      q: 'Does Zdoda support agencies?',
      a: 'Yes! Our Agency tier is purpose-built for agencies managing multiple client businesses. It provides separate client workspaces, white-label client portals, custom domains, and sub-account usage quotas.',
    },
    {
      q: 'How can I contact support?',
      a: 'You can reach our engineering and customer success team 24/7 via the in-app chat widget, by emailing support@zdoda.com, or through your dedicated account manager on Business and Agency plans.',
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col antialiased selection:bg-[#6538F5]/20 selection:text-[#6538F5] relative overflow-x-hidden"
      style={{
        backgroundColor: '#F7F8FF',
        color: '#15153B',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ========================================================= */}
      {/* 2. LIQUID GLASS BACKGROUND SHAPES & FLOWING GLOW RIBBONS  */}
      {/* ========================================================= */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Soft Lavender, Electric Blue, and Accent Pink Iridescent Orbs */}
        <div
          className="absolute -top-[20%] left-[10%] w-[650px] h-[650px] rounded-full blur-[110px] opacity-45 mix-blend-multiply"
          style={{
            background: 'radial-gradient(circle, #8B5CF6 0%, #6538F5 45%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-[15%] -right-[10%] w-[580px] h-[580px] rounded-full blur-[120px] opacity-35 mix-blend-multiply"
          style={{
            background: 'radial-gradient(circle, #4F7DFF 0%, #8B5CF6 50%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-[45%] -left-[10%] w-[600px] h-[600px] rounded-full blur-[130px] opacity-30 mix-blend-multiply"
          style={{
            background: 'radial-gradient(circle, #D946EF 0%, #6538F5 40%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-[10%] right-[15%] w-[550px] h-[550px] rounded-full blur-[120px] opacity-30 mix-blend-multiply"
          style={{
            background: 'radial-gradient(circle, #4F7DFF 0%, #D946EF 50%, transparent 70%)',
          }}
        />
      </div>

      {/* ========================================================= */}
      {/* 4. NAVBAR (Rounded Pill Glass, Apple Minimalism)          */}
      {/* ========================================================= */}
      <div className="sticky top-4 z-50 w-full px-4 sm:px-6">
        <header
          className="max-w-6xl mx-auto rounded-full border border-white/80 bg-white/75 backdrop-blur-2xl shadow-lg shadow-[#15153B]/5 transition-all"
          style={{
            boxShadow:
              'inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.3), 0 8px 32px -8px rgba(21, 21, 59, 0.08)',
          }}
        >
          <div className="h-16 px-6 flex items-center justify-between">
            {/* Left: Brand & Subtitle */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6538F5] via-[#8B5CF6] to-[#4F7DFF] text-white flex items-center justify-center font-bold text-[16px] shadow-sm shadow-[#6538F5]/30 group-hover:scale-105 transition-transform">
                Z
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[18px] tracking-tight text-[#15153B] leading-none">
                  Zdoda
                </span>
                <span className="text-[9px] font-semibold text-[#626B89] tracking-wider uppercase">
                  AI Agent Platform
                </span>
              </div>
            </Link>

            {/* Center: Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-7 text-[14px] font-medium text-[#626B89]">
              {/* Product Dropdown */}
              <div
                className="relative py-2"
                onMouseEnter={() => setProductDropdownOpen(true)}
                onMouseLeave={() => setProductDropdownOpen(false)}
              >
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-[#15153B] transition-colors focus:outline-none cursor-pointer"
                >
                  <span>Product</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#626B89]" />
                </button>

                {productDropdownOpen && (
                  <div className="absolute top-full -left-6 w-72 p-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/8 border border-white/80 animate-in fade-in slide-in-from-top-1 duration-150">
                    <a
                      href="#features"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F8F9FF] transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#6538F5]/10 text-[#6538F5] flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-[13px] text-[#15153B] group-hover:text-[#6538F5]">
                          AI Agent Builder
                        </div>
                        <div className="text-[11px] text-[#626B89]">
                          Visual persona, voice & prompt editor
                        </div>
                      </div>
                    </a>

                    <a
                      href="#widget-studio"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F8F9FF] transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center shrink-0">
                        <Palette className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-[13px] text-[#15153B] group-hover:text-[#6538F5]">
                          Widget Studio
                        </div>
                        <div className="text-[11px] text-[#626B89]">
                          Live Shadow DOM styling customizer
                        </div>
                      </div>
                    </a>

                    <a
                      href="#channels-section"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F8F9FF] transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#4F7DFF]/10 text-[#4F7DFF] flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-[13px] text-[#15153B] group-hover:text-[#6538F5]">
                          Multi-Channel Hub
                        </div>
                        <div className="text-[11px] text-[#626B89]">
                          Web, WhatsApp & Phone synchronizer
                        </div>
                      </div>
                    </a>
                  </div>
                )}
              </div>

              {/* Solutions Dropdown */}
              <div
                className="relative py-2"
                onMouseEnter={() => setSolutionsDropdownOpen(true)}
                onMouseLeave={() => setSolutionsDropdownOpen(false)}
              >
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-[#15153B] transition-colors focus:outline-none cursor-pointer"
                >
                  <span>Solutions</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#626B89]" />
                </button>

                {solutionsDropdownOpen && (
                  <div className="absolute top-full -left-6 w-72 p-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/8 border border-white/80 animate-in fade-in slide-in-from-top-1 duration-150">
                    <Link
                      to="/templates"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F8F9FF] transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-[13px] text-[#15153B] group-hover:text-[#6538F5]">
                          Healthcare & Clinics
                        </div>
                        <div className="text-[11px] text-[#626B89]">Patient triage & booking</div>
                      </div>
                    </Link>

                    <Link
                      to="/templates"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F8F9FF] transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Home className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-[13px] text-[#15153B] group-hover:text-[#6538F5]">
                          Real Estate & Rentals
                        </div>
                        <div className="text-[11px] text-[#626B89]">Buyer inquiry & showing tours</div>
                      </div>
                    </Link>

                    <Link
                      to="/templates"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F8F9FF] transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-[13px] text-[#15153B] group-hover:text-[#6538F5]">
                          Agencies & Partners
                        </div>
                        <div className="text-[11px] text-[#626B89]">White-label client portals</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/templates" className="hover:text-[#15153B] transition-colors">
                Templates
              </Link>
              <Link to="/pricing" className="hover:text-[#15153B] transition-colors">
                Pricing
              </Link>
              <a href="#integrations" className="hover:text-[#15153B] transition-colors">
                Resources
              </a>
            </nav>

            {/* Right: Search + Auth Controls */}
            <div className="hidden sm:flex items-center gap-3">
              <a
                href="#features"
                className="p-2 rounded-full text-[#626B89] hover:text-[#15153B] hover:bg-black/5 transition-colors cursor-pointer"
                title="Search features"
              >
                <Search className="w-4 h-4" />
              </a>

              {status === 'authenticated' ? (
                <Link to="/dashboard">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#6538F5] via-[#8B5CF6] to-[#4F7DFF] text-white font-semibold text-[13px] hover:opacity-95 shadow-md shadow-[#6538F5]/25 hover:shadow-lg hover:shadow-[#6538F5]/35 hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <span>Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 text-[14px] font-medium text-[#626B89] hover:text-[#15153B] transition-colors cursor-pointer"
                    >
                      Sign In
                    </button>
                  </Link>
                  <Link to="/signup">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-full bg-gradient-to-r from-[#6538F5] to-[#8B5CF6] text-white font-semibold text-[13px] hover:opacity-95 shadow-md shadow-[#6538F5]/25 hover:shadow-lg hover:shadow-[#6538F5]/35 hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      <span>Get Started</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full text-[#626B89] hover:text-[#15153B] hover:bg-black/5"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-white/60 px-6 py-5 space-y-4 animate-in fade-in duration-200">
              <div className="space-y-3 font-medium text-[15px] text-[#15153B]">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-[#626B89] hover:text-[#6538F5]"
                >
                  Product Features
                </a>
                <a
                  href="#channels-section"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-[#626B89] hover:text-[#6538F5]"
                >
                  Multi-Channel Hub
                </a>
                <a
                  href="#widget-studio"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-[#626B89] hover:text-[#6538F5]"
                >
                  Widget Studio
                </a>
                <Link
                  to="/templates"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-[#626B89] hover:text-[#6538F5]"
                >
                  Templates
                </Link>
                <Link
                  to="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-[#626B89] hover:text-[#6538F5]"
                >
                  Pricing
                </Link>
              </div>

              <div className="pt-3 border-t border-white/60 flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-full border border-[#E7E8F2] text-[#15153B] font-semibold text-[13px] text-center bg-white/80"
                  >
                    Sign In
                  </button>
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#6538F5] to-[#8B5CF6] text-white font-semibold text-[13px] text-center shadow-md shadow-[#6538F5]/25"
                  >
                    Get Started Free
                  </button>
                </Link>
              </div>
            </div>
          )}
        </header>
      </div>

      {/* ========================================================= */}
      {/* 5. HERO SECTION (Refined Apple + Liquid Glass Masterpiece) */}
      {/* ========================================================= */}
      <section className="relative pt-8 pb-14 sm:pt-10 sm:pb-16 lg:py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Hero Column */}
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
              {/* Announcement Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 border border-white/90 shadow-xs backdrop-blur-xl">
                <span className="w-2 h-2 rounded-full bg-[#6538F5] animate-ping" />
                <span className="text-[12px] font-semibold text-[#15153B] tracking-tight">
                  Meet your all-in-one AI Agent platform
                </span>
                <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
              </div>

              {/* Headline with Purple-to-Blue-to-Pink Gradient */}
              <h1 className="text-[40px] sm:text-[50px] lg:text-[56px] xl:text-[60px] font-extrabold tracking-tight text-[#15153B] leading-[1.08]">
                One AI Agent.<br className="hidden sm:inline" />{' '}
                <span className="bg-gradient-to-r from-[#6538F5] via-[#5B78FF] to-[#D946EF] bg-clip-text text-transparent">
                  Every Channel.
                </span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-[16px] sm:text-[17px] text-[#626B89] leading-relaxed max-w-[480px] mx-auto lg:mx-0">
                Build intelligent AI agents that understand your business, assist your customers, capture
                leads, and automate conversations across website chat, WhatsApp, and voice — all from one
                platform.
              </p>

              {/* CTAs: Start Building Free + Watch Demo */}
              <div className="pt-1 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <Link to="/signup" className="w-full sm:w-auto">
                  <button
                    type="button"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6.5 py-3.5 rounded-full bg-gradient-to-r from-[#6538F5] via-[#8B5CF6] to-[#5B78FF] text-white font-semibold text-[15px] hover:opacity-95 shadow-md shadow-[#6538F5]/25 hover:shadow-lg hover:shadow-[#6538F5]/35 hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <span>Start Building Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>

                <button
                  type="button"
                  onClick={() => setDemoModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/90 border border-white/90 text-[#15153B] font-semibold text-[15px] hover:bg-white hover:border-[#6538F5]/30 transition-all cursor-pointer shadow-xs backdrop-blur-xl"
                >
                  <div className="w-5 h-5 rounded-full bg-[#6538F5]/10 text-[#6538F5] flex items-center justify-center">
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5 text-[#6538F5]" />
                  </div>
                  <span>Watch Demo</span>
                </button>
              </div>

              {/* Under-buttons Supporting Text */}
              <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4 text-[12px] sm:text-[13px] text-[#626B89] pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#6538F5]" />
                  No complex setup
                </span>
                <span className="text-[#E7E8F2]">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#6538F5]" />
                  One unified workspace
                </span>
                <span className="text-[#E7E8F2]">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#6538F5]" />
                  14-day free trial
                </span>
              </div>
            </div>

            {/* Right Hero Column: Large Floating Dashboard Glass Panel with Non-Overlapping Badges */}
            <div className="lg:col-span-6 relative perspective-[1200px] py-6 sm:py-8">
              {/* Outer Liquid Glass Frame */}
              <div
                className="relative mx-auto max-w-[500px] xl:max-w-[520px] rounded-3xl bg-white/90 backdrop-blur-2xl p-4 sm:p-5 border border-white/95 shadow-xl transition-transform duration-500 hover:rotate-0"
                style={{
                  transform: 'rotateY(-2deg) rotateX(1.5deg)',
                  boxShadow:
                    'inset 0 1px 0 rgba(255, 255, 255, 0.95), inset 0 0 0 1px rgba(255, 255, 255, 0.4), 0 20px 48px -12px rgba(21, 21, 59, 0.12)',
                }}
              >
                {/* Simulated Mac OS Header Bar */}
                <div className="flex items-center justify-between pb-3 px-2 border-b border-[#E7E8F2]/60">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-[#626B89] bg-[#F7F8FF] px-3.5 py-0.5 rounded-full border border-white/80">
                    <span className="text-[10px] text-[#626B89]/70">https://</span>
                    <span className="text-[#15153B] font-medium">app.zdoda.com/dashboard</span>
                  </div>
                  <div className="w-8 flex justify-end">
                    <span className="w-2 h-2 rounded-full bg-emerald-500/80" title="Connected" />
                  </div>
                </div>

                {/* Dashboard Main Header */}
                <div className="pt-3 pb-2 px-2 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6538F5] via-[#8B5CF6] to-[#5B78FF] text-white flex items-center justify-center font-bold text-[14px] shadow-xs">
                      S
                    </div>
                    <div>
                      <div className="font-bold text-[14px] text-[#15153B] flex items-center gap-1.5">
                        Smile Dental Clinic
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-purple-100 text-[#6538F5]">
                          PRO
                        </span>
                        <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-600 text-[9px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      </div>
                      <div className="text-[11px] text-[#626B89]">Agent: Dental Assistant (Live)</div>
                    </div>
                  </div>

                  {/* Channel Status Badges */}
                  <div className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold flex items-center gap-1 border border-blue-200/60">
                      <MessageSquare className="w-3 h-3" /> Web
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold flex items-center gap-1 border border-emerald-200/60">
                      <Radio className="w-3 h-3" /> WA
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-semibold flex items-center gap-1 border border-purple-200/60">
                      <Phone className="w-3 h-3" /> Voice
                    </span>
                  </div>
                </div>

                {/* 4 Illustrative Metric Cards */}
                <div className="grid grid-cols-4 gap-2 px-1 pt-2">
                  <div className="p-2.5 rounded-xl bg-white/80 border border-[#E7E8F2]/70 hover:bg-white transition-colors">
                    <div className="text-[9px] font-medium text-[#626B89]">Conversations</div>
                    <div className="text-[16px] font-extrabold text-[#15153B] mt-0.5">2,842</div>
                    <div className="text-[9px] font-semibold text-emerald-600">+12.4%</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 border border-[#E7E8F2]/70 hover:bg-white transition-colors">
                    <div className="text-[9px] font-medium text-[#626B89]">Leads Booked</div>
                    <div className="text-[16px] font-extrabold text-[#6538F5] mt-0.5">184</div>
                    <div className="text-[9px] font-semibold text-emerald-600">+18.2%</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 border border-[#E7E8F2]/70 hover:bg-white transition-colors">
                    <div className="text-[9px] font-medium text-[#626B89]">Resolution</div>
                    <div className="text-[16px] font-extrabold text-emerald-600 mt-0.5">98.4%</div>
                    <div className="text-[9px] font-semibold text-emerald-600">Auto</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 border border-[#E7E8F2]/70 hover:bg-white transition-colors">
                    <div className="text-[9px] font-medium text-[#626B89]">Latency</div>
                    <div className="text-[16px] font-extrabold text-[#5B78FF] mt-0.5">1.8s</div>
                    <div className="text-[9px] font-semibold text-emerald-600">Real-time</div>
                  </div>
                </div>

                {/* Inner Layered Chat Conversation Preview */}
                <div className="mt-3 p-3.5 rounded-2xl bg-white/95 border border-white/90 shadow-inner space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-[#626B89] pb-1 border-b border-[#E7E8F2]/60">
                    <span className="font-semibold text-[#15153B] flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-[#6538F5]" />
                      Live RAG Retrieval Preview
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">
                      Demo data
                    </span>
                  </div>

                  {/* Customer Message */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-gradient-to-r from-[#6538F5] to-[#7B4DF7] text-white px-3.5 py-2 text-[12px] shadow-xs">
                      Do you have emergency slots today for tooth pain?
                    </div>
                  </div>

                  {/* AI Agent Answer with Citation */}
                  <div className="flex justify-start">
                    <div className="max-w-[90%] rounded-2xl rounded-tl-xs bg-[#F7F8FF] border border-[#E7E8F2] text-[#15153B] px-3.5 py-2.5 text-[12px] shadow-xs space-y-1.5">
                      <p className="leading-snug">
                        Yes! Dr. Rivera has an urgent opening at 2:30 PM today at our Main Street clinic.
                        Shall I reserve that for you right now?
                      </p>
                      <div className="inline-flex items-center gap-1 text-[10px] text-[#6538F5] font-semibold bg-[#6538F5]/10 px-2 py-0.5 rounded-md">
                        <BookOpen className="w-3 h-3" />
                        Source: Clinic_Schedule_Oct27.pdf
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 Intentionally Positioned Floating Satellite Badges (Desktop) */}
                {/* 1. Website Chat - Top Right Outside Glass Rim */}
                <div
                  className="hidden lg:flex absolute -top-5 -right-3 sm:-right-5 lg:-right-4 xl:-right-6 z-20 items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-white shadow-xl shadow-[#15153B]/8 hover:scale-105 transition-transform"
                  style={{
                    boxShadow:
                      'inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 12px 30px -8px rgba(21, 21, 59, 0.12), 0 4px 12px rgba(101, 56, 245, 0.06)',
                  }}
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[11px] text-[#15153B]">Website Chat</div>
                    <div className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Shadow DOM Active
                    </div>
                  </div>
                </div>

                {/* 2. WhatsApp Cloud - Bottom Left Outside Glass Rim */}
                <div
                  className="hidden lg:flex absolute -bottom-5 -left-3 sm:-left-5 lg:-left-4 xl:-left-6 z-20 items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-white shadow-xl shadow-[#15153B]/8 hover:scale-105 transition-transform"
                  style={{
                    boxShadow:
                      'inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 12px 30px -8px rgba(21, 21, 59, 0.12), 0 4px 12px rgba(101, 56, 245, 0.06)',
                  }}
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[11px] text-[#15153B]">WhatsApp Cloud</div>
                    <div className="text-[9px] text-[#626B89] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Official Business API
                    </div>
                  </div>
                </div>

                {/* 3. Telephony Voice - Bottom Right Outside Glass Rim */}
                <div
                  className="hidden lg:flex absolute -bottom-5 -right-3 sm:-right-5 lg:-right-4 xl:-right-6 z-20 items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-white shadow-xl shadow-[#15153B]/8 hover:scale-105 transition-transform"
                  style={{
                    boxShadow:
                      'inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 12px 30px -8px rgba(21, 21, 59, 0.12), 0 4px 12px rgba(101, 56, 245, 0.06)',
                  }}
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 text-[#6538F5] flex items-center justify-center shadow-xs">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[11px] text-[#15153B]">Telephony Voice</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1 h-2.5 bg-[#6538F5] rounded-full animate-pulse" />
                      <div className="w-1 h-3.5 bg-[#6538F5] rounded-full animate-pulse delay-75" />
                      <div className="w-1 h-2 bg-[#6538F5] rounded-full animate-pulse delay-150" />
                      <span className="text-[9px] text-[#6538F5] font-semibold ml-1">Sub-second STT</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tablet & Mobile Clean Satellite Strip (Zero Overlap) */}
              <div className="flex lg:hidden items-center justify-center gap-2 pt-4 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-white shadow-xs text-[11px] font-semibold text-[#15153B]">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Website Chat</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-white shadow-xs text-[11px] font-semibold text-[#15153B]">
                  <Radio className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Cloud</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-white shadow-xs text-[11px] font-semibold text-[#15153B]">
                  <Phone className="w-3.5 h-3.5 text-purple-600" />
                  <span>Telephony Voice</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. MULTI-CHANNEL SECTION (One Agent. Multiple Ways...)    */}
      {/* ========================================================= */}
      <section id="channels-section" className="py-20 bg-white/70 backdrop-blur-xl border-y border-white/80">
        <div className="max-w-7xl mx-auto px-6 space-y-14">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-[34px] sm:text-[44px] font-extrabold tracking-tight text-[#15153B]">
              One Agent. Multiple Ways to Connect.
            </h2>
            <p className="text-[17px] text-[#626B89] leading-relaxed">
              Engage your customers on their preferred channel with a consistent, intelligent AI experience.
            </p>
          </div>

          {/* 3 Channel Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Website Chat Card */}
            <div
              className={`p-7 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                activeChannelTab === 'web'
                  ? 'border-[#6538F5] bg-white shadow-xl shadow-[#6538F5]/10 scale-[1.02]'
                  : 'border-white/80 bg-white/60 hover:bg-white hover:border-[#6538F5]/40 shadow-xs'
              }`}
              onClick={() => setActiveChannelTab('web')}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#6538F5] flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-[20px] font-bold text-[#15153B]">Website Chat</h3>
                <p className="text-[14px] text-[#626B89] leading-relaxed">
                  Embeddable Shadow DOM chat widget styled via Widget Studio. Answers questions using your business
                  knowledge with sub-100ms response speed.
                </p>

                {/* Miniature Browser Preview */}
                <div className="p-3 rounded-2xl bg-[#F8F9FF] border border-[#E7E8F2] space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-[#E7E8F2]">
                    <div className="w-2 h-2 rounded-full bg-rose-400" />
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-[#626B89] ml-1">yourbrand.com</span>
                  </div>
                  <div className="text-[#15153B] font-medium">"Certainly! Let me check the schedule..."</div>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-[#E7E8F2]/60 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[#6538F5] flex items-center gap-1">
                  See it in action <ChevronRight className="w-4 h-4" />
                </span>
                <Badge variant="accent">Web</Badge>
              </div>
            </div>

            {/* WhatsApp Card */}
            <div
              className={`p-7 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                activeChannelTab === 'whatsapp'
                  ? 'border-emerald-500 bg-white shadow-xl shadow-emerald-500/10 scale-[1.02]'
                  : 'border-white/80 bg-white/60 hover:bg-white hover:border-emerald-500/40 shadow-xs'
              }`}
              onClick={() => setActiveChannelTab('whatsapp')}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Radio className="w-6 h-6" />
                </div>
                <h3 className="text-[20px] font-bold text-[#15153B]">WhatsApp Business</h3>
                <p className="text-[14px] text-[#626B89] leading-relaxed">
                  Connect official Meta Cloud WhatsApp numbers. Provide immediate automated support, send appointment
                  confirmations, and capture verified mobile phone leads.
                </p>

                {/* Miniature Messaging Preview */}
                <div className="p-3 rounded-2xl bg-[#DCF8C6]/30 border border-[#D1D7DB] space-y-1 text-[11px]">
                  <div className="text-emerald-700 font-bold text-[10px]">WhatsApp Official Verified</div>
                  <div className="text-[#303030]">"Your cleaning is confirmed for Friday at 3 PM!"</div>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-[#E7E8F2]/60 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-emerald-600 flex items-center gap-1">
                  See it in action <ChevronRight className="w-4 h-4" />
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                  Official
                </span>
              </div>
            </div>

            {/* Voice Assistant Card */}
            <div
              className={`p-7 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                activeChannelTab === 'voice'
                  ? 'border-blue-500 bg-white shadow-xl shadow-blue-500/10 scale-[1.02]'
                  : 'border-white/80 bg-white/60 hover:bg-white hover:border-blue-500/40 shadow-xs'
              }`}
              onClick={() => setActiveChannelTab('voice')}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Phone className="w-6 h-6" />
                </div>
                <h3 className="text-[20px] font-bold text-[#15153B]">Voice Telephony</h3>
                <p className="text-[14px] text-[#626B89] leading-relaxed">
                  Ultra-low-latency inbound telephony engine. Answers customer calls 24/7, conducts natural spoken
                  dialogue, and schedules appointments without human delay.
                </p>

                {/* Miniature Audio Waveform Preview */}
                <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[12, 24, 18, 30, 16, 26, 14, 28].map((h, i) => (
                      <div key={i} className="w-1 bg-blue-600 rounded-full" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold text-blue-700">Sub-second STT/TTS</span>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-[#E7E8F2]/60 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-blue-600 flex items-center gap-1">
                  Listen to a sample <ChevronRight className="w-4 h-4" />
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                  Telephony
                </span>
              </div>
            </div>
          </div>

          {/* Connected Interactive Demo Sandbox Box */}
          <div className="rounded-3xl bg-white/90 border border-white/80 p-6 sm:p-8 shadow-xl shadow-black/5 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E8F2]">
              <div>
                <span className="text-[11px] font-bold text-[#6538F5] uppercase tracking-wider">
                  Interactive Simulator
                </span>
                <h3 className="text-[20px] font-bold text-[#15153B]">
                  {activeChannelTab === 'web' && 'Website Chat Assistant Preview'}
                  {activeChannelTab === 'whatsapp' && 'WhatsApp Cloud Business Thread'}
                  {activeChannelTab === 'voice' && 'Telephony Call & Waveform Live Demo'}
                </h3>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F9FF] border border-[#E7E8F2] text-[11px] font-semibold text-[#626B89]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Demo Simulation
              </div>
            </div>

            {/* TAB: WEB CHAT */}
            {activeChannelTab === 'web' && (
              <div className="max-w-xl mx-auto rounded-2xl border border-[#E7E8F2] overflow-hidden bg-white shadow-md">
                <div className="p-4 bg-gradient-to-r from-[#6538F5] to-[#8B5CF6] text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-[13px]">
                      Z
                    </div>
                    <div>
                      <div className="font-bold text-[14px]">Dental Assistant AI</div>
                      <div className="text-[11px] text-white/80">Online • RAG Active</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3 min-h-[220px] max-h-[300px] overflow-y-auto text-[13px]">
                  {demoChatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                          msg.sender === 'user'
                            ? 'bg-[#6538F5] text-white rounded-tr-xs'
                            : 'bg-[#F8F9FF] text-[#15153B] border border-[#E7E8F2] rounded-tl-xs'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span className={`block text-[9px] mt-1 ${msg.sender === 'user' ? 'text-white/70 text-right' : 'text-[#626B89]'}`}>
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendDemoMessage} className="p-3 border-t border-[#E7E8F2] flex items-center gap-2">
                  <input
                    type="text"
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    placeholder="Ask about dental procedures, hours, pricing..."
                    className="flex-1 px-4 py-2 rounded-xl bg-[#F8F9FF] border border-[#E7E8F2] text-[13px] text-[#15153B] focus:outline-none focus:border-[#6538F5]"
                  />
                  <button
                    type="submit"
                    className="p-2.5 rounded-xl bg-[#6538F5] text-white hover:bg-[#562cdb] cursor-pointer transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB: WHATSAPP */}
            {activeChannelTab === 'whatsapp' && (
              <div className="max-w-xl mx-auto rounded-2xl border border-[#D1D7DB] overflow-hidden bg-[#ECE5DD] shadow-md">
                <div className="p-3.5 bg-[#075E54] text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-[13px]">
                      WA
                    </div>
                    <div>
                      <div className="font-bold text-[14px]">Smile Dental Clinic</div>
                      <div className="text-[11px] text-white/80">+1 (555) 019-9281 • Meta Cloud API</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3 min-h-[220px] text-[13px]">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-lg bg-[#DCF8C6] text-[#303030] p-3 shadow-xs">
                      <p>Hi! Can you confirm my teeth whitening appointment for Friday?</p>
                      <div className="text-[10px] text-[#626B89] text-right mt-1">10:14 AM ✓✓</div>
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <div className="max-w-[88%] rounded-lg bg-white text-[#303030] p-3 shadow-xs space-y-1.5">
                      <p>
                        Hello! Yes, you are confirmed for Professional Laser Whitening this Friday, Oct 30 at 3:00
                        PM with Dr. Rivera.
                      </p>
                      <p className="text-[11px] text-[#626B89]">Reply RESCHEDULE or CANCEL if your schedule changes.</p>
                      <div className="text-[10px] text-[#626B89] text-right">10:15 AM</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: VOICE TELEPHONY */}
            {activeChannelTab === 'voice' && (
              <div className="max-w-xl mx-auto rounded-2xl border border-[#E7E8F2] bg-white p-6 shadow-md text-center space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#E7E8F2]">
                  <div className="text-left">
                    <div className="font-bold text-[15px] text-[#15153B]">Inbound Call • +1 (800) 412-ZDODA</div>
                    <div className="text-[12px] text-[#626B89]">Twilio Telephony Port Adapter</div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-semibold border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Call in progress (00:48)
                  </div>
                </div>

                {/* Animated Audio Waveform */}
                <div className="py-6 flex items-center justify-center gap-2 h-24">
                  {[35, 60, 95, 45, 80, 100, 65, 85, 40, 90, 70, 30].map((h, i) => (
                    <div
                      key={i}
                      className="w-2 bg-gradient-to-t from-[#6538F5] via-[#4F7DFF] to-[#D946EF] rounded-full transition-all duration-300"
                      style={{
                        height: voiceCallActive ? `${h}%` : '15%',
                        opacity: voiceIsMuted ? 0.3 : 1,
                      }}
                    />
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8F9FF] border border-[#E7E8F2] text-left text-[13px] space-y-1">
                  <span className="font-semibold text-[#6538F5]">AI Agent Voice:</span> "Welcome to Smile Dental. I
                  can see you are calling about an urgent root canal consultation. Can I confirm your name?"
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setVoiceIsMuted(!voiceIsMuted)}
                    className={`p-3.5 rounded-full border transition-all cursor-pointer ${
                      voiceIsMuted
                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                        : 'bg-[#F8F9FF] text-[#15153B] border-[#E7E8F2] hover:bg-[#E7E8F2]'
                    }`}
                  >
                    {voiceIsMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setVoiceCallActive(!voiceCallActive)}
                    className="px-6 py-3.5 rounded-full bg-rose-600 text-white font-semibold text-[13px] flex items-center gap-2 hover:bg-rose-700 shadow-sm cursor-pointer"
                  >
                    <PhoneOff className="w-4 h-4" />
                    {voiceCallActive ? 'End Call Demo' : 'Restart Call'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. FEATURES SECTION (6 feature cards)                     */}
      {/* ========================================================= */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#6538F5]/10 text-[#6538F5] text-[12px] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Powerful Features. Built for Real Businesses.
          </div>
          <h2 className="text-[34px] sm:text-[44px] font-extrabold tracking-tight text-[#15153B] leading-tight">
            Everything you need to build smarter AI agents.
          </h2>
          <p className="text-[17px] text-[#626B89] leading-relaxed">
            Enterprise-grade RAG ingestion, live customizable widget previews, multi-channel orchestration,
            and centralized analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1: AI Agent Builder */}
          <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm hover:shadow-xl hover:border-[#6538F5]/40 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6538F5]/10 to-[#8B5CF6]/20 text-[#6538F5] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-[20px] font-bold text-[#15153B]">AI Agent Builder</h3>
            <p className="text-[14px] text-[#626B89] leading-relaxed">
              Configure personality, instructions, tone, and guardrails. Test with streaming LLM sandboxes
              before deploying.
            </p>
          </div>

          {/* Card 2: Business Knowledge */}
          <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm hover:shadow-xl hover:border-[#4F7DFF]/40 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4F7DFF]/10 to-blue-200 text-[#4F7DFF] flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-[20px] font-bold text-[#15153B]">Business Knowledge</h3>
            <p className="text-[14px] text-[#626B89] leading-relaxed">
              Upload PDFs, crawl sitemaps, and sync FAQs. Our BullMQ RAG pipeline indexes chunks into pgvector
              with strict tenant isolation.
            </p>
          </div>

          {/* Card 3: Widget Studio */}
          <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm hover:shadow-xl hover:border-[#D946EF]/40 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D946EF]/10 to-pink-200 text-[#D946EF] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Palette className="w-6 h-6" />
            </div>
            <h3 className="text-[20px] font-bold text-[#15153B]">Widget Studio</h3>
            <p className="text-[14px] text-[#626B89] leading-relaxed">
              Our core differentiator. Real-time Shadow DOM styling, animated liquid glass shaders, custom
              launchers, and sub-100ms updates.
            </p>
          </div>

          {/* Card 4: Multi-Channel Communication */}
          <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-[20px] font-bold text-[#15153B]">Multi-Channel Communication</h3>
            <p className="text-[14px] text-[#626B89] leading-relaxed">
              Manage website chat, WhatsApp Cloud API, and telephony voice through a single dashboard with
              instant human takeover.
            </p>
          </div>

          {/* Card 5: Tools & Integrations */}
          <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm hover:shadow-xl hover:border-amber-500/40 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-[20px] font-bold text-[#15153B]">Tools & Integrations</h3>
            <p className="text-[14px] text-[#626B89] leading-relaxed">
              Connect Google Calendar, Google Sheets, Slack, Make, and n8n with AES-256-GCM token encryption
              and custom webhooks.
            </p>
          </div>

          {/* Card 6: Analytics & Insights */}
          <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm hover:shadow-xl hover:border-rose-500/40 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-[20px] font-bold text-[#15153B]">Analytics & Insights</h3>
            <p className="text-[14px] text-[#626B89] leading-relaxed">
              Omnichannel conversation volumes, lead capture velocity, resolution rates, and agent accuracy
              leaderboards.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. WIDGET STUDIO SHOWCASE (Signature Differentiator)       */}
      {/* ========================================================= */}
      <section id="widget-studio" className="py-24 bg-white/60 backdrop-blur-xl border-y border-white/80">
        <div className="max-w-7xl mx-auto px-6 space-y-14">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#6538F5]/10 text-[#6538F5] text-[12px] font-semibold">
              <Palette className="w-4 h-4" />
              Zdoda Signature Feature
            </div>
            <h2 className="text-[34px] sm:text-[44px] font-extrabold tracking-tight text-[#15153B]">
              Your AI Assistant. Your Brand. Your Experience.
            </h2>
            <p className="text-[17px] text-[#626B89] leading-relaxed">
              Experience the no-code Widget Studio editor. Customize branding, liquid glass materials, and
              animated shaders with live instant preview.
            </p>
          </div>

          {/* Studio Canvas */}
          <div className="rounded-3xl bg-white/80 border border-white/90 p-4 sm:p-8 shadow-xl shadow-black/5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Studio Editor Controls (5 Tabs) */}
              <div className="lg:col-span-6 bg-[#F8F9FF] rounded-2xl border border-[#E7E8F2] p-6 shadow-sm space-y-6">
                {/* 5 Tabs Header */}
                <div className="flex items-center justify-between border-b border-[#E7E8F2] pb-3 overflow-x-auto gap-2">
                  {[
                    { id: 'brand', label: 'Brand' },
                    { id: 'theme', label: 'Theme' },
                    { id: 'background', label: 'Background' },
                    { id: 'launcher', label: 'Launcher' },
                    { id: 'texts', label: 'Texts' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setWidgetTab(tab.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        widgetTab === tab.id
                          ? 'bg-[#6538F5] text-white shadow-xs'
                          : 'text-[#626B89] hover:text-[#15153B] hover:bg-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab: Brand */}
                {widgetTab === 'brand' && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <div>
                      <label className="text-[12px] font-bold text-[#626B89] uppercase tracking-wider block mb-2">
                        Primary Accent Color
                      </label>
                      <div className="flex items-center gap-3">
                        {[
                          { color: '#6538F5', name: 'Zdoda Purple' },
                          { color: '#4F7DFF', name: 'Electric Blue' },
                          { color: '#10B981', name: 'Emerald' },
                          { color: '#D946EF', name: 'Accent Pink' },
                          { color: '#15153B', name: 'Midnight' },
                        ].map((c) => (
                          <button
                            key={c.color}
                            type="button"
                            onClick={() => setWidgetPrimaryColor(c.color)}
                            className={`w-9 h-9 rounded-full transition-transform cursor-pointer border-2 ${
                              widgetPrimaryColor === c.color ? 'scale-115 border-[#15153B]' : 'border-white'
                            }`}
                            style={{ backgroundColor: c.color }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[12px] font-bold text-[#626B89] uppercase tracking-wider block mb-2">
                        Assistant Header Title
                      </label>
                      <input
                        type="text"
                        value={widgetHeaderTitle}
                        onChange={(e) => setWidgetHeaderTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E7E8F2] text-[13px] text-[#15153B] focus:outline-none focus:border-[#6538F5]"
                      />
                    </div>
                  </div>
                )}

                {/* Tab: Theme */}
                {widgetTab === 'theme' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <label className="text-[12px] font-bold text-[#626B89] uppercase tracking-wider block mb-1">
                      Material Theme Preset
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'light', label: 'Light Studio' },
                        { id: 'dark', label: 'Dark Titanium' },
                        { id: 'glass', label: 'Liquid Glass' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setWidgetTheme(t.id as any)}
                          className={`p-3 rounded-xl border text-[13px] font-semibold text-center transition-all cursor-pointer ${
                            widgetTheme === t.id
                              ? 'border-[#6538F5] bg-[#6538F5]/10 text-[#6538F5]'
                              : 'border-[#E7E8F2] bg-white text-[#626B89] hover:text-[#15153B]'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab: Background Shaders */}
                {widgetTab === 'background' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <label className="text-[12px] font-bold text-[#626B89] uppercase tracking-wider block mb-1">
                      Shader Preset
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: 'solid', label: 'Solid Matte' },
                        { id: 'gradient', label: 'Gradient Flow' },
                        { id: 'aurora', label: 'Aurora' },
                        { id: 'particles', label: 'Particles' },
                        { id: 'waves', label: 'Fluid Waves' },
                      ].map((bg) => (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => setWidgetBackground(bg.id as any)}
                          className={`p-2.5 rounded-xl border text-[12px] font-semibold text-center transition-all cursor-pointer ${
                            widgetBackground === bg.id
                              ? 'border-[#6538F5] bg-[#6538F5]/10 text-[#6538F5]'
                              : 'border-[#E7E8F2] bg-white text-[#626B89] hover:text-[#15153B]'
                          }`}
                        >
                          {bg.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3 pt-2">
                      <div>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-[#626B89]">Backdrop Blur</span>
                          <span className="font-bold text-[#15153B]">{widgetBlur}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="32"
                          value={widgetBlur}
                          onChange={(e) => setWidgetBlur(Number(e.target.value))}
                          className="w-full accent-[#6538F5] cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-[#626B89]">Material Opacity</span>
                          <span className="font-bold text-[#15153B]">{widgetOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="100"
                          value={widgetOpacity}
                          onChange={(e) => setWidgetOpacity(Number(e.target.value))}
                          className="w-full accent-[#6538F5] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Launcher */}
                {widgetTab === 'launcher' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div>
                      <label className="text-[12px] font-bold text-[#626B89] uppercase tracking-wider block mb-2">
                        Launcher Label
                      </label>
                      <input
                        type="text"
                        value={widgetLauncherText}
                        onChange={(e) => setWidgetLauncherText(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E7E8F2] text-[13px] text-[#15153B] focus:outline-none focus:border-[#6538F5]"
                      />
                    </div>
                  </div>
                )}

                {/* Tab: Texts */}
                {widgetTab === 'texts' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div>
                      <label className="text-[12px] font-bold text-[#626B89] uppercase tracking-wider block mb-2">
                        Welcome Message
                      </label>
                      <textarea
                        rows={3}
                        value={widgetWelcomeText}
                        onChange={(e) => setWidgetWelcomeText(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E7E8F2] text-[13px] text-[#15153B] focus:outline-none focus:border-[#6538F5]"
                      />
                    </div>
                  </div>
                )}

                {/* Actions & Publish Button */}
                <div className="pt-4 border-t border-[#E7E8F2] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWidgetDevice('desktop')}
                      className={`p-2 rounded-lg border cursor-pointer ${
                        widgetDevice === 'desktop'
                          ? 'bg-[#6538F5] text-white border-[#6538F5]'
                          : 'bg-white text-[#626B89] border-[#E7E8F2]'
                      }`}
                    >
                      <Laptop className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setWidgetDevice('mobile')}
                      className={`p-2 rounded-lg border cursor-pointer ${
                        widgetDevice === 'mobile'
                          ? 'bg-[#6538F5] text-white border-[#6538F5]'
                          : 'bg-white text-[#626B89] border-[#E7E8F2]'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handlePublishWidget}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6538F5] to-[#8B5CF6] text-white font-semibold text-[13px] hover:opacity-95 transition-all shadow-xs cursor-pointer"
                  >
                    <span>Publish Widget</span>
                  </button>
                </div>

                {widgetPublishedToast && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-medium flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Widget configuration saved and published to Shadow DOM runtime!</span>
                  </div>
                )}
              </div>

              {/* Studio Live Preview */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 min-h-[440px]">
                <div
                  className={`w-full transition-all duration-300 rounded-3xl border border-white/90 shadow-2xl overflow-hidden relative ${
                    widgetDevice === 'mobile' ? 'max-w-[340px]' : 'max-w-[400px]'
                  }`}
                  style={{
                    backgroundColor: widgetTheme === 'dark' ? '#0F172A' : '#FFFFFF',
                    color: widgetTheme === 'dark' ? '#FFFFFF' : '#15153B',
                    backdropFilter: `blur(${widgetBlur}px)`,
                  }}
                >
                  {/* Dynamic Shader Simulated Layer */}
                  {widgetBackground === 'gradient' && (
                    <div
                      className="absolute inset-0 opacity-20 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 80% 20%, ${widgetPrimaryColor}, transparent 60%)`,
                      }}
                    />
                  )}
                  {widgetBackground === 'aurora' && (
                    <div
                      className="absolute inset-0 opacity-25 pointer-events-none animate-pulse"
                      style={{
                        background: `linear-gradient(135deg, ${widgetPrimaryColor} 0%, #4F7DFF 50%, #D946EF 100%)`,
                      }}
                    />
                  )}

                  {/* Widget Header */}
                  <div
                    className="p-4 text-white flex items-center justify-between relative z-10 transition-colors"
                    style={{ backgroundColor: widgetPrimaryColor }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-[12px]">
                        Z
                      </div>
                      <div>
                        <div className="font-bold text-[13px]">{widgetHeaderTitle}</div>
                        <div className="text-[10px] text-white/80">Online • Studio Runtime</div>
                      </div>
                    </div>
                  </div>

                  {/* Widget Messages */}
                  <div className="p-4 space-y-3 min-h-[220px] text-[13px] relative z-10">
                    <div className="flex justify-start">
                      <div
                        className="max-w-[85%] rounded-2xl rounded-tl-xs p-3 border shadow-xs"
                        style={{
                          backgroundColor: widgetTheme === 'dark' ? '#1E293B' : '#F8F9FF',
                          borderColor: widgetTheme === 'dark' ? '#334155' : '#E7E8F2',
                        }}
                      >
                        <p>{widgetWelcomeText}</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div
                        className="max-w-[85%] rounded-2xl rounded-tr-xs text-white p-3 shadow-xs"
                        style={{ backgroundColor: widgetPrimaryColor }}
                      >
                        <p>Can I book an appointment for dental cleaning?</p>
                      </div>
                    </div>
                  </div>

                  {/* Widget Launcher Preview */}
                  <div className="p-3 border-t border-[#E7E8F2]/60 flex items-center justify-between text-[12px] bg-black/5">
                    <span className="text-[#626B89]">Live Launcher:</span>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-full text-white font-semibold flex items-center gap-1.5 shadow-sm"
                      style={{ backgroundColor: widgetPrimaryColor }}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{widgetLauncherText}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. HOW ZDODA WORKS (4 Steps)                              */}
      {/* ========================================================= */}
      <section className="py-24 max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#6538F5]/10 text-[#6538F5] text-[12px] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Simple 4-Step Deployment
          </div>
          <h2 className="text-[34px] sm:text-[44px] font-extrabold tracking-tight text-[#15153B]">
            From signup to omnichannel live in minutes.
          </h2>
          <p className="text-[17px] text-[#626B89] leading-relaxed">
            Create, tune, ingest, and deploy. No machine learning PhD required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              num: 1,
              title: 'Create Your Workspace',
              desc: 'Sign up and configure your business. Your multi-tenant workspace is provisioned with strict pgvector isolation.',
            },
            {
              num: 2,
              title: 'Build Your AI Agent',
              desc: 'Define personality, instructions, tone, and language. Test in streaming sandbox before deploying.',
            },
            {
              num: 3,
              title: 'Add Business Knowledge',
              desc: 'Connect your website URL, upload procedure PDFs, and sync FAQs for atomic RAG retrieval.',
            },
            {
              num: 4,
              title: 'Test and Publish',
              desc: 'Embed the lightweight widget on your site, activate WhatsApp, and launch inbound telephony voice.',
            },
          ].map((s) => (
            <div
              key={s.num}
              className="p-7 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm hover:border-[#6538F5]/40 transition-all space-y-4"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6538F5] to-[#8B5CF6] text-white flex items-center justify-center font-bold text-[16px]">
                {s.num}
              </div>
              <h3 className="text-[18px] font-bold text-[#15153B]">{s.title}</h3>
              <p className="text-[14px] text-[#626B89] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <Link to="/signup">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#6538F5] via-[#8B5CF6] to-[#4F7DFF] text-white font-semibold text-[15px] hover:opacity-95 shadow-md shadow-[#6538F5]/25 cursor-pointer"
            >
              <span>Build Your First Agent</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 10. INTEGRATIONS SECTION (8 integrations grid)            */}
      {/* ========================================================= */}
      <section id="integrations" className="py-24 bg-white/70 backdrop-blur-xl border-y border-white/80">
        <div className="max-w-7xl mx-auto px-6 space-y-14">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#6538F5]/10 text-[#6538F5] text-[12px] font-semibold">
              <Wrench className="w-3.5 h-3.5" />
              Works With Your Business Tools.
            </div>
            <h2 className="text-[34px] sm:text-[44px] font-extrabold tracking-tight text-[#15153B]">
              Connect the tools your business already uses.
            </h2>
            <p className="text-[17px] text-[#626B89] leading-relaxed">
              Your agents don't just chat—they trigger calendar appointments, populate CRM leads, and execute
              custom webhook routines with encrypted credentials.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { name: 'Google Sheets', desc: 'Sync customer lead capture rows', status: 'Demo Active' },
              { name: 'Google Calendar', desc: 'Real-time schedule bookings', status: 'Demo Active' },
              { name: 'Make', desc: 'Multi-step automation flows', status: 'Demo Active' },
              { name: 'n8n', desc: 'Self-hosted workflow dispatch', status: 'Demo Active' },
              { name: 'GoHighLevel', desc: 'Agency sub-account CRM sync', status: 'Planned (Phase 5)' },
              { name: 'Slack', desc: 'Live human takeover notifications', status: 'Demo Active' },
              { name: 'HubSpot', desc: 'Contact lifecycle enrichment', status: 'Planned (Phase 5)' },
              { name: 'Custom API Tools', desc: 'REST endpoints with AES-256 tokens', status: 'Demo Active' },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white border border-[#E7E8F2] shadow-xs hover:border-[#6538F5]/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="font-bold text-[16px] text-[#15153B]">{item.name}</div>
                  <div className="text-[12px] text-[#626B89] mt-1">{item.desc}</div>
                </div>
                <div className="pt-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F8F9FF] border border-[#E7E8F2] text-[#626B89]">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 11. PRICING SECTION (4 plans, monthly/yearly toggle)      */}
      {/* ========================================================= */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#6538F5]/10 text-[#6538F5] text-[12px] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Simple Plans. Room to Grow.
          </div>
          <h2 className="text-[34px] sm:text-[44px] font-extrabold tracking-tight text-[#15153B]">
            Transparent pricing for businesses of any size.
          </h2>
          <p className="text-[17px] text-[#626B89] leading-relaxed">
            Switch plans anytime with zero long-term commitments. All tiers include our core RAG vector search.
          </p>

          {/* Cadence Toggle */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <div className="inline-flex p-1 rounded-full bg-white border border-[#E7E8F2] shadow-xs">
              <button
                type="button"
                onClick={() => setPricingCycle('monthly')}
                className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                  pricingCycle === 'monthly'
                    ? 'bg-[#15153B] text-white shadow-xs'
                    : 'text-[#626B89] hover:text-[#15153B]'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setPricingCycle('yearly')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                  pricingCycle === 'yearly'
                    ? 'bg-[#15153B] text-white shadow-xs'
                    : 'text-[#626B89] hover:text-[#15153B]'
                }`}
              >
                Yearly
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Starter */}
          <div className="p-7 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[20px] font-bold text-[#15153B]">Starter</h3>
                <StatusPill status="demo" />
              </div>
              <p className="text-[13px] text-[#626B89]">For individuals and single-location businesses.</p>
              <div className="flex items-baseline gap-1">
                <span className="text-[38px] font-extrabold text-[#15153B]">
                  {pricingCycle === 'monthly' ? '$49' : '$39'}
                </span>
                <span className="text-[14px] text-[#626B89]">/mo</span>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-[#E7E8F2] text-[13px] text-[#15153B]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>1 Published AI Agent</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>Website Chat Widget</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>Basic Knowledge (20 docs)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>1,000 Messages/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>Email Support</span>
                </div>
              </div>
            </div>

            <Link to="/signup" className="pt-4">
              <button
                type="button"
                className="w-full py-3 rounded-full bg-white border border-[#E7E8F2] text-[#15153B] font-semibold text-[13px] hover:border-[#6538F5] transition-all cursor-pointer"
              >
                Start with Starter
              </button>
            </Link>
          </div>

          {/* Growth / Pro (Recommended) */}
          <div className="p-7 rounded-3xl bg-white border-2 border-[#6538F5] shadow-xl shadow-[#6538F5]/10 flex flex-col justify-between space-y-6 relative scale-102">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#6538F5] to-[#8B5CF6] text-white font-bold text-[10px] uppercase tracking-wider shadow-xs">
              Recommended
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[20px] font-bold text-[#15153B]">Pro</h3>
                <StatusPill status="demo" />
              </div>
              <p className="text-[13px] text-[#626B89]">
                For growing businesses needing WhatsApp and Inbound Voice.
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-[38px] font-extrabold text-[#15153B]">
                  {pricingCycle === 'monthly' ? '$99' : '$79'}
                </span>
                <span className="text-[14px] text-[#626B89]">/mo</span>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-[#E7E8F2] text-[13px] text-[#15153B]">
                <div className="flex items-center gap-2 font-semibold text-[#6538F5]">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>5 Published AI Agents</span>
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>Web + WhatsApp + Voice</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>Advanced Knowledge & Sitemaps</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>10,000 Messages/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>100 Voice Minutes/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>Priority Chat & Email</span>
                </div>
              </div>
            </div>

            <Link to="/signup" className="pt-4">
              <button
                type="button"
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#6538F5] to-[#8B5CF6] text-white font-semibold text-[13px] hover:opacity-95 transition-all shadow-md shadow-[#6538F5]/25 cursor-pointer"
              >
                Start 14-Day Free Trial
              </button>
            </Link>
          </div>

          {/* Business */}
          <div className="p-7 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[20px] font-bold text-[#15153B]">Business</h3>
                <StatusPill status="demo" />
              </div>
              <p className="text-[13px] text-[#626B89]">For high-volume teams requiring white-label control.</p>
              <div className="flex items-baseline gap-1">
                <span className="text-[38px] font-extrabold text-[#15153B]">
                  {pricingCycle === 'monthly' ? '$199' : '$159'}
                </span>
                <span className="text-[14px] text-[#626B89]">/mo</span>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-[#E7E8F2] text-[13px] text-[#15153B]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>Unlimited AI Agents</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>White-Label Widget Studio</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>Multi-Workspace Architecture</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>50,000 Messages/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>500 Voice Minutes/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>Dedicated Support & SLA</span>
                </div>
              </div>
            </div>

            <Link to="/signup" className="pt-4">
              <button
                type="button"
                className="w-full py-3 rounded-full bg-white border border-[#E7E8F2] text-[#15153B] font-semibold text-[13px] hover:border-[#6538F5] transition-all cursor-pointer"
              >
                Scale with Business
              </button>
            </Link>
          </div>

          {/* Agency */}
          <div className="p-7 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[20px] font-bold text-[#15153B]">Agency</h3>
                <StatusPill status="demo" />
              </div>
              <p className="text-[13px] text-[#626B89]">For agencies managing dozens of client workspaces.</p>
              <div className="flex items-baseline gap-1">
                <span className="text-[32px] font-extrabold text-[#15153B]">Custom</span>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-[#E7E8F2] text-[13px] text-[#15153B]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>Unlimited Client Workspaces</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>Custom CNAME Domains</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>Sub-Account Quotas & Billing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>Full White-Label Client Portal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6538F5]" />
                  <span>Dedicated Account Strategist</span>
                </div>
              </div>
            </div>

            <Link to="/pricing" className="pt-4">
              <button
                type="button"
                className="w-full py-3 rounded-full bg-white border border-[#E7E8F2] text-[#15153B] font-semibold text-[13px] hover:border-[#6538F5] transition-all cursor-pointer"
              >
                Talk to Sales
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 14. FAQ SECTION (8 specific questions with accordion)     */}
      {/* ========================================================= */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#6538F5]/10 text-[#6538F5] text-[12px] font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            Clear Answers
          </div>
          <h2 className="text-[34px] sm:text-[42px] font-extrabold tracking-tight text-[#15153B]">
            Frequently Asked Questions
          </h2>
          <p className="text-[16px] text-[#626B89]">
            Everything you need to know about setting up and running Zdoda.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = openFaqIndex === i;
            return (
              <div
                key={i}
                className="rounded-2xl border border-white/80 bg-white/70 backdrop-blur-xl overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-[16px] text-[#15153B] hover:bg-white/90 transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{f.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#626B89] transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-[#6538F5]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-[14px] text-[#626B89] leading-relaxed border-t border-[#E7E8F2]/60 pt-3">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 12. FINAL CTA (Liquid Glass Surface & Gradient Accent)    */}
      {/* ========================================================= */}
      <section className="py-24 px-6">
        <div
          className="max-w-5xl mx-auto rounded-3xl p-10 sm:p-16 text-center space-y-7 relative overflow-hidden bg-white/85 backdrop-blur-2xl border border-white/90 shadow-2xl"
          style={{
            boxShadow:
              'inset 0 1px 0 rgba(255, 255, 255, 0.95), inset 0 0 0 1px rgba(255, 255, 255, 0.4), 0 32px 64px -16px rgba(21, 21, 59, 0.12)',
          }}
        >
          {/* Subtle Ambient Light Refraction */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-[#6538F5]/20 via-[#4F7DFF]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6538F5] via-[#8B5CF6] to-[#4F7DFF] text-white flex items-center justify-center font-bold text-[22px] mx-auto shadow-lg shadow-[#6538F5]/25">
            Z
          </div>
          <h2 className="text-[36px] sm:text-[48px] font-extrabold tracking-tight text-[#15153B] leading-tight">
            Your Next Customer Conversation Starts Here.
          </h2>
          <p className="text-[17px] text-[#626B89] max-w-2xl mx-auto leading-relaxed">
            Create your AI agent, connect your channels, and build a smarter customer experience with Zdoda.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/signup" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#6538F5] via-[#8B5CF6] to-[#4F7DFF] text-white font-semibold text-[15px] hover:opacity-95 shadow-lg shadow-[#6538F5]/30 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>

            <a href="#features" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white border border-[#E7E8F2] text-[#15153B] font-semibold text-[15px] hover:bg-[#F8F9FF] transition-all cursor-pointer shadow-xs"
              >
                <span>Explore Features</span>
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 13. MINIMAL FOOTER                                        */}
      {/* ========================================================= */}
      <footer className="py-16 bg-[#15153B] text-white text-[14px]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-white/10">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6538F5] to-[#8B5CF6] text-white flex items-center justify-center font-bold text-[16px]">
                Z
              </div>
              <span className="font-bold text-[20px] tracking-tight">Zdoda</span>
            </div>
            <p className="text-white/70 max-w-sm text-[13px] leading-relaxed">
              One AI Agent. Every Channel. Deploy intelligent conversational AI across website chat,
              WhatsApp, and voice from one dashboard.
            </p>
            <div className="text-[12px] text-white/50">
              © {new Date().getFullYear()} Zdoda Inc. All rights reserved.
            </div>
          </div>

          <div className="space-y-3">
            <div className="font-bold text-[13px] uppercase tracking-wider text-white/50">Product</div>
            <ul className="space-y-2 text-white/80 text-[13px]">
              <li><a href="#features" className="hover:text-white transition-colors">AI Builder</a></li>
              <li><a href="#widget-studio" className="hover:text-white transition-colors">Widget Studio</a></li>
              <li><a href="#channels-section" className="hover:text-white transition-colors">WhatsApp API</a></li>
              <li><a href="#channels-section" className="hover:text-white transition-colors">Voice Telephony</a></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="font-bold text-[13px] uppercase tracking-wider text-white/50">Solutions</div>
            <ul className="space-y-2 text-white/80 text-[13px]">
              <li><Link to="/templates" className="hover:text-white transition-colors">Healthcare & Clinics</Link></li>
              <li><Link to="/templates" className="hover:text-white transition-colors">Restaurants & Bars</Link></li>
              <li><Link to="/templates" className="hover:text-white transition-colors">Real Estate & Rentals</Link></li>
              <li><Link to="/templates" className="hover:text-white transition-colors">Home Services</Link></li>
              <li><Link to="/templates" className="hover:text-white transition-colors">Agency Workspaces</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="font-bold text-[13px] uppercase tracking-wider text-white/50">Resources</div>
            <ul className="space-y-2 text-white/80 text-[13px]">
              <li><a href="#integrations" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Documentation</a></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col sm:flex-row items-center justify-between text-[12px] text-white/50 gap-4">
          <div>Built with precision • Production-ready SaaS platform</div>
          <div className="flex items-center gap-6">
            <span>Status: All Systems Operational</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* 10. WATCH DEMO MODAL (Interactive Liquid Glass Tour)      */}
      {/* ========================================================= */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl rounded-3xl bg-white/95 backdrop-blur-2xl border border-white p-6 sm:p-8 shadow-2xl relative space-y-6"
            style={{
              boxShadow: '0 24px 64px -12px rgba(21, 21, 59, 0.25)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E8F2]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6538F5] to-[#8B5CF6] text-white flex items-center justify-center font-bold text-[14px]">
                  Z
                </div>
                <div>
                  <h3 className="font-bold text-[16px] text-[#15153B]">Zdoda Interactive Tour</h3>
                  <p className="text-[12px] text-[#626B89]">One Agent. Every Channel.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDemoModalOpen(false)}
                className="p-2 rounded-full text-[#626B89] hover:text-[#15153B] hover:bg-[#F8F9FF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tour Content */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#6538F5]/10 via-[#4F7DFF]/10 to-[#D946EF]/10 border border-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#6538F5] flex items-center justify-center shadow-xs">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-[14px] text-[#15153B]">Dental Assistant AI is Live</div>
                    <div className="text-[12px] text-[#626B89]">Synced across Web, WhatsApp & Inbound Phone</div>
                  </div>
                </div>
                <StatusPill status="demo" />
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F9FF] border border-[#E7E8F2] space-y-2 text-[13px]">
                <div className="font-bold text-[12px] text-[#626B89] uppercase tracking-wider">
                  Verified Knowledge Retrieval:
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E7E8F2] font-mono text-[11px] text-[#15153B]">
                  QUERY: "Does Dr. Rivera have an open slot today for toothache?"
                  <br />
                  <span className="text-[#6538F5]">
                    MATCH: Clinic_Calendar_2026.json (Score: 0.941 cosine similarity)
                  </span>
                </div>
                <p className="text-[#626B89]">
                  Zdoda retrieves exact answers from your ingested files in under 120 milliseconds with zero hallucinations.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDemoModalOpen(false)}
                className="px-5 py-2.5 rounded-full border border-[#E7E8F2] text-[#15153B] font-semibold text-[13px] hover:bg-[#F8F9FF] cursor-pointer"
              >
                Close
              </button>
              <Link to="/signup" onClick={() => setDemoModalOpen(false)}>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#6538F5] to-[#8B5CF6] text-white font-semibold text-[13px] hover:opacity-95 shadow-md shadow-[#6538F5]/25 cursor-pointer"
                >
                  Start Building Free
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
