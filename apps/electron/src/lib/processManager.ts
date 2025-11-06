// src/main/utils/processManager.ts
import { ChildProcess, spawn } from "child_process";
import { Logger } from "../utils/logger";

/**
 * Manages spawned background processes for cleanup and control.
 */
export class ProcessManager {
  // Use a Map to store processes, allowing them to be referenced by a unique name (string).
  private processes: Map<string, ChildProcess> = new Map();
  // Store registered process execution functions, also referenced by a unique name.
  private registeredProcesses: Map<string, () => Promise<void>> = new Map();

  /**
   * Spawns a background process and keeps reference for cleanup.
   * Now takes a name for the process.
   */
  spawn(
    name: string,
    command: string,
    args: string[] = [],
    options: Record<string, any> = {}
  ) {
    const proc = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    this.processes.set(name, proc);
    Logger.log(`Spawned process: ${name} - ${command} ${args.join(" ")}`);

    proc.on("exit", (code) => {
      Logger.log(`Process exited (${name}) with code ${code}`);
      this.processes.delete(name);
    });

    return proc;
  }

  /**
   * Kills a specific process by its registered name.
   */
  kill(name: string) {
    const proc = this.processes.get(name);
    if (!proc || !proc.pid) {
      Logger.warn(
        `⚠️ Attempted to kill an invalid or unknown process: ${name}.`
      );
      return;
    }

    try {
      process.kill(proc.pid, "SIGTERM");
      Logger.log(`✅ Killed process PID ${proc.pid} (${name})`);
      this.processes.delete(name);
    } catch (err) {
      Logger.warn(
        `⚠️ Failed to kill PID ${proc.pid} (${name}): ${(err as Error).message}`
      );
    }
  }

  /**
   * Kills all tracked processes.
   */
  killAll() {
    for (const [name, proc] of this.processes) {
      if (proc.pid) {
        try {
          process.kill(proc.pid, "SIGTERM");
          Logger.log(`✅ Killed process PID ${proc.pid} (${name})`);
        } catch (err) {
          Logger.warn(
            `⚠️ Failed to kill PID ${proc.pid} (${name}): ${(err as Error).message}`
          );
        }
      }
    }
    this.processes.clear();
  }

  /**
   * Registers a function to be executed as a named process.
   */
  register(name: string, func: () => Promise<void>) {
    this.registeredProcesses.set(name, func);
    Logger.log(`Registered process: ${name}`);
  }

  /**
   * Starts a registered process by name.
   */
  async start(name: string) {
    const func = this.registeredProcesses.get(name);
    if (func) {
      Logger.log(`Starting registered process: ${name}`);
      try {
        await func();
        Logger.log(`Registered process completed: ${name}`);
      } catch (error) {
        Logger.error(
          `Registered process failed: ${name} - ${(error as Error).message}`
        );
      }
    } else {
      Logger.warn(`⚠️ Attempted to start an unregistered process: ${name}.`);
    }
  }
}

export const processManager = new ProcessManager();
