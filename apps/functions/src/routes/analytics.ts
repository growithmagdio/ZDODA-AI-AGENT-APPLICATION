import { Router } from 'express';
import { Timestamp } from 'firebase-admin/firestore';
import { paths } from '../firebase.js';
import { h } from '../lib/http.js';
import { requirePermission } from '../middleware/auth.js';

export const analyticsRouter = Router();

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

analyticsRouter.get(
  '/summary',
  requirePermission('read', 'Dashboard'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 90);
    const since = new Date(Date.now() - days * 86400_000);
    const prevSince = new Date(Date.now() - 2 * days * 86400_000);
    const [convSnap, leadSnap] = await Promise.all([
      paths.conversations(ws).where('createdAt', '>=', Timestamp.fromDate(prevSince)).orderBy('createdAt', 'asc').limit(5000).get(),
      paths.leads(ws).where('createdAt', '>=', Timestamp.fromDate(prevSince)).limit(5000).get(),
    ]);
    const convs = convSnap.docs
      .map((d) => ({ ...d.data(), id: d.id, created: d.get('createdAt')?.toDate?.() as Date }))
      .filter((c: any) => c.created && c.channel !== 'test');
    const cur = convs.filter((c) => c.created >= since);
    const prev = convs.filter((c) => c.created < since);
    const leadsCur = leadSnap.docs.filter((d) => d.get('createdAt')?.toDate?.() >= since).length;
    const leadsPrev = leadSnap.size - leadsCur;

    const series: Record<string, { date: string; web: number; whatsapp: number; voice: number; total: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const k = dayKey(new Date(Date.now() - i * 86400_000));
      series[k] = { date: k, web: 0, whatsapp: 0, voice: 0, total: 0 };
    }
    for (const c of cur as any[]) {
      const k = dayKey(c.created);
      if (!series[k]) continue;
      series[k][c.channel as 'web'] = (series[k][c.channel as 'web'] || 0) + 1;
      series[k].total++;
    }

    const stats = (list: any[]) => {
      const total = list.length;
      const handoff = list.filter((c) => c.status === 'handoff' || c.takeover).length;
      const messages = list.reduce((s, c) => s + (c.messageCount || 0), 0);
      return { total, handoff, messages, aiResolution: total ? Math.round(((total - handoff) / total) * 1000) / 10 : 0 };
    };
    const a = stats(cur);
    const b = stats(prev);
    const delta = (x: number, y: number) => (y ? Math.round(((x - y) / y) * 1000) / 10 : x ? 100 : 0);

    const questions = new Map<string, { text: string; count: number }>();
    for (const c of cur as any[]) {
      const t = String(c.firstMessage || '').trim();
      if (!t) continue;
      const key = t.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').slice(0, 80);
      const q = questions.get(key) || { text: t, count: 0 };
      q.count++;
      questions.set(key, q);
    }

    const byAgent = new Map<string, { agentId: string; name: string; conversations: number; handoffs: number }>();
    for (const c of cur as any[]) {
      const row = byAgent.get(c.agentId) || { agentId: c.agentId, name: c.agentName || 'Agent', conversations: 0, handoffs: 0 };
      row.conversations++;
      if (c.status === 'handoff' || c.takeover) row.handoffs++;
      byAgent.set(c.agentId, row);
    }

    res.json({
      days,
      kpis: {
        conversations: { value: a.total, delta: delta(a.total, b.total) },
        messages: { value: a.messages, delta: delta(a.messages, b.messages) },
        leads: { value: leadsCur, delta: delta(leadsCur, leadsPrev) },
        aiResolution: { value: a.aiResolution, delta: Math.round((a.aiResolution - b.aiResolution) * 10) / 10 },
        handoffs: { value: a.handoff, delta: delta(a.handoff, b.handoff) },
      },
      series: Object.values(series),
      topQuestions: [...questions.values()].sort((x, y) => y.count - x.count).slice(0, 6),
      agents: [...byAgent.values()].sort((x, y) => y.conversations - x.conversations),
      channels: ['web', 'whatsapp', 'voice'].map((ch) => ({ channel: ch, conversations: cur.filter((c: any) => c.channel === ch).length })),
    });
  })
);
