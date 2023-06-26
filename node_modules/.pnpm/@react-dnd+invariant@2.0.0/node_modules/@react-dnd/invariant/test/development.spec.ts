import invariant from '../src';

describe('development mode', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // this is important - it clears the cache
    process.env = { ...OLD_ENV };
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('works', () => {
    process.env.NODE_ENV = 'development';

    expect(function() {
      invariant(true, 'invariant message');
    }).not.toThrow();

    expect(function() {
      invariant(false, 'invariant message');
    }).toThrow(/invariant message/);

    expect(function() {
      (invariant as any)(true);
    }).toThrow(/requires an error/i);

    expect(function() {
      (invariant as any)(false);
    }).toThrow(/requires an error/i);
  });
});
