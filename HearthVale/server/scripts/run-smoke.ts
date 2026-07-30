async function main(): Promise<void> {
  console.log('--- auth-smoke ---');
  await import('./auth-smoke.js');
  console.log('\n--- world-room-smoke ---');
  await import('./world-room-smoke.js');
  console.log('\n--- character-persistence-smoke ---');
  await import('./character-persistence-smoke.js');
  console.log('\nAll server smoke tests passed.');
}

await main();
