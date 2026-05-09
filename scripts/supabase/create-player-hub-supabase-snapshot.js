const path = require("path");

const {
  PLAYER_HUB_READ_TABLES,
  PROJECT_ROOT,
  playerHubSnapshotPath,
  readPlayerHubSupabaseData,
  writePlayerHubSupabaseSnapshot,
} = require("./player-hub-read-service");

async function main() {
  console.log("Make Teams Pro Supabase Player Hub snapshot");
  console.log("Read-only: no app behavior changes, no writes.");
  console.log("");

  const snapshot = await readPlayerHubSupabaseData();
  const outputPath = writePlayerHubSupabaseSnapshot(snapshot);

  for (const config of PLAYER_HUB_READ_TABLES) {
    const count = snapshot.counts[config.collection] || 0;
    console.log(`${config.label}: ${count}`);
  }

  console.log("");
  console.log(`Snapshot written: ${path.relative(PROJECT_ROOT, outputPath)}`);
  console.log(`Absolute path: ${playerHubSnapshotPath()}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
