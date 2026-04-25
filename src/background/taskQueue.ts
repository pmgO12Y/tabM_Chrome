export interface TaskQueue {
  enqueue<T>(task: () => Promise<T>): Promise<T>;
  waitForIdle(): Promise<void>;
}

export function createTaskQueue(onError: (error: unknown) => void): TaskQueue {
  let tail = Promise.resolve<void>(undefined);

  return {
    enqueue<T>(task: () => Promise<T>): Promise<T> {
      const run = tail.then(task);
      tail = run
        .then(() => undefined)
        .catch((error) => {
          onError(error);
        });

      return run;
    },
    waitForIdle(): Promise<void> {
      return tail;
    }
  };
}
