import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, CheckCircle, AlertTriangle, Lightbulb, Target, Loader2 } from 'lucide-react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import { resumeService } from '@/services';
import { useFeatureFlags } from '../../../context/FeatureFlagsContext';

const ResumeMatcherModal = ({ jobId, jobTitle, onClose }) => {
  const { isEnabled } = useFeatureFlags();
  const jobMatchingEnabled = isEnabled('ai_job_matching');
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!jobMatchingEnabled) {
        setError('Tính năng AI job matching hiện đang bị tắt bởi admin.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await resumeService.analyzeJobMatch(jobId);
        setAnalysis(response.data.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Không thể phân tích độ phù hợp lúc này.');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchAnalysis();
    }
  }, [jobId, jobMatchingEnabled]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-500';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <Card className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden p-0 animate-in zoom-in-95 duration-200">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white p-6">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
              <Target className="text-primary-600" /> Phân tích độ phù hợp AI
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              So sánh CV của bạn với vị trí{' '}
              <span className="font-bold text-slate-700">{jobTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-muted/55 hover:text-red-500"
          >
            <X size={24} />
          </button>
        </div>

        <div className="custom-scrollbar flex-grow overflow-y-auto p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={48} className="mb-4 animate-spin text-primary-600" />
              <p className="font-medium text-slate-500">
                Đang phân tích CV của bạn với công việc...
              </p>
              <p className="mt-2 text-sm text-slate-400">Việc này có thể mất vài giây</p>
            </div>
          ) : error ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900">Đã có lỗi xảy ra</h3>
              <p className="mb-6 text-slate-500">{error}</p>
              <Button onClick={onClose} variant="ghost">
                Đóng
              </Button>
            </div>
          ) : analysis ? (
            <div className="space-y-8 p-8">
              <div
                className={`relative overflow-hidden rounded-3xl p-8 text-center ${getScoreBg(analysis.match_score)}`}
              >
                <div className="relative z-10">
                  <div className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                    Do phu hop tong the
                  </div>
                  <div
                    className={`mb-2 text-6xl font-black ${getScoreColor(analysis.match_score)}`}
                  >
                    {analysis.match_score}%
                  </div>
                  <p className="mx-auto max-w-lg font-medium leading-relaxed text-slate-700">
                    {analysis.reasoning}
                  </p>
                </div>
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/30 blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/30 blur-2xl"></div>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="rounded-2xl border border-green-100 bg-green-50/50 p-6">
                  <h4 className="mb-4 flex items-center gap-2 font-bold text-green-700">
                    <CheckCircle size={20} /> Kỹ năng phù hợp
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.matching_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg border border-green-100 bg-white px-3 py-1.5 text-sm font-bold text-green-700 shadow-sm"
                      >
                        {skill}
                      </span>
                    ))}
                    {analysis.matching_skills.length === 0 && (
                      <span className="text-sm italic text-slate-400">
                        Chưa tìm thấy kỹ năng phù hợp
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6">
                  <h4 className="mb-4 flex items-center gap-2 font-bold text-red-700">
                    <AlertTriangle size={20} /> Kỹ năng còn thiếu
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missing_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg border border-red-100 bg-white px-3 py-1.5 text-sm font-bold text-red-700 shadow-sm opacity-80"
                      >
                        {skill}
                      </span>
                    ))}
                    {analysis.missing_skills.length === 0 && (
                      <span className="text-sm font-medium italic text-green-600">
                        Bạn đã có đủ các kỹ năng yêu cầu!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <h4 className="mb-4 font-bold text-slate-900">Điểm mạnh nổi bật</h4>
                  <ul className="space-y-3">
                    {analysis.strengths.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600"
                      >
                        <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                    <Lightbulb size={18} className="text-amber-500" /> Gợi ý cải thiện
                  </h4>
                  <ul className="space-y-3">
                    {analysis.gaps?.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-sm text-slate-600"
                      >
                        <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
};

ResumeMatcherModal.propTypes = {
  jobId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  jobTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ResumeMatcherModal;
