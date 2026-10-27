import { prisma } from './client';
import argon2 from 'argon2';
import { DEMO_PLANS, WidgetConfigV1Schema } from '@zdoda/shared';

export async function runSeed() {
  console.log('🌱 Starting Zdoda Database Seeding...');

  // 1. Seed Plans
  console.log('📦 Seeding Plans...');
  for (const plan of DEMO_PLANS) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        priceMonthly: plan.priceMonthlyCents,
        priceYearly: plan.priceYearlyCents,
        showPrice: plan.showPrice,
        messageLimit: plan.messageLimit,
        voiceSecondsLimit: plan.voiceSecondsLimit,
        agentLimit: plan.agentLimit,
        featuresJson: plan.features,
      },
      create: {
        id: plan.planId,
        slug: plan.slug,
        name: plan.name,
        description: `${plan.name} Plan for AI Agents`,
        priceMonthly: plan.priceMonthlyCents,
        priceYearly: plan.priceYearlyCents,
        showPrice: plan.showPrice,
        messageLimit: plan.messageLimit,
        voiceSecondsLimit: plan.voiceSecondsLimit,
        agentLimit: plan.agentLimit,
        featuresJson: plan.features,
      },
    });
  }

  // 2. Hash default password for test users
  const defaultPasswordHash = await argon2.hash('Password123!');

  // 3. Seed Primary Workspace: Smile Dental Clinic
  console.log('🏥 Seeding Smile Dental Clinic workspace...');
  const smileOwner = await prisma.user.upsert({
    where: { email: 'owner@smiledental.com' },
    update: { name: 'Dr. Sarah Mitchell', emailVerified: true },
    create: {
      email: 'owner@smiledental.com',
      passwordHash: defaultPasswordHash,
      name: 'Dr. Sarah Mitchell',
      emailVerified: true,
      role: 'USER',
    },
  });

  const smileWorkspace = await prisma.workspace.upsert({
    where: { slug: 'smile-dental-clinic' },
    update: { name: 'Smile Dental Clinic' },
    create: {
      id: 'ws_smile_dental',
      name: 'Smile Dental Clinic',
      slug: 'smile-dental-clinic',
      timezone: 'America/New_York',
      defaultLanguage: 'en',
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: smileOwner.id,
        workspaceId: smileWorkspace.id,
      },
    },
    update: { role: 'OWNER' },
    create: {
      userId: smileOwner.id,
      workspaceId: smileWorkspace.id,
      role: 'OWNER',
    },
  });

  // Assign Pro Plan to Smile Dental
  await prisma.subscription.upsert({
    where: { workspaceId: smileWorkspace.id },
    update: { status: 'ACTIVE', planId: 'plan_pro' },
    create: {
      workspaceId: smileWorkspace.id,
      planId: 'plan_pro',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Onboarding progress
  await prisma.onboardingProgress.upsert({
    where: { workspaceId: smileWorkspace.id },
    update: { currentStep: 7, isComplete: true, completedStepsJson: [1, 2, 3, 4, 5, 6, 7] },
    create: {
      workspaceId: smileWorkspace.id,
      currentStep: 7,
      completedStepsJson: [1, 2, 3, 4, 5, 6, 7],
      isComplete: true,
    },
  });

  // Seed "Dental Assistant" Agent
  const dentalAgent = await prisma.agent.upsert({
    where: { id: 'agent_dental_assistant' },
    update: { isPublished: true },
    create: {
      id: 'agent_dental_assistant',
      workspaceId: smileWorkspace.id,
      name: 'Dental Assistant',
      description: 'Friendly, empathetic clinic assistant for appointments and patient inquiries.',
      category: 'Healthcare',
      personality: 'Friendly, professional, reassuring',
      tone: 'Warm and clinical',
      systemInstructions:
        'You are the AI Dental Assistant for Smile Dental Clinic. Your mission is to assist patients with dental service inquiries, treatment pricing, clinic hours, and scheduling appointments. Always remain calm, polite, and reassuring. For medical emergencies, advise calling 911 or visiting the clinic immediately.',
      model: 'gpt-4o',
      temperature: 0.7,
      language: 'auto',
      welcomeMessage: 'Hello! Welcome to Smile Dental Clinic. How can I assist you with your dental care today?',
      fallbackResponse: "I'd be glad to have one of our patient care coordinators call you directly to discuss this in detail. May I take your phone number?",
      voiceEnabled: true,
      isPublished: true,
    },
  });

  // Seed Knowledge Sources for Smile Dental
  const sources = [
    { name: 'smiledental.com Website & Sitemap', type: 'WEBSITE' as const, count: 48, status: 'ACTIVE' as const },
    { name: 'Clinic Brochure & Services PDF', type: 'PDF' as const, count: 24, status: 'ACTIVE' as const },
    { name: 'Patient FAQ Document', type: 'FAQ' as const, count: 18, status: 'ACTIVE' as const },
    { name: 'Services & Treatment Pricing Sheet', type: 'CSV' as const, count: 32, status: 'ACTIVE' as const },
  ];

  for (const src of sources) {
    const createdSource = await prisma.knowledgeSource.create({
      data: {
        workspaceId: smileWorkspace.id,
        name: src.name,
        type: src.type,
        status: src.status,
        chunkCount: src.count,
        lastSyncedAt: new Date(),
      },
    });

    await prisma.agentKnowledge.create({
      data: {
        workspaceId: smileWorkspace.id,
        agentId: dentalAgent.id,
        knowledgeSourceId: createdSource.id,
      },
    });
  }

  // Seed Channels
  const webChannel = await prisma.channel.create({
    data: {
      workspaceId: smileWorkspace.id,
      agentId: dentalAgent.id,
      type: 'WEBSITE',
      isEnabled: true,
      status: 'LIVE',
      lastHealthCheckAt: new Date(),
    },
  });

  await prisma.channel.create({
    data: {
      workspaceId: smileWorkspace.id,
      agentId: dentalAgent.id,
      type: 'WHATSAPP',
      isEnabled: true,
      status: 'TEST_MODE',
      lastHealthCheckAt: new Date(),
    },
  });

  await prisma.channel.create({
    data: {
      workspaceId: smileWorkspace.id,
      agentId: dentalAgent.id,
      type: 'VOICE',
      isEnabled: true,
      status: 'DEMO',
      lastHealthCheckAt: new Date(),
    },
  });

  // Seed WidgetConfig with defaults
  const defaultWidgetConfig = WidgetConfigV1Schema.parse({});
  await prisma.widgetConfig.create({
    data: {
      id: 'cfg_smile_dental',
      workspaceId: smileWorkspace.id,
      channelId: webChannel.id,
      publicKey: 'wk_pub_smiledental_demo',
      allowedDomains: ['*'],
      draftJson: defaultWidgetConfig as any,
      version: 1,
    },
  });

  // Seed Demo Contacts, Leads, Conversations & Messages
  const demoPatients = [
    { name: 'Sarah M.', email: 'sarah.m@example.com', phone: '+1-555-0101', query: 'I would like to book a dental checkup and teeth cleaning next Tuesday morning.' },
    { name: 'John D.', email: 'john.d@example.com', phone: '+1-555-0102', query: 'What is the price for porcelain dental veneers?' },
    { name: 'Priya S.', email: 'priya.s@example.com', phone: '+1-555-0103', query: 'Can I reschedule my root canal follow-up appointment?' },
    { name: 'Mike R.', email: 'mike.r@example.com', phone: '+1-555-0104', query: 'Do you accept Delta Dental insurance plans?' },
  ];

  for (const patient of demoPatients) {
    const contact = await prisma.contact.create({
      data: {
        workspaceId: smileWorkspace.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
      },
    });

    const conversation = await prisma.conversation.create({
      data: {
        workspaceId: smileWorkspace.id,
        agentId: dentalAgent.id,
        channelId: webChannel.id,
        contactId: contact.id,
        channelType: 'WEBSITE',
        status: 'OPEN',
        leadStatus: 'QUALIFIED',
      },
    });

    await prisma.lead.create({
      data: {
        workspaceId: smileWorkspace.id,
        contactId: contact.id,
        conversationId: conversation.id,
        score: 85,
        status: 'QUALIFIED',
        summary: `Interested in dental treatment. Query: "${patient.query}"`,
      },
    });

    // Inbound user message
    await prisma.message.create({
      data: {
        workspaceId: smileWorkspace.id,
        conversationId: conversation.id,
        role: 'USER',
        content: patient.query,
      },
    });

    // Outbound assistant message
    await prisma.message.create({
      data: {
        workspaceId: smileWorkspace.id,
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: `Thank you for reaching out, ${patient.name}! I'd be happy to assist you with that right away. Let me check our clinic schedule.`,
      },
    });
  }

  // 4. Seed Secondary Workspace: Other Co (for tenant isolation tests)
  console.log('🏢 Seeding Other Co workspace...');
  const otherOwner = await prisma.user.upsert({
    where: { email: 'owner@otherco.com' },
    update: { name: 'Alex Johnson', emailVerified: true },
    create: {
      email: 'owner@otherco.com',
      passwordHash: defaultPasswordHash,
      name: 'Alex Johnson',
      emailVerified: true,
      role: 'USER',
    },
  });

  const otherWorkspace = await prisma.workspace.upsert({
    where: { slug: 'other-co' },
    update: { name: 'Other Co' },
    create: {
      id: 'ws_other_co',
      name: 'Other Co',
      slug: 'other-co',
      timezone: 'UTC',
      defaultLanguage: 'en',
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: otherOwner.id,
        workspaceId: otherWorkspace.id,
      },
    },
    update: { role: 'OWNER' },
    create: {
      userId: otherOwner.id,
      workspaceId: otherWorkspace.id,
      role: 'OWNER',
    },
  });

  // 5. Seed Dual-Member User (belongs to both Smile Dental and Other Co)
  console.log('👥 Seeding dual-member agency user...');
  const sharedUser = await prisma.user.upsert({
    where: { email: 'shared@agency.com' },
    update: { name: 'Elena Rostova (Agency Member)', emailVerified: true },
    create: {
      email: 'shared@agency.com',
      passwordHash: defaultPasswordHash,
      name: 'Elena Rostova (Agency Member)',
      emailVerified: true,
      role: 'USER',
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: sharedUser.id,
        workspaceId: smileWorkspace.id,
      },
    },
    update: { role: 'BUILDER' },
    create: {
      userId: sharedUser.id,
      workspaceId: smileWorkspace.id,
      role: 'BUILDER',
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: sharedUser.id,
        workspaceId: otherWorkspace.id,
      },
    },
    update: { role: 'ADMIN' },
    create: {
      userId: sharedUser.id,
      workspaceId: otherWorkspace.id,
      role: 'ADMIN',
    },
  });

  console.log('✅ Zdoda Database Seeding successfully completed!');
}

if (typeof process !== 'undefined' && process.argv && process.argv[1] && (process.argv[1].includes('seed.ts') || process.argv[1].includes('seed.js'))) {
  runSeed()
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
