const {
  DEFAULT_ALLOWED_ORIGINS,
  expandLoopbackOrigin,
  getAllowedOrigins,
} = require('../../src/utils/allowedOrigins');

describe('allowedOrigins', () => {
  const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;

  afterEach(() => {
    if (originalAllowedOrigins === undefined) {
      delete process.env.ALLOWED_ORIGINS;
    } else {
      process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
    }
  });

  it('includes localhost and 127.0.0.1 defaults for development', () => {
    delete process.env.ALLOWED_ORIGINS;

    const origins = getAllowedOrigins();

    expect(origins).toEqual(expect.arrayContaining(DEFAULT_ALLOWED_ORIGINS));
  });

  it('expands localhost origins to their 127.0.0.1 equivalent', () => {
    expect(expandLoopbackOrigin('http://localhost:3000')).toEqual(
      expect.arrayContaining(['http://localhost:3000', 'http://127.0.0.1:3000'])
    );
  });

  it('expands configured origins so 127.0.0.1 login works when localhost is configured', () => {
    process.env.ALLOWED_ORIGINS = 'http://localhost:3000';

    const origins = getAllowedOrigins();

    expect(origins).toEqual(
      expect.arrayContaining(['http://localhost:3000', 'http://127.0.0.1:3000'])
    );
  });
});
