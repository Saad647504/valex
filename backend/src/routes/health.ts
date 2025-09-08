import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const router = Router();
const prisma = new PrismaClient();

function getRedis(): Redis | null {
  try {
    const url = process.env.REDIS_URL || '';
    if (!url) return null;
    return new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
  } catch {
    return null;
  }
}

router.get('/healthz', async (_req, res) => {
  const result: any = { status: 'ok', timestamp: new Date().toISOString() };
  // DB check
  try {
    await prisma.$queryRaw`SELECT 1`;
    result.db = 'ok';
  } catch (e: any) {
    result.db = 'error';
    result.dbError = e?.message || 'unknown';
  }

  // Redis check (optional)
  let redis: Redis | null = null;
  try {
    redis = getRedis();
    if (redis) {
      await redis.connect();
      const pong = await redis.ping();
      result.redis = pong === 'PONG' ? 'ok' : 'error';
    } else {
      result.redis = 'not_configured';
    }
  } catch (e: any) {
    result.redis = 'error';
    result.redisError = e?.message || 'unknown';
  } finally {
    try { await redis?.quit(); } catch {}
  }

  const httpCode = result.db === 'ok' && (result.redis === 'ok' || result.redis === 'not_configured') ? 200 : 503;
  res.status(httpCode).json(result);
});

router.get('/ready', async (_req, res) => {
  // Minimal readiness: DB connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ready: true });
  } catch (e: any) {
    res.status(503).json({ ready: false, error: e?.message || 'unknown' });
  }
});

export default router;

