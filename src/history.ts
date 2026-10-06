import { taskRunRepository } from "./taskRunRepository.js";

const runs = await taskRunRepository.findAll();

console.log("\nTASK RUN HISTORY\n");

if (runs.length === 0) {
  console.log("No task runs found.");
  process.exit(0);
}

for (const run of runs) {
  const status =
    run.status === "succeeded"
      ? "✓"
      : run.status === "failed"
        ? "✗"
        : "•";

  const duration = run.durationMs !== undefined
    ? `${run.durationMs}ms`
    : "-";

  console.log(
    `${status} ${run.taskId.padEnd(10)} ${run.status.padEnd(10)} ${duration.padEnd(8)} ${run.startedAt.toLocaleString()}`
  );

  if (run.error) {
    console.log(`  Error: ${run.error}`);
  }
}