import PropTypes from 'prop-types';
import React from 'react';
import { Eye, Trash2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../common/Badge';

const JobManagement = ({ jobs, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-muted uppercase tracking-widest text-sm font-black text-txt-light">
            <th className="px-8 py-5">Tin tuyển dụng</th>
            <th className="px-8 py-5">Trạng thái</th>
            <th className="px-8 py-5 text-center">Ứng viên</th>
            <th className="px-8 py-5 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {jobs.map((job) => (
            <tr key={job.id} className="group transition-colors hover:bg-secondary/5">
              <td className="px-8 py-6">
                <div className="font-bold text-foreground transition-colors group-hover:text-secondary">
                  {job.title}
                </div>
                <div className="mt-1 text-sm font-black uppercase tracking-widest text-txt-light">
                  {job.location} • {job.type}
                </div>
              </td>
              <td className="px-8 py-6">
                <Badge variant={job.status === 'published' ? 'green' : 'yellow'}>
                  {job.status.toUpperCase()}
                </Badge>
              </td>
              <td className="px-8 py-6 text-center">
                <Link
                  to={`/employer/jobs/${job.id}/applicants`}
                  className="inline-flex items-center gap-2 rounded-lg bg-secondary/10 px-3 py-1.5 text-sm font-bold text-secondary transition-all hover:bg-secondary hover:text-white"
                >
                  <Users size={14} />
                  {job.applicant_count || 0}
                </Link>
              </td>
              <td className="px-8 py-6 text-right">
                <div className="flex justify-end gap-2">
                  <Link
                    to={`/jobs/${job.id}`}
                    className="rounded-xl border border-border p-2 text-txt-light transition-colors duration-200 ease-out hover:bg-muted/40 hover:text-secondary"
                  >
                    <Eye size={18} />
                  </Link>
                  <button
                    onClick={() => onDelete(job.id)}
                    className="rounded-xl border border-border p-2 text-txt-light transition-colors duration-200 ease-out hover:bg-muted/40 hover:text-state-danger"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

JobManagement.propTypes = {
  jobs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      title: PropTypes.string,
      location: PropTypes.string,
      type: PropTypes.string,
      status: PropTypes.string,
      applicant_count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })
  ),
  onDelete: PropTypes.func.isRequired,
};

JobManagement.defaultProps = {
  jobs: [],
};

export default JobManagement;
