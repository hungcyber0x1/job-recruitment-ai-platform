import PropTypes from 'prop-types';
import { Briefcase, Calendar, Clock, FileText, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

import Modal from '../../common/Modal';
import Card from '../../common/Card';
import { getStatusConfig, getStatusLabel } from '../../../constants/status';
import { formatDate, formatTimeAgo } from '../../../utils/formatters';

const ApplicationDetailModal = ({ isOpen, onClose, application, history, loading }) => {
  const config = application ? getStatusConfig(application.status) : null;
  const StatusIcon = config?.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết đơn ứng tuyển">
      {loading ? (
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="h-28 animate-pulse rounded-2xl bg-muted" />
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : application ? (
        <div className="space-y-5">
          <Card className="border border-border p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
                {application.company_logo ? (
                  <img
                    src={application.company_logo}
                    alt={application.company_name}
                    className="h-full w-full rounded-2xl object-contain"
                  />
                ) : (
                  <Briefcase size={22} className="text-secondary" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-bold text-foreground">{application.job_title}</h3>
                  {config ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${config.bg} ${config.text}`}
                    >
                      {StatusIcon ? <StatusIcon size={14} /> : null}
                      {config.label}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-medium text-txt-muted">
                  {application.company_name}
                </p>
                <div className="mt-4 grid gap-3 text-sm text-txt-muted sm:grid-cols-2">
                  <span className="flex items-center gap-2">
                    <MapPin size={15} className="text-accent" />
                    {application.location || 'Đang cập nhật'}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock size={15} className="text-accent" />
                    Đã nộp: {formatDate(application.applied_at)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Briefcase size={15} className="text-accent" />
                    {application.employment_type || 'Chưa xác định'}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar size={15} className="text-accent" />
                    Hạn nộp: {application.deadline ? formatDate(application.deadline) : 'Không có'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border border-border p-5">
            <h4 className="text-base font-bold text-foreground">Tóm tắt</h4>
            <div className="mt-4 space-y-3 text-sm text-txt-muted">
              <p className="flex items-start gap-2">
                <FileText size={15} className="mt-0.5 text-secondary" />
                <span>{application.cover_letter || 'Chưa có cover letter.'}</span>
              </p>
              <p>
                Trạng thái hiện tại:{' '}
                <span className="font-semibold text-foreground">
                  {getStatusLabel(application.status)}
                </span>
              </p>
            </div>
          </Card>

          <Card className="border border-border p-5">
            <h4 className="text-base font-bold text-foreground">Lịch sử xử lý</h4>
            <div className="mt-4 space-y-4">
              <div className="flex gap-3">
                <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-secondary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Đã nộp đơn ứng tuyển</p>
                  <p className="text-sm text-txt-muted">
                    {formatDate(application.applied_at)} ({formatTimeAgo(application.applied_at)})
                  </p>
                </div>
              </div>

              {(history || []).map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {getStatusLabel(item.new_status)}
                    </p>
                    <p className="text-sm text-txt-muted">
                      {item.notes ||
                        `Cập nhật từ "${getStatusLabel(item.old_status || 'pending')}" sang "${getStatusLabel(item.new_status)}"`}
                    </p>
                    <p className="mt-1 text-xs text-txt-light">
                      {formatDate(item.created_at)} ({formatTimeAgo(item.created_at)})
                    </p>
                  </div>
                </div>
              ))}

              {!(history || []).length ? (
                <p className="text-sm text-txt-muted">Chưa có cập nhật mới sau khi nộp đơn.</p>
              ) : null}
            </div>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            {application.job_id ? (
              <Link
                to={`/candidate/jobs/${application.job_id}`}
                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-secondary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary"
              >
                Xem lại công việc
              </Link>
            ) : null}
            <Link
              to="/candidate/notifications"
              className="inline-flex flex-1 items-center justify-center rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-txt-muted transition-colors hover:bg-muted"
            >
              Xem thông báo liên quan
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-txt-muted">Không tải được chi tiết đơn ứng tuyển.</p>
      )}
    </Modal>
  );
};

ApplicationDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  application: PropTypes.object,
  history: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
};

export default ApplicationDetailModal;
