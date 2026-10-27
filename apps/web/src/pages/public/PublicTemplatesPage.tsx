import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  StatusPill,
  Card,
  Badge,
} from '@zdoda/ui';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  MessageSquare,
  Radio,
  Phone,
  ArrowRight,
  Bot,
  CheckCircle2,
  Stethoscope,
  Utensils,
  Home,
  Wrench,
  ShoppingBag,
  LayoutDashboard,
  Search,
} from 'lucide-react';

interface TemplateItem {
  id: string;
  category: 'Healthcare' | 'Restaurant' | 'RealEstate' | 'HomeServices' | 'Ecommerce';
  name: string;
  tagline: string;
  desc: string;
  icon: React.ReactNode;
  channels: ('web' | 'whatsapp' | 'voice')[];
  samplePrompt: string;
  sampleAnswer: string;
  knowledgeSources: string[];
}

export const PublicTemplatesPage: React.FC = () => {
  const { status } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);

  const templates: TemplateItem[] = [
    {
      id: 'dental-assistant',
      category: 'Healthcare',
      name: 'Smile Dental Clinic',
      tagline: 'Patient Intake, Emergency Triage & Appointment Booking',
      desc: 'Trained to answer treatment questions, quote insured estimates, reschedule cleanings, and triage emergency dental pain 24/7.',
      icon: <Stethoscope className="w-5 h-5 text-blue-500" />,
      channels: ['web', 'whatsapp', 'voice'],
      samplePrompt: 'I have severe tooth pain on my lower left molar. Can I see someone today?',
      sampleAnswer: 'I am so sorry to hear you are in pain! Dr. Rivera has an urgent slot open at 2:30 PM today at our Main Street clinic. Shall I reserve this emergency appointment for you right now?',
      knowledgeSources: ['Clinic Procedures PDF', 'Insurance Copay Schedule', 'FAQs & Post-Op Care'],
    },
    {
      id: 'bistro-host',
      category: 'Restaurant',
      name: 'Bistro 92 Modern Kitchen',
      tagline: 'Table Reservations, Dietary Guidance & WhatsApp Catering',
      desc: 'Handles busy Friday evening reservations, explains wine pairings and allergen alerts, and collects group catering inquiries via WhatsApp.',
      icon: <Utensils className="w-5 h-5 text-amber-500" />,
      channels: ['web', 'whatsapp', 'voice'],
      samplePrompt: 'Do you have gluten-free pasta options, and can I reserve a table for 4 tonight?',
      sampleAnswer: 'Yes! We offer handmade gluten-free fettuccine and penne. We have open tables for 4 at 6:45 PM and 8:15 PM tonight. Which time fits your evening best?',
      knowledgeSources: ['Seasonal Dinner Menu', 'Wine & Cocktails List', 'Private Event Policies'],
    },
    {
      id: 'apex-realty',
      category: 'RealEstate',
      name: 'Apex Residential Realty',
      tagline: 'Buyer Pre-Qualification, Showing Scheduler & MLS Info',
      desc: 'Engages weekend buyers, answers square footage and HOA questions, pre-screens mortgage eligibility, and arranges licensed agent tours.',
      icon: <Home className="w-5 h-5 text-emerald-500" />,
      channels: ['web', 'whatsapp', 'voice'],
      samplePrompt: 'What are the HOA fees for the penthouse on 4th Avenue, and is parking included?',
      sampleAnswer: 'HOA fees for Unit 12B are $485/month, covering water, trash, rooftop amenities, and 2 designated underground parking spaces. Would you like a private tour this Saturday?',
      knowledgeSources: ['MLS Property Catalog', 'Neighborhood HOA Docs', 'Financing Checklist'],
    },
    {
      id: 'bolt-hvac',
      category: 'HomeServices',
      name: 'Bolt Plumbing & HVAC',
      tagline: 'Emergency Dispatch, Instant Quotes & Service Route Booking',
      desc: 'Answers urgent heating or leak calls, guides homeowners through main shut-off valves, and dispatches the nearest technician.',
      icon: <Wrench className="w-5 h-5 text-orange-500" />,
      channels: ['web', 'whatsapp', 'voice'],
      samplePrompt: 'My water heater is leaking water across the basement floor!',
      sampleAnswer: 'Please locate the cold water shutoff valve on top of the water heater and turn it 90 degrees clockwise immediately. I have dispatched technician Dave—he will arrive at your home in 35 minutes.',
      knowledgeSources: ['Emergency Troubleshooting Guide', 'Standard Rate Sheet', 'Service Zone Zip Codes'],
    },
    {
      id: 'artisan-wear',
      category: 'Ecommerce',
      name: 'Artisan Wear Studio',
      tagline: 'Product Sizing, Order Tracking & Hassle-Free Returns',
      desc: 'Integrates with Shopify and WooCommerce to check real-time order delivery, recommend jacket sizing, and process exchanges automatically.',
      icon: <ShoppingBag className="w-5 h-5 text-purple-500" />,
      channels: ['web', 'whatsapp'],
      samplePrompt: 'Where is my order #ZD-9821, and can I exchange it for a size Medium?',
      sampleAnswer: 'Order #ZD-9821 is currently out for delivery with FedEx and should arrive by 4 PM today. If the Large doesn’t fit perfectly, I can issue a prepaid exchange label for Medium with one tap!',
      knowledgeSources: ['Apparel Size Charts', 'Return & Exchange Policy', 'Shipping Timeline SLAs'],
    },
  ];

  const filtered = templates.filter((t) => {
    const matchesCat = activeCategory === 'all' || t.category === activeCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

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
            <Link to="/pricing" className="hover:text-[var(--ink)] transition-colors">Pricing</Link>
            <Link to="/templates" className="text-[var(--ink)] font-semibold">Templates</Link>
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
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent-ink)] text-[12px] font-semibold border border-[var(--accent)]/20">
            <Sparkles className="w-3.5 h-3.5" />
            Battle-Tested Industry Blueprints
          </div>
          <h1 className="text-[38px] md:text-[46px] font-extrabold tracking-tight text-[var(--ink)] leading-tight">
            Launch in Minutes with Verified Agent Templates
          </h1>
          <p className="text-[16px] text-[var(--ink-2)] leading-relaxed">
            Pre-configured with domain knowledge, prompt personas, and multi-channel workflows for clinics, restaurants, real estate, and services.
          </p>

          {/* Search bar */}
          <div className="pt-2 max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-[var(--ink-3)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates (e.g. dental, restaurant, HVAC)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--separator)] text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center justify-center flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Templates' },
            { id: 'Healthcare', label: 'Healthcare & Dental' },
            { id: 'Restaurant', label: 'Restaurants & Cafes' },
            { id: 'RealEstate', label: 'Real Estate' },
            { id: 'HomeServices', label: 'Home Services' },
            { id: 'Ecommerce', label: 'E-commerce' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                activeCategory === cat.id
                  ? 'bg-[var(--ink)] text-white shadow-sm'
                  : 'bg-[var(--surface)] border border-[var(--separator)] text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => (
            <Card
              key={t.id}
              className="p-6 flex flex-col justify-between bg-[var(--surface)] border border-[var(--separator)] rounded-2xl hover:border-[var(--accent)]/50 transition-all hover:shadow-md"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--separator)] flex items-center justify-center">
                    {t.icon}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {t.channels.includes('web') && (
                      <span className="p-1 rounded-md bg-[var(--surface-2)] text-[var(--ink-2)]" title="Website Chat Widget">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {t.channels.includes('whatsapp') && (
                      <span className="p-1 rounded-md bg-[var(--surface-2)] text-emerald-600" title="WhatsApp Cloud API">
                        <Radio className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {t.channels.includes('voice') && (
                      <span className="p-1 rounded-md bg-[var(--surface-2)] text-blue-600" title="Inbound AI Voice">
                        <Phone className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-[18px] font-bold text-[var(--ink)]">{t.name}</h3>
                  <p className="text-[12px] font-medium text-[var(--accent-ink)] mt-0.5">{t.tagline}</p>
                </div>

                <p className="text-[13px] text-[var(--ink-2)] leading-relaxed">
                  {t.desc}
                </p>

                {/* Sample Exchange Preview */}
                <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--separator)] space-y-2 text-[12px]">
                  <div className="font-semibold text-[var(--ink-3)] text-[10px] uppercase tracking-wider">
                    Interactive Sample
                  </div>
                  <p className="text-[var(--ink-2)] italic">
                    "{t.samplePrompt}"
                  </p>
                  <p className="text-[var(--ink)] font-medium">
                    ↳ {t.sampleAnswer}
                  </p>
                </div>

                {/* Knowledge Seeds */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-[var(--ink-3)] uppercase tracking-wider">
                    Seed Knowledge
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.knowledgeSources.map((ks, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--ink-2)] text-[11px] font-medium"
                      >
                        {ks}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[var(--separator)] flex items-center gap-2">
                <Link
                  to={status === 'authenticated' ? `/agents?template=${t.id}` : `/signup?template=${t.id}`}
                  className="w-full"
                >
                  <Button variant="primary" className="w-full" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                    {status === 'authenticated' ? 'Use in Workspace' : 'Use Template'}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Custom Template Request Banner */}
        <div className="rounded-2xl p-8 bg-[var(--surface)] border border-[var(--separator)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-[20px] font-bold text-[var(--ink)]">
              Need a custom template for your industry?
            </h3>
            <p className="text-[14px] text-[var(--ink-2)]">
              Our engineering team configures custom knowledge pipelines and tool integrations.
            </p>
          </div>
          <Link to="/signup">
            <Button variant="secondary" size="md">
              Request Industry Template
            </Button>
          </Link>
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
