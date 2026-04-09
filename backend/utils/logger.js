const winston = require('winston');
const path = require('path');

// ─── Custom format: combines timestamp + level + message + metadata ──────────
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// ─── Console format: colorized + emoji-friendly for demos ────────────────────
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
    })
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'invoiceflow-api' },
    transports: [
        // Write all logs to file (JSON format — searchable, persistent)
        new winston.transports.File({
            filename: path.join(__dirname, '..', 'logs', 'error.log'),
            level: 'error',
            maxsize: 5 * 1024 * 1024, // 5MB max per file
            maxFiles: 3
        }),
        new winston.transports.File({
            filename: path.join(__dirname, '..', 'logs', 'combined.log'),
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5
        }),
        // Console output (colorized, emoji-friendly for demos)
        new winston.transports.Console({
            format: consoleFormat
        })
    ]
});

module.exports = logger;
