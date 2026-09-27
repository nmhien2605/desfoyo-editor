import { expect, it } from 'vitest';
import { loadsSettled, trackLoad } from '../pendingLoads';

it('loadsSettled waits for loads tracked while it is already waiting', async () => {
  const done: string[] = [];
  let resolveFirst!: () => void;
  trackLoad(
    new Promise<void>((r) => (resolveFirst = r)).then(() => {
      done.push('first');
      trackLoad(Promise.resolve().then(() => done.push('second')));
    }),
  );
  trackLoad(Promise.reject(new Error('broken asset')));
  const waiting = loadsSettled();
  resolveFirst();
  await waiting;
  expect(done).toEqual(['first', 'second']);
});
