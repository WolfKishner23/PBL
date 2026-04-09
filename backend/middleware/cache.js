// ─── Response Cache Middleware ───────────────────────────────────────────────
// Caches GET responses in-memory to reduce database load.
//
// HOW IT WORKS:
//   1. GET request comes in → check if cached
//   2. Cache HIT → return cached response instantly (no DB query)
//   3. Cache MISS → process normally, cache result for CACHE_TTL seconds
//   4. Any write operation (POST/PUT/DELETE) → clears the cache automatically
//
// SAFE: Only caches GET requests. Write operations always hit the database.
// ─────────────────────────────────────────────────────────────────────────────

const cache = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

// Auto-cleanup expired entries every 60 seconds
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
        if (now - entry.timestamp > CACHE_TTL_MS) {
            cache.delete(key);
        }
    }
}, 60 * 1000);

// Clear all cache entries (call this after any write operation)
const invalidateCache = () => {
    cache.clear();
};

// Cache middleware for GET routes
const cacheResponse = (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next();
    }

    // Build cache key from URL + user id (different users see different data)
    const userId = req.user ? req.user.id : 'anonymous';
    const cacheKey = `${req.originalUrl}:${userId}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        console.log(`⚡ Cache hit: ${req.originalUrl}`);
        return res.status(cached.statusCode).json(cached.body);
    }

    // Cache miss — intercept response to cache it
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
            cache.set(cacheKey, {
                statusCode: res.statusCode,
                body,
                timestamp: Date.now()
            });
        }
        return originalJson(body);
    };

    next();
};

module.exports = { cacheResponse, invalidateCache };
