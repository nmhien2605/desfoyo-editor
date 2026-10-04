import { expect, it } from 'vitest';
import { loadsSettled, onLoadSettled, trackLoad } from '../pendingLoads';

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

it('onLoadSettled fires when a tracked load settles, until unsubscribed', async () => {
  let calls = 0;
  const off = onLoadSettled(() => calls++);
  trackLoad(Promise.resolve());
  await loadsSettled();
  expect(calls).toBe(1);
  off();
  trackLoad(Promise.resolve());
  await loadsSettled();
  expect(calls).toBe(1);
});
