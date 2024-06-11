export const limitedParallel = async (
  tasks: (() => Promise<any>)[],
  limit: number,
): Promise<any[]> => {
  const results: Promise<any>[] = [];
  const executing: Promise<any>[] = [];

  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);

    if (limit <= tasks.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(results);
};
