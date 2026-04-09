const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const {
  detectFileKind,
  FIELD_RULES,
  verifyUploadSignature,
} = require('../../src/middlewares/verify-upload-signature');

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

  test('detectFileKind accepts PDF after UTF-8 BOM or whitespace', () => {
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    expect(detectFileKind(Buffer.concat([bom, Buffer.from('%PDF-1.7\n')]))).toBe('pdf');
    expect(detectFileKind(Buffer.from(' \n\t%PDF-1.4', 'ascii'))).toBe('pdf');
  });

  test('detectFileKind accepts PDF when marker is within first 1024 bytes (linearized / preamble)', () => {
    const preamble = Buffer.alloc(80, 0x20);
    preamble.write('%PDF-1.4', 40, 'ascii');
    expect(detectFileKind(preamble)).toBe('pdf');
  });

  test('FIELD_RULES cover upload fieldnames', () => {
    expect(FIELD_RULES.resume).toContain('pdf');
    expect(FIELD_RULES.avatar).toContain('png');
    expect(FIELD_RULES.file).toEqual(FIELD_RULES.resume);
  });

  describe('verifyUploadSignature (đọc file thật trên đĩa)', () => {
    let tmpDir;

    beforeEach(async () => {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hireai-vus-'));
    });

    afterEach(async () => {
      if (tmpDir) {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      }
    });

    test('chấp nhận PDF có BOM UTF-8 (giống export từ một số editor)', async () => {
      const filePath = path.join(tmpDir, 'cv.pdf');
      const body = Buffer.concat([
        Buffer.from([0xef, 0xbb, 0xbf]),
        Buffer.from('%PDF-1.7\n1 0 obj<<>>endobj\n'),
      ]);
      await fs.writeFile(filePath, body);
      const req = { file: { path: filePath, fieldname: 'resume' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();
      await verifyUploadSignature(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      await expect(fs.access(filePath)).resolves.not.toThrow();
    });

    test('chấp nhận PDF có %PDF sau preamble (linearized)', async () => {
      const filePath = path.join(tmpDir, 'linear.pdf');
      const preamble = Buffer.alloc(100, 0x20);
      preamble.write('%PDF-1.4', 50, 'ascii');
      await fs.writeFile(filePath, preamble);
      const req = { file: { path: filePath, fieldname: 'resume' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();
      await verifyUploadSignature(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('từ chối JPEG giả danh PDF và xóa file tạm', async () => {
      const filePath = path.join(tmpDir, 'fake.pdf');
      await fs.writeFile(filePath, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]));
      const req = { file: { path: filePath, fieldname: 'resume' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();
      await verifyUploadSignature(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Nội dung file không khớp định dạng cho phép',
        })
      );
      await expect(fs.access(filePath)).rejects.toThrow();
    });
  });
});
