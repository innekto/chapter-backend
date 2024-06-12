import async from 'async';

export const limitedParallel = async (tasks: any, limit: number) => {
  await new Promise<void>((resolve, reject) => {
    async.eachLimit(
      tasks,
      limit,
      async (task: any) => {
        await task();
      },
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
};
