function sendReminder() {
    console.log("Sending reminder...");
  }
  
  function runTask(task: () => void, intervalMs: number) {
    let count = 0;
  
    const interval = setInterval(() => {
      count++;
      task();
  
      if (count >= 5) {
        clearInterval(interval);
      }
    }, intervalMs);
  }
  
  const tasks = [
    {
      name: "Reminder",
      task: sendReminder,
      intervalMs: 3000,
    },
  ];
  
  function startScheduler() {
    for (const task of tasks) {
      runTask(task.task, task.intervalMs);
    }
  }

  startScheduler();