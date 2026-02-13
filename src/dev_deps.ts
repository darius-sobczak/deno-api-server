export * from '@std/assert';
import { assertEquals } from '@std/assert';

/**
 * check if function called n times
 */
export function assertCalledCount(
  mockedFn: { mock: { calls: { length: number } } },
  count: number,
) {
  assertEquals(mockedFn.mock.calls.length, count);
}

/**
 * check if called with arguments
 */
export function assertCalledWith(
  mockedFn: { mock: { calls: { at: (index: number) => unknown[] } } },
  calledAt: number,
  params: unknown[],
) {
  const args = mockedFn.mock.calls.at(calledAt);
  assertEquals(Array.isArray(args), true, `Method not called on index ${calledAt}`);
  assertEquals(args, params);
}

/**
 * check if called with value in argument
 */
export function assertCalledWithAt(
  mockedFn: { mock: { calls: { at: (index: number) => unknown[] } } },
  calledAt: number,
  paramIndex: number,
  value: unknown,
) {
  const args = mockedFn.mock.calls.at(calledAt);
  assertEquals(Array.isArray(args), true, `Method not called on index ${calledAt}`);
  assertEquals(args?.at(paramIndex), value);
}
