import cron from "node-cron";

type Task = {
  id: string;
  name: string;
  task: () => Promise<void>;
  schedule: string;
};

type TaskStatus = "scheduled" | "running" | "succeeded" | "failed";

async function sendReminder() {
  console.log("Sending reminder...");
}

async function generateReport() {
  console.log("Generating report...");
}

const taskRegistry = new Map<string, Task>([
  [
    "reminder",
    {
      id: "reminder",
      name: "Reminder",
      task: sendReminder,
      schedule: "*/5 * * * * *",
    },
  ],
  [
    "report",
    {
      id: "report",
      name: "Report",
      task: generateReport,
      schedule: "*/10 * * * * *",
    },
  ],
]);

async function executeTask(task: Task) {
  console.log(`Running task: ${task.name}`);

  try {
    await task.task();
    console.log(`Task succeeded: ${task.name}`);
  } catch (error) {
    console.error(`Task failed: ${task.name}`, error);
  }
}

function runTask(task: Task) {
  cron.schedule(task.schedule, async () => {
    await executeTask(task);
  });
}

async function dispatchTask(id: string) {
  const task = taskRegistry.get(id);

  if (!task) {
    throw new Error(`Task not found: ${id}`);
  }

  await executeTask(task);
}

function startScheduler() {
  for (const task of taskRegistry.values()) {
    runTask(task);
  }
}

startScheduler();