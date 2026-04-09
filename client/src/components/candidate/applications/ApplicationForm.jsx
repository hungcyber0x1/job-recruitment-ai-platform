import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Info, CheckCircle, FileText } from 'lucide-react';
import Button from '../../common/Button';
import { useNotification } from '../../../context/NotificationContext';
import api from '../../../services/api';
import uploadService from '../../../services/uploadService';
import { isJobApplicationDeadlinePassed } from '../../../utils/jobDeadline';

const ApplicationForm = ({ job, onClose }) => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cover_letter: '',
    resume_url: '',
  });
  const [resumeFile, setResumeFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isJobApplicationDeadlinePassed(job.deadline)) {
      showNotification('Đã quá hạn nộp hồ sơ cho vị trí này.', 'error');
      return;
    }
    setLoading(true);
    try {
      let finalResumeUrl = formData.resume_url;

      if (resumeFile) {
        const uploadRes = await uploadService.uploadResume(resumeFile);
        finalResumeUrl =
          uploadRes.data?.data?.resume_url || uploadRes.data?.resume_url || finalResumeUrl;
      }

      await api.post(`/applications/${job.id}`, {
        ...formData,
        resume_url: finalResumeUrl,
      });
      showNotification('Nộp đơn thành công! Nhà tuyển dụng sẽ xem xét hồ sơ của bạn.', 'success');
      onClose();
    } catch (error) {
      console.error(error);
      showNotification(error.response?.data?.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-emerald-50 p-6 rounded-2xl flex items-start gap-4 border border-emerald-100/50">
        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
          <BriefcaseIcon size={24} />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 leading-tight mb-1">{job.title}</h4>
          <p className="text-sm text-gray-500 font-medium">{job.company_name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-sm font-bold text-gray-700 ml-1 mb-2 block">
            Thư từ ứng viên (Cover Letter)
          </label>
          <textarea
            className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:ring-2 focus:ring-emerald-500/20 outline-none min-h-[120px] text-sm text-gray-700"
            placeholder="Giới thiệu ngắn gọn lý do tại sao bạn phù hợp với vị trí này..."
            value={formData.cover_letter}
            onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
            required
          ></textarea>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 ml-1 mb-2 block">
            Tải lên CV (PDF/Word)
          </label>
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-emerald-400 hover:bg-primary/10 transition-all cursor-pointer group relative">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-100 transition-colors">
              {resumeFile ? (
                <CheckCircle className="text-green-500" size={28} />
              ) : (
                <FileText className="text-gray-400 group-hover:text-emerald-600" size={28} />
              )}
            </div>
            <p className="text-sm font-bold text-gray-900 mb-1">
              {resumeFile ? resumeFile.name : 'Kéo thả file vào đây hoặc click để chọn'}
            </p>
            <p className="text-xs text-gray-400">Định dạng hỗ trợ: PDF, DOC, DOCX (Tối đa 5MB)</p>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 rounded-xl flex items-center gap-3 border border-yellow-100/50">
          <Info size={18} className="text-yellow-600 shrink-0" />
          <p className="text-[11px] text-yellow-700 font-medium">
            HireAI khuyến nghị bạn nên cập nhật đầy đủ các dự án trong hồ sơ cá nhân để tăng 50% tỉ
            lệ matching.
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="ghost" type="button" className="flex-1" onClick={onClose}>
            Bỏ qua
          </Button>
          <Button
            variant="primary"
            type="submit"
            className="flex-1 py-4 text-lg shadow-indigo-200"
            disabled={loading}
          >
            {loading ? 'Đang gửi...' : 'Nộp hồ sơ ngay'}
          </Button>
        </div>
      </form>
    </div>
  );
};

const BriefcaseIcon = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

ApplicationForm.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    title: PropTypes.string,
    company_name: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

BriefcaseIcon.propTypes = {
  size: PropTypes.number,
};

export default ApplicationForm;
