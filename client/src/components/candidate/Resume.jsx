import PropTypes from 'prop-types';
import React from 'react';
import { Download, FileText, Sparkles, Trash2, Upload } from 'lucide-react';

import Button from '../common/Button';
import Card from '../common/Card';

const formatFileSize = (sizeInBytes) => {
  if (!sizeInBytes) return 'Không rõ kích thước';
  const sizeInMb = sizeInBytes / 1024 / 1024;
  return `${sizeInMb.toFixed(1)} MB`;
};

const Resume = ({ resume, isUploading, onUpload, onDelete }) => {
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
    event.target.value = '';
  };

  return (
    <div className="space-y-8">
      <Card className="relative overflow-hidden border-2 border-dashed border-primary/20 bg-primary/5 p-10 text-center shadow-card">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-white shadow-card">
          <Upload size={30} className="text-secondary" />
        </div>
        <h3 className="mb-2 text-xl font-black text-foreground">
          {isUploading ? 'Đang tải lên CV...' : 'Tải lên CV mới'}
        </h3>
        <p className="mx-auto max-w-xl text-sm font-medium text-txt-muted">
          Hỗ trợ PDF, DOC, DOCX. Hồ sơ mới sẽ được dùng cho các lần ứng tuyển tiếp theo.
        </p>
      </Card>

      {resume ? (
        <Card className="p-8 shadow-card">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-secondary/10 text-secondary">
                <FileText size={28} />
              </div>
              <div>
                <h4 className="text-lg font-black text-foreground">
                  {resume.name || 'CV hiện tại'}
                </h4>
                <p className="text-sm font-medium text-txt-muted">
                  Cập nhật: {resume.updatedAt || 'Đang lưu'}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-txt-light">
                  {formatFileSize(resume.size)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {resume.url && (
                <Button
                  variant="outline"
                  href={resume.url}
                  className="rounded-2xl"
                  leftIcon={Download}
                >
                  Tải xuống
                </Button>
              )}
              <Button
                type="button"
                variant="danger"
                className="rounded-2xl"
                leftIcon={Trash2}
                onClick={onDelete}
              >
                Xóa CV
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-10 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-txt-muted">
            <FileText size={24} />
          </div>
          <h4 className="mb-2 text-lg font-black text-foreground">Chưa có CV nào được lưu</h4>
          <p className="text-sm font-medium text-txt-muted">
            Tải lên CV để sử dụng nhanh khi ứng tuyển và phân tích hồ sơ với AI.
          </p>
        </Card>
      )}

      <Card className="relative overflow-hidden border-none bg-primary p-8 text-white shadow-premium">
        <Sparkles className="absolute -bottom-6 -right-6 opacity-10" size={120} />
        <div className="relative z-10">
          <div className="mb-3 w-fit rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            AI Resume
          </div>
          <h4 className="mb-2 text-xl font-black">Tối ưu CV với AI</h4>
          <p className="max-w-2xl text-sm font-medium text-white/80">
            Sau khi cập nhật CV, bạn có thể dùng các tính năng phân tích hồ sơ, gợi ý cải thiện và
            ghép việc làm.
          </p>
        </div>
      </Card>
    </div>
  );
};

Resume.propTypes = {
  resume: PropTypes.shape({
    name: PropTypes.string,
    url: PropTypes.string,
    updatedAt: PropTypes.string,
    size: PropTypes.number,
  }),
  isUploading: PropTypes.bool,
  onUpload: PropTypes.func,
  onDelete: PropTypes.func,
};

Resume.defaultProps = {
  resume: null,
  isUploading: false,
  onUpload: undefined,
  onDelete: undefined,
};

export default Resume;
