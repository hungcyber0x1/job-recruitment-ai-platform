import PropTypes from 'prop-types';
import { ChevronRight, FileText, Mail, UserCheck, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';

import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { getStatusLabel, APPLICATION_STATUS } from '../../constants/status';

const VALID_SHORTLIST_TRANSITIONS = new Set([APPLICATION_STATUS.SUBMITTED]);

const VALID_REJECT_TRANSITIONS = new Set([
  APPLICATION_STATUS.SUBMITTED,
  APPLICATION_STATUS.SHORTLISTED,
  APPLICATION_STATUS.INTERVIEW_SCHEDULED,
  APPLICATION_STATUS.INTERVIEWED,
  APPLICATION_STATUS.OFFERED,
]);

const TERMINAL_STATUSES = new Set([
  APPLICATION_STATUS.HIRED,
  APPLICATION_STATUS.REJECTED,
  APPLICATION_STATUS.WITHDRAWN,
]);

const getVariant = (status) => {
  if (['hired', 'offered'].includes(status)) return 'green';
  if (status === 'rejected') return 'red';
  if (['reviewed', 'shortlisted', 'interviewing'].includes(status)) return 'blue';
  return 'yellow';
};

const ApplicantList = ({ applicants, onUpdateStatus }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-muted text-sm font-bold uppercase tracking-normal text-txt-light">
            <th className="px-8 py-5">Ứng viên</th>
            <th className="px-8 py-5">CV và liên hệ</th>
            <th className="px-8 py-5">Ngày ứng tuyển</th>
            <th className="px-8 py-5">Trạng thái</th>
            <th className="px-8 py-5 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {applicants.map((applicant) => (
            <tr key={applicant.id} className="group transition-colors hover:bg-secondary/5">
              <td className="px-8 py-6">
                <div className="flex items-center gap-4">
                  <Avatar
                    name={`${applicant.first_name} ${applicant.last_name}`}
                    src={applicant.avatar_url}
                    size="md"
                    className="rounded-xl"
                  />
                  <div>
                    <div className="font-bold text-foreground transition-colors group-hover:text-secondary">
                      {applicant.first_name} {applicant.last_name}
                    </div>
                    <div className="mt-1 text-sm font-bold uppercase tracking-normal text-txt-light">
                      {applicant.current_job_title || 'Ứng viên'}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-8 py-6">
                <div className="flex flex-col gap-1.5">
                  <a
                    href={applicant.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm font-bold text-secondary hover:underline"
                  >
                    <FileText size={14} /> Xem CV chi tiết
                  </a>
                  <div className="flex items-center gap-2 text-sm font-medium text-txt-light">
                    <Mail size={14} /> {applicant.email}
                  </div>
                </div>
              </td>
              <td className="px-8 py-6 text-sm font-bold text-txt-muted">
                {new Date(applicant.applied_at).toLocaleDateString()}
              </td>
              <td className="px-8 py-6">
                <Badge variant={getVariant(applicant.status)}>
                  {getStatusLabel(applicant.status)}
                </Badge>
              </td>
              <td className="px-8 py-6 text-right">
                <div className="flex justify-end gap-2">
                  {!TERMINAL_STATUSES.has(applicant.status) &&
                    VALID_SHORTLIST_TRANSITIONS.has(applicant.status) && (
                      <button
                        onClick={() => onUpdateStatus(applicant.id, 'shortlisted')}
                        className="rounded-xl border border-border p-2.5 text-txt-light transition-colors duration-200 ease-out hover:bg-muted/40 hover:text-state-success"
                        title="Shortlist"
                      >
                        <UserCheck size={18} />
                      </button>
                    )}
                  {!TERMINAL_STATUSES.has(applicant.status) &&
                    VALID_REJECT_TRANSITIONS.has(applicant.status) && (
                      <button
                        onClick={() => onUpdateStatus(applicant.id, 'rejected')}
                        className="rounded-xl border border-border p-2.5 text-txt-light transition-colors duration-200 ease-out hover:bg-muted/40 hover:text-state-danger"
                        title="Từ chối"
                      >
                        <UserX size={18} />
                      </button>
                    )}
                  <Link
                    to={`/employer/applications/${applicant.id}`}
                    className="rounded-xl border border-border p-2.5 text-txt-light transition-colors duration-200 ease-out hover:bg-muted/40 hover:text-secondary"
                  >
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

ApplicantList.propTypes = {
  applicants: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      first_name: PropTypes.string,
      last_name: PropTypes.string,
      avatar_url: PropTypes.string,
      current_job_title: PropTypes.string,
      resume_url: PropTypes.string,
      email: PropTypes.string,
      applied_at: PropTypes.string,
      status: PropTypes.string,
    })
  ).isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
};

export default ApplicantList;
