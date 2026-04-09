import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  JobDetailHeader,
  JobCompanySidebar,
  JobDescription,
  AIAnalysisCard,
} from '../../components/candidate/jobs/JobDetailComponents';
import ApplyModal from '../../components/candidate/jobs/ApplyModal';
import ResumeMatcherModal from '../../components/candidate/jobs/ResumeMatcherModal';
import { useNotification } from '../../context/NotificationContext';
import { Sparkles, X, Brain } from 'lucide-react';
import { Loading, Button, Card, ScrollReveal } from '../../components/common';

import jobService from '../../services/jobService';
import { isJobApplicationDeadlinePassed } from '../../utils/jobDeadline';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  const fetchJobDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await jobService.getJob(id);
      if (response.data.success) {
        setJob(response.data.data);
      } else {
        setError('Không tìm thấy thông tin công việc');
      }
    } catch (err) {
      console.error('Fetch job error:', err);
      setError('Đã có lỗi xảy ra khi tải thông tin công việc');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJobDetail();
  }, [fetchJobDetail]);

  const handleApplySuccess = () => {
    showNotification('Ứng tuyển thành công! Nhà tuyển dụng sẽ sớm liên hệ.', 'success');
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Đang tải thông tin công việc..." />
      </div>
    );

  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
          <X size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          {error || 'Không tìm thấy thông tin công việc'}
        </h3>
        <Button onClick={() => navigate('/jobs')}>Quay lại danh sách</Button>
      </div>
    );
  }

  const applyBlocked = job.status !== 'published' || isJobApplicationDeadlinePassed(job.deadline);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <JobDetailHeader
            job={job}
            onApply={() => setShowApplyModal(true)}
            customAction={
              <Button
                variant="glow"
                onClick={() => setShowMatchModal(true)}
                className="rounded-xl font-bold py-2 px-6"
                icon={<Sparkles size={18} />}
              >
                Phân tích độ phù hợp AI
              </Button>
            }
          />

          {job.match_score && (
            <ScrollReveal>
              <AIAnalysisCard matchScore={job.match_score} />
            </ScrollReveal>
          )}

          <JobDescription
            description={job.description}
            requirements={job.requirements}
            benefits={job.benefits}
          />
        </div>

        {/* Sidebar */}
        <div>
          <JobCompanySidebar company={job.employer || job.company} />

          <Card className="mt-6 p-8 bg-emerald-50 dark:bg-emerald-900/10 border-none shadow-inner rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
              <Brain size={100} />
            </div>
            <h4 className="font-black text-emerald-900 dark:text-emerald-400 flex items-center gap-2 mb-4 relative z-10">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-800/50 rounded-lg text-emerald-600 dark:text-emerald-300">
                <Brain size={18} />
              </div>
              AI Insight
            </h4>
            <p className="text-base text-emerald-800/80 dark:text-emerald-200/80 font-medium leading-relaxed relative z-10">
              Dựa trên hồ sơ của bạn, chúng tôi nhận thấy các kỹ năng{' '}
              <strong className="text-emerald-900 dark:text-emerald-300 bg-white/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md">
                {job.skills?.slice(0, 3).join(', ')}
              </strong>{' '}
              là thế mạnh giúp bạn đạt điểm cao cho vị trí này.
            </p>
          </Card>
        </div>
      </div>

      {showApplyModal && !applyBlocked && (
        <ApplyModal
          job={job}
          onClose={() => setShowApplyModal(false)}
          onSuccess={handleApplySuccess}
        />
      )}

      {showMatchModal && (
        <ResumeMatcherModal
          jobId={job.id}
          jobTitle={job.title}
          onClose={() => setShowMatchModal(false)}
        />
      )}
    </div>
  );
};

export default JobDetailPage;
