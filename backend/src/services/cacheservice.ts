import Redis from 'ioredis';

class CacheService {
  private redis: Redis;
  private defaultTTL = 300; // 5 minutes

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  async get(key: string) {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, data: any, ttlSeconds?: number) {
    try {
      const ttl = ttlSeconds || this.defaultTTL;
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async invalidatePattern(pattern: string) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  // Project-specific cache methods
  async getProjectAnalytics(projectId: string) {
    return this.get(`analytics:project:${projectId}`);
  }

  async setProjectAnalytics(projectId: string, data: any) {
    return this.set(`analytics:project:${projectId}`, data, 600); // 10 minutes
  }

  async invalidateProjectCache(projectId: string) {
    await this.invalidatePattern(`*:project:${projectId}*`);
  }
}

export const cacheService = new CacheService();