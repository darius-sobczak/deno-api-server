/**
 * simple mock function
 */
export function mockFn(implementation: Function = () => {}) {
  const mock = {
    _fn: implementation,
    clear() {
      this.returns.length = 0;
      this.calls.length = 0;
      return this;
    },
    implement(fn: Function = () => {}) {
      this._fn = fn;
      return this;
    },
    calls: [],
    returns: [],
  };

  // Add array methods to calls if they don't exist
  if (!mock.calls.at) {
    mock.calls.at = function(index: number) {
      return this[index];
    };
  }

  //@ts-ignore
  function fn(...args) {
    //@ts-ignore
    mock.calls.push(args);
    //@ts-ignore
    const result = mock._fn.apply(null, args);
    //@ts-ignore
    mock.returns.push(result);
    return result;
  }

  fn.mock = mock;

  return fn;
}
