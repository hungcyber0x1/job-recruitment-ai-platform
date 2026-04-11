import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import applicationService from '../../../services/applicationService';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setError(null);
    if (isJobApplicationDeadlinePassed(job.deadline)) {
      setError('Đã quá hạn nộp hồ sơ cho vị trí này.');
      return;
    }
    setLoading(true);

    try {
      await applicationService.apply(job.id, {
        cover_letter: coverLetter,
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
            <h2 className="text-xl font-black text-slate-900">Ứng tuyển công việc</h2>
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
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                CV / Resume của bạn
              </label>
              <div className="border-2 border-dashed border-primary-200 bg-primary-50/50 rounded-2xl p-8 text-center hover:bg-primary-50 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-white text-primary-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
                <p className="text-slate-900 font-bold mb-1">My_CV_Official.pdf</p>
                <p className="text-base text-slate-500">
                  Nhấn để thay đổi file khác (PDF, DOC, DOCX)
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Thư giới thiệu (Cover Letter)
              </label>
              <textarea
                rows="5"
                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 font-medium text-slate-700"
                placeholder="Viết ngắn gọn về lý do tại sao bạn phù hợp với vị trí này..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                disabled={loading}
              ></textarea>
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
