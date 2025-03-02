// registered to runtime through plugin

import { IAgentRuntime, ITaskService, ServiceType, UUID } from "../types";

export class TaskService implements ITaskService {
  private timer: NodeJS.Timer | null = null;
  private readonly TICK_INTERVAL = 1000; // Check every second
  runtime: IAgentRuntime;
  serviceType: ServiceType = ServiceType.TASK;

  initialize(runtime: IAgentRuntime): Promise<void> {
    this.runtime = runtime;
    this.startTimer();
    return Promise.resolve();
  }

  private startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(async () => {
      await this.checkTasks();
    }, this.TICK_INTERVAL);
  }

  private async checkTasks() {
    try {
      // Get all tasks with "queue" tag
      const tasks = await this.runtime.databaseAdapter.getTasks({
        tags: ["queue"],
      });

      const now = Date.now();

      for (const task of tasks) {
        // Skip if no duration set
        if (!task.metadata?.duration) {
          continue;
        }

        const taskStartTime = new Date(task.metadata.updatedAt).getTime();
        const durationMs = task.metadata.updateInterval;

        console.log(
          `*** Checking task ${task.name} with duration ${durationMs}ms`
        );

        // Check if enough time has passed
        if (now - taskStartTime >= durationMs) {
          console.log(`*** Executing task ${task.name}`);
          await this.executeTask(task.id!);
        }
      }
    } catch (error) {
      console.error("Error checking tasks:", error);
    }
  }

  private async executeTask(taskId: UUID) {
    try {
      const task = await this.runtime.databaseAdapter.getTask(taskId);
      if (!task) {
        return;
      }

      const worker = this.runtime.getTaskWorker(task.name);
      if (!worker) {
        console.error(`No worker found for task type: ${task.name}`);
        return;
      }

      await worker.execute(this.runtime, task.metadata || {});

      // if the task is a repeat task, update the task
      if (task.metadata?.repeat) {
        await this.runtime.databaseAdapter.updateTask(taskId, {
          metadata: {
            ...task.metadata,
            updatedAt: Date.now(),
          },
        });
      }
      // if the task is not a repeat task, delete the task
      else {
        await this.runtime.databaseAdapter.deleteTask(taskId);
      }
    } catch (error) {
      console.error(`Error executing task ${taskId}:`, error);
    }
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
