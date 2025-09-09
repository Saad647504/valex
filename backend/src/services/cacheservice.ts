import Redis from 'ioredis';

class CacheService {
  private redis: Redis | null = null;
  private defaultTTL = 300; // 5 minutes

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    
    if (redisUrl) {
      this.redis = new Redis(redisUrl);

      this.redis.on('error', (error) => {
        console.error('Redis connection error:', error);
      });

      this.redis.on('connect', () => {
        console.log('Redis connected successfully');
      });
    } else {
      console.log('Redis not configured, caching disabled');
    }
  }

  async get(key: string) {
    if (!this.redis) return null;
    
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, data: any, ttlSeconds?: number) {
    if (!this.redis) return;
    
    try {
      const ttl = ttlSeconds || this.defaultTTL;
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async invalidatePattern(pattern: string) {
    if (!this.redis) return;
    
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

let cacheServiceInstance: CacheService | null = null;

export const getCacheService = (): CacheService => {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new CacheService();
  }
  return cacheServiceInstance;
};

export const cacheService = getCacheService();