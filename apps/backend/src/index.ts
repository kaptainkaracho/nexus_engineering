import fastify from 'fastify';

const server = fastify({ logger: true });

server.get('/health', async () => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await server.listen({ port: 3001 });
    server.log.info('Nexus Engineering backend running on http://localhost:3001');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
