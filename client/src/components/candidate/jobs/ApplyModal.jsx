import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, FileText, CheckCircle2, Loader2, Upload, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import Card from '../../common/Card';
import Button from '../../common/Button';
import applicationService from '../../../services/applicationService';
import uploadService from '../../../services/uploadService';
import candidateService from '../../../services/candidateService';
import { isJobApplicationDeadlinePassed } from '../../../utils/jobDeadline';

/**
 * Modal for job application submission
 * @param {Object} props - Component props
 * @param {Object} props.job - Job data
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSuccess - Success handler after application
 */
const ApplyModal = ({ job, onClose, onSuccess }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [coverLetterError, setCoverLetterError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentResume, setCurrentResume] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    candidateService.getProfile().then((res) => {
      const profile = res.data?.data || res.data;
      if (profile?.resume_url) {
        setCurrentResume({
          url: profile.resume_url,
          name: profile.resume_name || profile.resume_url.split('/').pop() || 'CV_hiện_tại.pdf',
        });
      }
    }).catch(() => {});
  }, []);

  const effectiveResume = selectedFile ? selectedFile : currentResume;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Chỉ chấp nhận file PDF, DOC, DOCX');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Dung lượng file tối đa là 10MB');
      return;
    }

    setUploadError(null);
    setUploadProgress(true);
    try {
      const res = await uploadService.uploadResume(file);
      const uploadedUrl = res.data?.data?.resume_url || res.data?.resume_url;
      if (uploadedUrl) {
        setSelectedFile({
          url: uploadedUrl,
          name: file.name,
          isNew: true,
        });
        setCurrentResume(null);
      } else {
        setUploadError('Upload thất bại, vui lòng thử lại');
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload thất bại');
    } finally {
      setUploadProgress(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveSelected = () => {
    setSelectedFile(null);
    setUploadError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setCoverLetterError('');
    if (isJobApplicationDeadlinePassed(job.deadline)) {
      setError('Đã quá hạn nộp hồ sơ cho vị trí này.');
      return;
    }
    if (coverLetter.trim().length > 0 && coverLetter.trim().length < 50) {
      setCoverLetterError('Thư giới thiệu phải có ít nhất 50 ký tự (nếu viết).');
      return;
    }
    setLoading(true);

    try {
      await applicationService.apply(job.id, {
        cover_letter: coverLetter,
        resume_url: effectiveResume?.url || null,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Có lỗi xảy ra khi nộp hồ sơ';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>

      <Card className="w-full max-w-2xl relative z-10 animate-in zoom-in-95 duration-200 p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Ứng tuyển công việc</h2>
            <p className="text-slate-500 font-medium mt-1">
              {job.title} tại {job.company_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted/60 rounded-full transition-colors text-slate-400 hover:text-red-500"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* CV Section */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                CV / Resume <span className="text-red-500">*</span>
              </label>

              {/* Existing CV Display */}
              {effectiveResume && !uploadProgress && (
                <div className="mb-3 flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex-shrink-0">
                    <FileText size={20} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-emerald-800 truncate">
                      {effectiveResume.name || 'CV_hiện_tại.pdf'}
                    </p>
                    <p className="text-xs text-emerald-600">
                      {effectiveResume.isNew ? 'Mới tải lên' : 'CV hiện tại trên hồ sơ'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {effectiveResume.url && (
                      <a
                        href={effectiveResume.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Xem CV"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveSelected}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 transition-colors"
                      title="Bỏ chọn CV này"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Upload New CV */}
              {effectiveResume ? (
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                  <Upload size={14} />
                  <span>Tải CV khác (thay thế)</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <label
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                    'border-primary-200 bg-primary-50/50 hover:bg-primary-50',
                    uploadProgress && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="w-12 h-12 bg-white text-primary-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    {uploadProgress ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <Upload size={24} />
                    )}
                  </div>
                  <p className="text-slate-900 font-bold mb-1">
                    {uploadProgress ? 'Đang tải lên...' : 'Kéo thả file hoặc nhấn để chọn'}
                  </p>
                  <p className="text-sm text-slate-500">
                    PDF, DOC, DOCX — tối đa 10MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploadProgress}
                  />
                </label>
              )}

              {/* No CV Warning */}
              {!effectiveResume && !uploadProgress && (
                <div className="mt-2 flex items-start gap-2 text-amber-600 text-sm">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>Bạn chưa có CV. Vẫn có thể nộp đơn, nhưng nhà tuyển dụng sẽ không nhận được CV kèm theo.</span>
                </div>
              )}

              {/* Upload Error */}
              {uploadError && (
                <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle size={14} />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            {/* Cover Letter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-slate-700">
                  Thư giới thiệu (Cover Letter)
                </label>
                {coverLetter.length > 0 && (
                  <span className={cn(
                    "text-xs font-semibold",
                    coverLetter.trim().length < 50 ? "text-amber-500" : "text-slate-400"
                  )}>
                    {coverLetter.trim().length < 50
                      ? `Còn ${50 - coverLetter.trim().length} ký tự để đạt tối thiểu`
                      : `${coverLetter.trim().length} ký tự`}
                  </span>
                )}
              </div>
              <textarea
                rows="5"
                maxLength={2000}
                className={cn(
                  "w-full p-4 rounded-xl bg-slate-50 border outline-none focus:ring-2 font-medium text-slate-700 resize-none",
                  coverLetterError ? "border-red-400 focus:ring-red-300" : "border-slate-200 focus:ring-primary-500"
                )}
                placeholder="Viết ngắn gọn về lý do tại sao bạn phù hợp với vị trí này..."
                value={coverLetter}
                onChange={(e) => {
                  setCoverLetter(e.target.value);
                  if (coverLetterError) setCoverLetterError('');
                }}
                disabled={loading}
              />
              {coverLetterError && (
                <p className="mt-1 text-sm text-red-500 font-medium">{coverLetterError}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 flex items-center gap-2 shadow-xl shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Đang gửi...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} /> Gửi hồ sơ ứng tuyển
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

ApplyModal.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    company_name: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default ApplyModal;
