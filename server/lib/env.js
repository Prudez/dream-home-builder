// Fails fast on boot rather than lazily failing on the first request that
// happens to touch a missing var — mirrors scripts/migrate.js's existing
// DATABASE_URL check, extended to cover everything index.js depends on.
export function validateEnv() {
  const missing = [];
  if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');

  if (missing.length > 0) {
    console.error(
      `Missing required environment variable(s): ${missing.join(', ')}. Add them to server/.env before starting the server.`
    );
    process.exit(1);
  }

  if (!process.env.ALLOWED_ORIGINS) {
    console.log('ALLOWED_ORIGINS not set — using the built-in default origin list (see server/index.js).');
  }
}
