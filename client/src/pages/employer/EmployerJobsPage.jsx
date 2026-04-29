import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import jobService from '../../services/jobService';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '@/components/ui/button';
import JobManagement from '../../components/employer/JobManagement';

const EmployerJobsPage = () => {
  const { showNotification } = useNotification();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await jobService.getMyJobs();
        const rawJobs = response?.data?.data;
        setJobs(Array.isArray(rawJobs) ? rawJobs : []);
      } catch (error) {
        console.error('Failed to fetch jobs', error);
        showNotification('Không thể tải danh sách tin tuyển dụng.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [showNotification]);

  const handleDelete = async (jobId) => {
    try {
      await jobService.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      showNotification('Đã xóa tin tuyển dụng.', 'success');
    } catch {
      showNotification('Không thể xóa tin tuyển dụng.', 'error');
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <JobManagement jobs={jobs} onDelete={handleDelete} />
    </div>
  );
};

export default EmployerJobsPage;
