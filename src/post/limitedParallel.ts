import Promise from 'bluebird';

export const limitedParallel = async (tasks: any, limit: number) => {
  return await Promise.map(tasks, (task: any) => task(), {
    concurrency: limit,
  });
};
