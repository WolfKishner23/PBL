// ─── Idempotency Middleware ──────────────────────────────────────────────────
// Prevents duplicate processing of the same financial operation.
//
// HOW IT WORKS:
//   1. Client sends header: Idempotency-Key: <unique-id>
//   2. If we've seen that key before → return the cached response
//   3. If new key → process normally, cache the response for 5 minutes
//   4. If NO header sent → pass through normally (no change to existing behavior)
//
// SAFE: This middleware does NOT interfere with requests that don't send the header.
// ─────────────────────────────────────────────────────────────────────────────

const responseCache = new Map();

// Auto-cleanup: remove expired entries every 60 seconds
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of responseCache) {
        if (now - entry.timestamp > CACHE_TTL_MS) {
            responseCache.delete(key);
        }
    }
}, 60 * 1000);

const idempotency = (req, res, next) => {
    const idempotencyKey = req.headers['idempotency-key'];

    // No header? Pass through — everything works as before
    if (!idempotencyKey) {
        return next();
    }

    // Build a unique cache key: method + path + idempotency key + user id
    const userId = req.user ? req.user.id : 'anonymous';
    const cacheKey = `${req.method}:${req.originalUrl}:${idempotencyKey}:${userId}`;

    // Check if we already processed this exact request
    const cached = responseCache.get(cacheKey);
    if (cached) {
        console.log(`🔄 Idempotency hit: returning cached response for key "${idempotencyKey}"`);
        return res.status(cached.statusCode).json(cached.body);
    }

    // Mark this key as "in-progress" to block concurrent duplicates
    responseCache.set(cacheKey, { status: 'processing', timestamp: Date.now() });

    // Intercept the response to cache it
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        // Cache the successful response
        responseCache.set(cacheKey, {
            statusCode: res.statusCode,
            body,
            timestamp: Date.now()
        });
        return originalJson(body);
    };

    next();
};

module.exports = idempotency;
