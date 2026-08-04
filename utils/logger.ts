/**
 * utils/logger.ts
 * Production-safe logging utility.
 * In development: logs normally to console.
 * In production: silences all output to avoid leaking information.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  // eslint-disable-next-line no-console
  error: isDev ? console.error.bind(console) : () => {},
  // eslint-disable-next-line no-console
  warn: isDev ? console.warn.bind(console) : () => {},
  // eslint-disable-next-line no-console
  log: isDev ? console.log.bind(console) : () => {},
};
