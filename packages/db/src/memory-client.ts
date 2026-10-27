import argon2 from 'argon2';

export interface MemoryStoreData {
  users: any[];
  sessions: any[];
  workspaces: any[];
  memberships: any[];
  onboardingProgress: any[];
  plans: any[];
  subscriptions: any[];
  agents: any[];
}

export class MemoryPrismaClient {
  private data: MemoryStoreData = {
    users: [],
    sessions: [],
    workspaces: [],
    memberships: [],
    onboardingProgress: [],
    plans: [],
    subscriptions: [],
    agents: [],
  };

  private initialized = false;

  constructor() {
    this.initSync();
  }

  private initSync() {
    if (this.initialized) return;

    // Plans
    const starterPlan = { id: 'plan_starter', name: 'Starter', slug: 'starter', priceMonthlyCents: 4900, priceYearlyCents: 47000, maxAgents: 1, maxMessagesMonthly: 1000, hasVoice: false, hasWhatsApp: false };
    const proPlan = { id: 'plan_pro', name: 'Pro', slug: 'pro', priceMonthlyCents: 9900, priceYearlyCents: 95000, maxAgents: 5, maxMessagesMonthly: 10000, hasVoice: true, hasWhatsApp: true };
    const businessPlan = { id: 'plan_business', name: 'Business', slug: 'business', priceMonthlyCents: 19900, priceYearlyCents: 191000, maxAgents: 999, maxMessagesMonthly: 50000, hasVoice: true, hasWhatsApp: true };
    this.data.plans.push(starterPlan, proPlan, businessPlan);

    // Workspaces
    const smileWorkspace = {
      id: 'ws_smile_dental',
      name: 'Smile Dental Clinic',
      slug: 'smile-dental',
      logoUrl: null,
      timezone: 'America/New_York',
      defaultLanguage: 'en',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const otherWorkspace = {
      id: 'ws_other_co',
      name: 'Other Co',
      slug: 'other-co',
      logoUrl: null,
      timezone: 'UTC',
      defaultLanguage: 'en',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.workspaces.push(smileWorkspace, otherWorkspace);

    // Subscriptions
    this.data.subscriptions.push(
      { id: 'sub_smile', workspaceId: smileWorkspace.id, planId: proPlan.id, plan: proPlan, status: 'ACTIVE', currentPeriodEnd: new Date(Date.now() + 30 * 86400000) },
      { id: 'sub_other', workspaceId: otherWorkspace.id, planId: starterPlan.id, plan: starterPlan, status: 'ACTIVE', currentPeriodEnd: new Date(Date.now() + 30 * 86400000) }
    );

    // Agents
    this.data.agents.push(
      { id: 'agent_smile_01', workspaceId: smileWorkspace.id, name: 'Dental Assistant', isPublished: true, createdAt: new Date() },
      { id: 'agent_other_01', workspaceId: otherWorkspace.id, name: 'Support Agent', isPublished: true, createdAt: new Date() }
    );

    // Onboarding
    this.data.onboardingProgress.push(
      { id: 'onb_smile', workspaceId: smileWorkspace.id, currentStep: 7, completedStepsJson: [1, 2, 3, 4, 5, 6, 7], isComplete: true },
      { id: 'onb_other', workspaceId: otherWorkspace.id, currentStep: 2, completedStepsJson: [1, 2], isComplete: false }
    );

    // Pre-seed users with placeholders; hash on init
    this.data.users.push(
      {
        id: 'usr_smile_owner',
        email: 'owner@smiledental.com',
        name: 'Dr. Sarah Mitchell',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$p3g7cR3o3WzYfM7Jb5kL6g$Y6p3eH+e2uF0kXw4l1w1u1e7u1y7u1e7u1y7u1e7u1y', // will update with real hash
        emailVerified: true,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'usr_other_owner',
        email: 'owner@otherco.com',
        name: 'Alex Reed',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$p3g7cR3o3WzYfM7Jb5kL6g$Y6p3eH+e2uF0kXw4l1w1u1e7u1y7u1e7u1y7u1e7u1y',
        emailVerified: true,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'usr_shared_member',
        email: 'shared@agency.com',
        name: 'Jordan Taylor',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$p3g7cR3o3WzYfM7Jb5kL6g$Y6p3eH+e2uF0kXw4l1w1u1e7u1y7u1e7u1y7u1e7u1y',
        emailVerified: true,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    // Memberships
    this.data.memberships.push(
      { id: 'mem_smile_owner', userId: 'usr_smile_owner', workspaceId: smileWorkspace.id, role: 'OWNER', createdAt: new Date() },
      { id: 'mem_other_owner', userId: 'usr_other_owner', workspaceId: otherWorkspace.id, role: 'OWNER', createdAt: new Date() },
      { id: 'mem_shared_smile', userId: 'usr_shared_member', workspaceId: smileWorkspace.id, role: 'ADMIN', createdAt: new Date() },
      { id: 'mem_shared_other', userId: 'usr_shared_member', workspaceId: otherWorkspace.id, role: 'ADMIN', createdAt: new Date() }
    );

    // Generate real argon2 hash for Password123! in background
    argon2.hash('Password123!').then((hash) => {
      for (const u of this.data.users) {
        u.passwordHash = hash;
      }
      this.initialized = true;
    }).catch(console.error);
  }

  public async ensureReady() {
    if (!this.initialized) {
      const hash = await argon2.hash('Password123!');
      for (const u of this.data.users) {
        u.passwordHash = hash;
      }
      this.initialized = true;
    }
  }

  // Model accessors
  user = {
    findUnique: async ({ where, include }: any) => {
      await this.ensureReady();
      let match = null;
      if (where.email) {
        match = this.data.users.find((u) => u.email.toLowerCase() === where.email.toLowerCase()) || null;
      } else if (where.id) {
        match = this.data.users.find((u) => u.id === where.id) || null;
      }
      if (!match) return null;

      const res: any = { ...match };
      if (include?.memberships) {
        res.memberships = this.data.memberships
          .filter((m) => m.userId === match.id)
          .map((m) => {
            const mCopy: any = { ...m };
            if (include.memberships.include?.workspace) {
              mCopy.workspace = this.data.workspaces.find((w) => w.id === m.workspaceId) || null;
            }
            return mCopy;
          });
      }
      return res;
    },
    findFirst: async ({ where, include }: any) => {
      await this.ensureReady();
      const match = this.data.users.find((u) => {
        if (where?.email && u.email.toLowerCase() !== where.email.toLowerCase()) return false;
        if (where?.id && u.id !== where.id) return false;
        return true;
      }) || null;
      if (!match) return null;

      const res: any = { ...match };
      if (include?.memberships) {
        res.memberships = this.data.memberships
          .filter((m) => m.userId === match.id)
          .map((m) => {
            const mCopy: any = { ...m };
            if (include.memberships.include?.workspace) {
              mCopy.workspace = this.data.workspaces.find((w) => w.id === m.workspaceId) || null;
            }
            return mCopy;
          });
      }
      return res;
    },
    create: async ({ data }: any) => {
      await this.ensureReady();
      const newUser = {
        id: data.id || `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        emailVerified: data.emailVerified ?? false,
        role: data.role || 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.data.users.push(newUser);
      return newUser;
    },
    update: async ({ where, data }: any) => {
      await this.ensureReady();
      const u = this.data.users.find((user) => user.id === where.id || user.email === where.email);
      if (!u) throw new Error('User not found');
      Object.assign(u, data, { updatedAt: new Date() });
      return u;
    },
  };

  session = {
    findUnique: async ({ where, include }: any) => {
      const sess = this.data.sessions.find((s) => s.token === where.token);
      if (!sess) return null;
      if (include?.user) {
        const user = this.data.users.find((u) => u.id === sess.userId);
        return { ...sess, user };
      }
      return sess;
    },
    create: async ({ data }: any) => {
      const newSession = {
        id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        ...data,
        createdAt: new Date(),
      };
      this.data.sessions.push(newSession);
      return newSession;
    },
    deleteMany: async ({ where }: any) => {
      const before = this.data.sessions.length;
      this.data.sessions = this.data.sessions.filter((s) => s.token !== where.token);
      return { count: before - this.data.sessions.length };
    },
  };

  workspace = {
    findUnique: async ({ where }: any) => {
      return this.data.workspaces.find((w) => w.id === where.id || w.slug === where.slug) || null;
    },
    findMany: async ({ where }: any) => {
      return this.data.workspaces.filter((w) => {
        if (where?.id && w.id !== where.id) return false;
        return true;
      });
    },
    create: async ({ data }: any) => {
      const newWs = {
        id: data.id || `ws_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: data.name,
        slug: data.slug,
        logoUrl: data.logoUrl || null,
        timezone: data.timezone || 'UTC',
        defaultLanguage: data.defaultLanguage || 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.data.workspaces.push(newWs);
      return newWs;
    },
    update: async ({ where, data }: any) => {
      const ws = this.data.workspaces.find((w) => w.id === where.id);
      if (!ws) throw new Error('Workspace not found');
      Object.assign(ws, data, { updatedAt: new Date() });
      return ws;
    },
  };

  membership = {
    findUnique: async ({ where, include }: any) => {
      const match = this.data.memberships.find((m) => {
        if (where.userId_workspaceId) {
          return m.userId === where.userId_workspaceId.userId && m.workspaceId === where.userId_workspaceId.workspaceId;
        }
        if (where.id) return m.id === where.id;
        return false;
      });
      if (!match) return null;

      const res: any = { ...match };
      if (include?.workspace) {
        const ws = this.data.workspaces.find((w) => w.id === match.workspaceId);
        if (ws) {
          const wsCopy: any = { ...ws };
          if (include.workspace.include?.subscription) {
            const sub = this.data.subscriptions.find((s) => s.workspaceId === ws.id);
            wsCopy.subscription = sub ? { ...sub, plan: sub.plan } : null;
          }
          if (include.workspace.include?.agents) {
            wsCopy.agents = this.data.agents.filter((a) => a.workspaceId === ws.id);
          }
          res.workspace = wsCopy;
        }
      }
      return res;
    },
    findFirst: async ({ where, include }: any) => {
      const match = this.data.memberships.find((m) => {
        if (where?.userId && m.userId !== where.userId) return false;
        if (where?.workspaceId && m.workspaceId !== where.workspaceId) return false;
        return true;
      });
      if (!match) return null;

      const res: any = { ...match };
      if (include?.workspace) {
        res.workspace = this.data.workspaces.find((w) => w.id === match.workspaceId) || null;
      }
      return res;
    },
    findMany: async ({ where, include }: any) => {
      return this.data.memberships
        .filter((m) => {
          if (where?.userId && m.userId !== where.userId) return false;
          if (where?.workspaceId && m.workspaceId !== where.workspaceId) return false;
          return true;
        })
        .map((m) => {
          const res: any = { ...m };
          if (include?.workspace) {
            const ws = this.data.workspaces.find((w) => w.id === m.workspaceId);
            if (ws) {
              const wsCopy: any = { ...ws };
              if (include.workspace.include?.subscription) {
                const sub = this.data.subscriptions.find((s) => s.workspaceId === ws.id);
                wsCopy.subscription = sub ? { ...sub, plan: sub.plan } : null;
              }
              if (include.workspace.include?.agents) {
                wsCopy.agents = this.data.agents.filter((a) => a.workspaceId === ws.id);
              }
              res.workspace = wsCopy;
            }
          }
          return res;
        });
    },
    create: async ({ data }: any) => {
      const newMem = {
        id: data.id || `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: data.userId,
        workspaceId: data.workspaceId,
        role: data.role || 'VIEWER',
        createdAt: new Date(),
      };
      this.data.memberships.push(newMem);
      return newMem;
    },
  };

  onboardingProgress = {
    findUnique: async ({ where }: any) => {
      return this.data.onboardingProgress.find((o) => o.workspaceId === where.workspaceId) || null;
    },
    create: async ({ data }: any) => {
      const newOnb = {
        id: `onb_${Date.now()}`,
        ...data,
      };
      this.data.onboardingProgress.push(newOnb);
      return newOnb;
    },
    update: async ({ where, data }: any) => {
      const onb = this.data.onboardingProgress.find((o) => o.workspaceId === where.workspaceId);
      if (!onb) throw new Error('Onboarding progress not found');
      Object.assign(onb, data);
      return onb;
    },
    upsert: async ({ where, update, create }: any) => {
      const existing = this.data.onboardingProgress.find((o) => o.workspaceId === where.workspaceId);
      if (existing) {
        Object.assign(existing, update);
        return existing;
      }
      const newOnb = {
        id: `onb_${Date.now()}`,
        ...create,
      };
      this.data.onboardingProgress.push(newOnb);
      return newOnb;
    },
  };

  plan = {
    findMany: async () => this.data.plans,
    findUnique: async ({ where }: any) => this.data.plans.find((p) => p.id === where.id || p.slug === where.slug) || null,
  };

  subscription = {
    findUnique: async ({ where }: any) => this.data.subscriptions.find((s) => s.workspaceId === where.workspaceId) || null,
    findFirst: async ({ where }: any) => this.data.subscriptions.find((s) => s.workspaceId === where?.workspaceId) || null,
  };

  agent = {
    findMany: async ({ where }: any) => {
      return this.data.agents.filter((a) => {
        if (where?.workspaceId && a.workspaceId !== where.workspaceId) return false;
        return true;
      });
    },
  };

  async $disconnect() {
    return Promise.resolve();
  }

  async $connect() {
    return Promise.resolve();
  }

  $extends(ext: any) {
    // Return self or extension wrapper
    return this;
  }

  async $transaction(fn: any) {
    if (typeof fn === 'function') {
      return fn(this);
    }
    return Promise.all(fn);
  }
}
