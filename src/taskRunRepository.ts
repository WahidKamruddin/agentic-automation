import db from "./database.js";

export type TaskStatus =
  | "scheduled"
  | "running"
  | "succeeded"
  | "failed";

  export type TaskRun = {
    id: string;
    taskId: string;
    status: TaskStatus;
    startedAt: Date;
    finishedAt?: Date | undefined;
    durationMs?: number | undefined;
    error?: string | undefined;
  };

export type TaskRunRepository = {
  create(run: TaskRun): Promise<void>;
  update(run: TaskRun): Promise<void>;
  findById(id: string): Promise<TaskRun | undefined>;
  findAll(): Promise<TaskRun[]>;
};

function mapRow(row: any): TaskRun {
  return {
    id: row.id,
    taskId: row.task_id,
    status: row.status,
    startedAt: new Date(row.started_at),
    finishedAt: row.finished_at
      ? new Date(row.finished_at)
      : undefined,
    durationMs: row.duration_ms ?? undefined,
    error: row.error ?? undefined,
  };
}

export const taskRunRepository: TaskRunRepository = {
  async create(run) {
    db.prepare(`
      INSERT INTO task_runs (
        id,
        task_id,
        status,
        started_at
      )
      VALUES (?, ?, ?, ?)
    `).run(
      run.id,
      run.taskId,
      run.status,
      run.startedAt.toISOString()
    );
  },

  async update(run) {
    db.prepare(`
      UPDATE task_runs
      SET
        status = ?,
        finished_at = ?,
        duration_ms = ?,
        error = ?
      WHERE id = ?
    `).run(
      run.status,
      run.finishedAt?.toISOString() ?? null,
      run.durationMs ?? null,
      run.error ?? null,
      run.id
    );
  },

  async findById(id) {
    const row = db
      .prepare(`
        SELECT *
        FROM task_runs
        WHERE id = ?
      `)
      .get(id);

    if (!row) {
      return undefined;
    }

    return mapRow(row);
  },

  async findAll() {
    const rows = db
      .prepare(`
        SELECT *
        FROM task_runs
        ORDER BY started_at DESC
      `)
      .all();

    return rows.map(mapRow);
  },
};