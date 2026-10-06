import cron from "node-cron";
import {
  taskRunRepository,
  type TaskRun,
} from "./taskRunRepository.js";

type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
};

type Task = {
  id: string;
  name: string;
  task: () => Promise<void>;
  schedule: string;
  retryPolicy: RetryPolicy;
};

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
      retryPolicy: {
        maxAttempts: 3,
        baseDelayMs: 1000,
      },
    },
  ],
  [
    "report",
    {
      id: "report",
      name: "Report",
      task: generateReport,
      schedule: "*/10 * * * * *",
      retryPolicy: {
        maxAttempts: 3,
        baseDelayMs: 1000,
      },
    },
  ],
]);

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function executeWithRetry(task: Task, runId: string) {
  const { maxAttempts, baseDelayMs } = task.retryPolicy;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log({
        event: "task.attempt",
        runId,
        taskId: task.id,
        attempt,
        maxAttempts,
      });

      await task.task();

      return;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      console.error({
        event: "task.attempt.failed",
        runId,
        taskId: task.id,
        attempt,
        maxAttempts,
        error: message,
      });

      if (attempt === maxAttempts) {
        throw error;
      }

      const delayMs = baseDelayMs * 2 ** (attempt - 1);

      console.log({
        event: "task.retrying",
        runId,
        taskId: task.id,
        attempt,
        nextAttempt: attempt + 1,
        delayMs,
      });

      await sleep(delayMs);
    }
  }
}

async function executeTask(task: Task) {
  const run: TaskRun = {
    id: crypto.randomUUID(),
    taskId: task.id,
    status: "running",
    startedAt: new Date(),
  };

  await taskRunRepository.create(run);

  console.log({
    event: "task.started",
    runId: run.id,
    taskId: task.id,
  });

  try {
    await executeWithRetry(task, run.id);

    run.status = "succeeded";
    run.finishedAt = new Date();
    run.durationMs =
      run.finishedAt.getTime() - run.startedAt.getTime();

    await taskRunRepository.update(run);

    console.log({
      event: "task.succeeded",
      runId: run.id,
      taskId: task.id,
      durationMs: run.durationMs,
    });
  } catch (error) {
    run.status = "failed";
    run.finishedAt = new Date();
    run.durationMs =
      run.finishedAt.getTime() - run.startedAt.getTime();

    run.error =
      error instanceof Error ? error.message : String(error);

    await taskRunRepository.update(run);

    console.error({
      event: "task.failed",
      runId: run.id,
      taskId: task.id,
      error: run.error,
    });
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