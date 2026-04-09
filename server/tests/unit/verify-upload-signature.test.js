const { detectFileKind, FIELD_RULES } = require('../../src/middlewares/verify-upload-signature');

describe('verify-upload-signature', () => {
  test('detectFileKind recognizes common formats', () => {
    expect(detectFileKind(Buffer.from([0x25, 0x50, 0x44, 0x46]))).toBe('pdf');
    expect(detectFileKind(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg');
    expect(detectFileKind(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      'png'
    );
    expect(detectFileKind(Buffer.from('GIF89a', 'ascii'))).toBe('gif');
    const webp = Buffer.alloc(12);
    webp.write('RIFF', 0, 'ascii');
    webp.write('WEBP', 8, 'ascii');
    expect(detectFileKind(webp)).toBe('webp');
    expect(detectFileKind(Buffer.from([0x50, 0x4b, 0x03, 0x04]))).toBe('zip');
    expect(detectFileKind(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]))).toBe('ole');
  });

  test('detectFileKind returns null for empty or unknown', () => {
    expect(detectFileKind(Buffer.alloc(0))).toBeNull();
    expect(detectFileKind(Buffer.from([0, 1, 2, 3]))).toBeNull();
  });

  test('FIELD_RULES cover upload fieldnames', () => {
    expect(FIELD_RULES.resume).toContain('pdf');
    expect(FIELD_RULES.avatar).toContain('png');
    expect(FIELD_RULES.file).toEqual(FIELD_RULES.resume);
  });
});
