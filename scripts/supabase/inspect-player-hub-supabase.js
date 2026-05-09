const {
  PLAYER_HUB_READ_TABLES,
  readPlayerHubSupabaseData,
} = require("./player-hub-read-service");

async function main() {
  console.log("Make Teams Pro Supabase Player Hub inspection");
  console.log("Read-only: no app behavior changes, no writes.");
  console.log("");

  const snapshot = await readPlayerHubSupabaseData();
  const summary = [];

  for (const config of PLAYER_HUB_READ_TABLES) {
    const rows = snapshot.collections[config.collection] || [];
    summary.push({
      table: config.table,
      label: config.label,
      rows: rows.length,
    });

    console.log(`${config.label}: ${rows.length}`);
    for (const sample of rows.slice(0, 3).map(config.sample)) {
      console.log(`  - ${sample}`);
    }
  }

  console.log("");
  console.table(summary);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
