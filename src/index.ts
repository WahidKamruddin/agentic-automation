import cron from "node-cron";

type Task = {
  name: string;
  task: () => Promise<void>;
  schedule: string;
};

async function sendReminder() {
  console.log("Sending reminder...");
}

async function generateReport() {
  console.log("Generating report...");
}

function runTask(
  name: string,
  task: () => Promise<void>,
  schedule: string
) {
  cron.schedule(schedule, async () => {
    console.log(`Running task: ${name}`);

    try {
      await task();
      console.log(`Task succeeded: ${name}`);
    } catch (error) {
      console.error(`Task failed: ${name}`, error);
    }
  });
}

const tasks: Task[] = [
  {
    name: "Reminder",
    task: sendReminder,
    schedule: "*/5 * * * * *",
  },
  {
    name: "Report",
    task: generateReport,
    schedule: "*/10 * * * * *",
  },
];

function startScheduler() {
  for (const task of tasks) {
    runTask(task.name, task.task, task.schedule);
  }
}

startScheduler();