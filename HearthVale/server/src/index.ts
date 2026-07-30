import { createHearthValeServer } from './createServer.js';

const PORT = Number(process.env.PORT ?? 2567);

async function main(): Promise<void> {
  const { gameServer } = createHearthValeServer();
  await gameServer.listen(PORT);
  console.log(`HearthVale multiplayer server listening on ws://localhost:${PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
