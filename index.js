// Main entry point for the pglite-cli-server package
export { PGlite } from '@electric-sql/pglite';
export { PGLiteSocketServer } from '@electric-sql/pglite-socket';

// Version info
export const version = '1.0.0';

// CLI entry point (mainly for programmatic usage)
export async function startPGliteServer(options = {}) {
  const { PGlite } = await import('@electric-sql/pglite');
  const { PGLiteSocketServer } = await import('@electric-sql/pglite-socket');

  const config = {
    db: 'memory://',
    port: 5432,
    host: '127.0.0.1',
    debug: 0,
    ...options
  };

  // Create PGlite instance
  const db = await PGlite.create({
    dataDir: config.db,
    debug: config.debug,
    relaxedDurability: config.db.startsWith('memory://') ? true : false
  });

  await db.waitReady;

  // Create socket server
  const server = new PGLiteSocketServer({
    db,
    port: config.port,
    host: config.host,
  });

  await server.start();

  return {
    db,
    server,
    connectionString: `postgres://postgres@${config.host}:${config.port}/template1`,
    config,
    async stop() {
      await server.stop();
      await db.close();
    }
  };
}
