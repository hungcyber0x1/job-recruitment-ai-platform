const { envBaseUrl, optionalEnvUrl } = require('../../src/utils/envBaseUrl');

describe('envBaseUrl', () => {
  const key = 'TEST_ENV_BASE_URL';
  let previous;

  beforeEach(() => {
    previous = process.env[key];
  });

  afterEach(() => {
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  });

  it('uses fallback when unset', () => {
    delete process.env[key];
    expect(envBaseUrl(key, 'https://default/')).toBe('https://default');
  });

  it('trims whitespace and strips trailing slashes', () => {
    process.env[key] = '  https://api.example.com/v1/  ';
    expect(envBaseUrl(key, '')).toBe('https://api.example.com/v1');
  });
});

describe('optionalEnvUrl', () => {
  const key = 'TEST_OPTIONAL_URL';
  let previous;

  beforeEach(() => {
    previous = process.env[key];
  });

  afterEach(() => {
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  });

  it('returns undefined when unset or blank', () => {
    delete process.env[key];
    expect(optionalEnvUrl(key)).toBeUndefined();
    process.env[key] = '   ';
    expect(optionalEnvUrl(key)).toBeUndefined();
  });

  it('returns normalized URL when set', () => {
    process.env[key] = 'https://x.com/';
    expect(optionalEnvUrl(key)).toBe('https://x.com');
  });
});
