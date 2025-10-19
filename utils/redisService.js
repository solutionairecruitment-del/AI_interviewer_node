const redis = require("redis");

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  // Initialize Redis connection
  async connect() {
    try {
      // Check if Redis URL is provided
      const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

      // Create Redis client
      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          // connectTimeout: 5000, // 5 seconds timeout
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.log(
                "⚠️ Redis connection failed, using in-memory fallback"
              );
              this.isConnected = false;
              return false;
            }
            return Math.min(retries * 1000, 3000);
          },
        },
      });

      // Handle connection events
      this.client.on("connect", () => {
        console.log("Connected to Redis");
        this.isConnected = true;
      });

      this.client.on("error", (err) => {
        console.error(" Redis connection error:", err);
        this.isConnected = false;
      });

      this.client.on("end", () => {
        console.log("🔌 Redis connection ended");
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();

      return true;
    } catch (error) {
      console.error(" Failed to connect to Redis:", error.message);
      this.isConnected = false;
      return false;
    }
  }

  // Add token to blacklist
  async addToBlacklist(token, expirySeconds = 3600) {
    try {
      if (!this.isConnected || !this.client) {
        console.warn("Redis not connected, using in-memory fallback");
        return this.addToInMemoryBlacklist(token, expirySeconds);
      }

      const key = `blacklist:${token}`;
      await this.client.setEx(key, expirySeconds, "blacklisted");

      console.log(`Token blacklisted for ${expirySeconds} seconds`);
      return true;
    } catch (error) {
      console.error(" Error adding token to blacklist:", error);
      return false;
    }
  }

  // Check if token is blacklisted
  async isBlacklisted(token) {
    try {
      if (!this.isConnected || !this.client) {
        console.warn(" Redis not connected, using in-memory fallback");
        return this.isInMemoryBlacklisted(token);
      }

      const key = `blacklist:${token}`;
      const result = await this.client.get(key);

      return result === "blacklisted";
    } catch (error) {
      console.error("Error checking blacklist:", error);
      return false;
    }
  }

  // Get all blacklisted tokens (admin only)
  async getBlacklistedTokens() {
    try {
      if (!this.isConnected || !this.client) {
        console.warn("Redis not connected, using in-memory fallback");
        return this.getInMemoryBlacklistedTokens();
      }

      const keys = await this.client.keys("blacklist:*");
      const tokens = [];

      for (const key of keys) {
        const token = key.replace("blacklist:", "");
        const ttl = await this.client.ttl(key);
        tokens.push({
          token: token.substring(0, 20) + "...", // Truncate for security
          expiresIn: ttl > 0 ? ttl : "expired",
        });
      }

      return tokens;
    } catch (error) {
      console.error("Error getting blacklisted tokens:", error);
      return [];
    }
  }

  // Clear expired tokens
  async clearExpiredTokens() {
    try {
      if (!this.isConnected || !this.client) {
        console.warn("Redis not connected, using in-memory fallback");
        return this.clearInMemoryExpiredTokens();
      }

      const keys = await this.client.keys("blacklist:*");
      let clearedCount = 0;

      for (const key of keys) {
        const ttl = await this.client.ttl(key);
        if (ttl <= 0) {
          await this.client.del(key);
          clearedCount++;
        }
      }

      if (clearedCount > 0) {
        console.log(`Cleared ${clearedCount} expired tokens`);
      }

      return clearedCount;
    } catch (error) {
      console.error("Error clearing expired tokens:", error);
      return 0;
    }
  }

  // In-memory fallback for when Redis is not available
  // Initialize in-memory blacklist
  initializeInMemoryBlacklist() {
    if (!this.inMemoryBlacklist) {
      this.inMemoryBlacklist = new Map();
    }
  }

  // In-memory blacklist methods
  addToInMemoryBlacklist(token, expirySeconds) {
    this.initializeInMemoryBlacklist();
    const expiryTime = Date.now() + expirySeconds * 1000;
    this.inMemoryBlacklist.set(token, expiryTime);

    // Auto-cleanup after expiry
    setTimeout(() => {
      this.inMemoryBlacklist.delete(token);
    }, expirySeconds * 1000);

    console.log(
      `Token added to in-memory blacklist for ${expirySeconds} seconds`
    );
    return true;
  }

  isInMemoryBlacklisted(token) {
    this.initializeInMemoryBlacklist();
    const expiryTime = this.inMemoryBlacklist.get(token);
    if (!expiryTime) return false;

    if (Date.now() > expiryTime) {
      this.inMemoryBlacklist.delete(token);
      return false;
    }

    return true;
  }

  getInMemoryBlacklistedTokens() {
    this.initializeInMemoryBlacklist();
    const tokens = [];
    const now = Date.now();

    for (const [token, expiryTime] of this.inMemoryBlacklist.entries()) {
      const expiresIn = Math.max(0, Math.floor((expiryTime - now) / 1000));
      tokens.push({
        token: token.substring(0, 20) + "...",
        expiresIn: expiresIn > 0 ? expiresIn : "expired",
      });
    }

    return tokens;
  }

  clearInMemoryExpiredTokens() {
    this.initializeInMemoryBlacklist();
    const now = Date.now();
    let clearedCount = 0;

    for (const [token, expiryTime] of this.inMemoryBlacklist.entries()) {
      if (now > expiryTime) {
        this.inMemoryBlacklist.delete(token);
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      console.log(`Cleared ${clearedCount} expired in-memory tokens`);
    }

    return clearedCount;
  }

  // Close Redis connection
  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        console.log("🔌 Redis connection closed");
      }
    } catch (error) {
      console.error("Error closing Redis connection:", error);
    }
  }
}

// Create singleton instance
const redisService = new RedisService();

module.exports = redisService;
