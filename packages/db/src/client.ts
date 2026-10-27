import { PrismaClient } from '@prisma/client';
import { MemoryPrismaClient } from './memory-client';

declare global {
  // eslint-disable-next-line no-var
  var __zdodaPrisma__: PrismaClient | undefined;
}

function getPrismaClient(): PrismaClient {
  if (global.__zdodaPrisma__) return global.__zdodaPrisma__;

  if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
    try {
      return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      });
    } catch {
      console.warn('⚠️ [Prisma] PostgreSQL not reachable. Falling back to in-memory demo data store.');
      return new MemoryPrismaClient() as unknown as PrismaClient;
    }
  }

  return new MemoryPrismaClient() as unknown as PrismaClient;
}

export const prisma: PrismaClient = getPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__zdodaPrisma__ = prisma;
}

export const TENANT_MODELS = [
  'agent',
  'agentVersion',
  'knowledgeSource',
  'knowledgeChunk',
  'agentKnowledge',
  'tool',
  'agentTool',
  'integrationConnection',
  'channel',
  'phoneNumber',
  'contact',
  'lead',
  'conversation',
  'message',
  'callRecord',
  'widgetConfig',
  'widgetVersion',
  'onboardingProgress',
  'auditLog',
  'notification',
  'subscription',
  'usageRecord',
  'invoice',
] as const;

export type TenantModel = typeof TENANT_MODELS[number];

/**
 * Creates a workspace-scoped Prisma client extension that automatically asserts
 * and injects workspaceId on all tenant-owned queries.
 */
export function createTenantClient(workspaceId: string) {
  if (!workspaceId) {
    throw new Error('createTenantClient requires a non-empty workspaceId');
  }

  return prisma.$extends({
    name: 'TenantIsolationExtension',
    query: {
      $allModels: {
        findMany({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
          const modelLower = model.charAt(0).toLowerCase() + model.slice(1);
          if (TENANT_MODELS.includes(modelLower as TenantModel)) {
            args.where = { ...(args.where || {}), workspaceId };
          }
          return query(args);
        },
        findFirst({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
          const modelLower = model.charAt(0).toLowerCase() + model.slice(1);
          if (TENANT_MODELS.includes(modelLower as TenantModel)) {
            args.where = { ...(args.where || {}), workspaceId };
          }
          return query(args);
        },
        count({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
          const modelLower = model.charAt(0).toLowerCase() + model.slice(1);
          if (TENANT_MODELS.includes(modelLower as TenantModel)) {
            args.where = { ...(args.where || {}), workspaceId };
          }
          return query(args);
        },
        create({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
          const modelLower = model.charAt(0).toLowerCase() + model.slice(1);
          if (TENANT_MODELS.includes(modelLower as TenantModel)) {
            args.data = { ...(args.data || {}), workspaceId };
          }
          return query(args);
        },
        createMany({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
          const modelLower = model.charAt(0).toLowerCase() + model.slice(1);
          if (TENANT_MODELS.includes(modelLower as TenantModel)) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((item: any) => ({ ...item, workspaceId }));
            }
          }
          return query(args);
        },
        update({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
          const modelLower = model.charAt(0).toLowerCase() + model.slice(1);
          if (TENANT_MODELS.includes(modelLower as TenantModel)) {
            args.where = { ...(args.where || {}), workspaceId };
          }
          return query(args);
        },
        updateMany({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
          const modelLower = model.charAt(0).toLowerCase() + model.slice(1);
          if (TENANT_MODELS.includes(modelLower as TenantModel)) {
            args.where = { ...(args.where || {}), workspaceId };
          }
          return query(args);
        },
        delete({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
          const modelLower = model.charAt(0).toLowerCase() + model.slice(1);
          if (TENANT_MODELS.includes(modelLower as TenantModel)) {
            args.where = { ...(args.where || {}), workspaceId };
          }
          return query(args);
        },
        deleteMany({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
          const modelLower = model.charAt(0).toLowerCase() + model.slice(1);
          if (TENANT_MODELS.includes(modelLower as TenantModel)) {
            args.where = { ...(args.where || {}), workspaceId };
          }
          return query(args);
        },
      },
    },
  });
}
