import PropTypes from 'prop-types';
import {
  Briefcase,
  Calendar,
  Clock,
  FileText,
  MapPin,
  DollarSign,
  Building2,
  MessageSquare,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import Modal from '../../common/Modal';
import Card from '../../common/Card';
import { getStatusConfig, getStatusLabel } from '../../../constants/status';
import { formatDate, formatTimeAgo } from '../../../utils/formatters';
import { decodeHtml } from '../../../utils/sanitizeHtml';
import ApplicationNotes from './ApplicationNotes';

const ApplicationDetailModal = ({
  isOpen,
  onClose,
  application,
  history,
  loading,
  notes,
  onNoteSaved,
}) => {
  const config = application ? getStatusConfig(application.status) : null;
  const StatusIcon = config?.icon;
  const isOffered = application?.status === 'offered';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết đơn ứng tuyển">
      {loading ? (
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
          <div className="h-28 animate-pulse rounded-xl bg-muted" />
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : application ? (
        <div className="space-y-5">
          {/* Job Info Card */}
          <Card className="border border-border p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
                {application.company_logo ? (
                  <img
                    src={application.company_logo}
                    alt={application.company_name}
                    className="h-full w-full rounded-xl object-contain"
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
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold uppercase tracking-normal ${config.bg} ${config.text}`}
                    >
                      {StatusIcon ? <StatusIcon size={14} /> : null}
                      {config.label}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-base font-medium text-txt-muted">
                  {application.company_name}
                </p>
                <div className="mt-4 grid gap-3 text-sm text-txt-muted sm:grid-cols-2">
                  <span className="flex items-center gap-2">
                    <MapPin size={15} className="text-accent shrink-0" />
                    {application.location || 'Đang cập nhật'}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock size={15} className="text-accent shrink-0" />
                    Đã nộp: {formatDate(application.applied_at)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Briefcase size={15} className="text-accent shrink-0" />
                    {application.employment_type || 'Chưa xác định'}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar size={15} className="text-accent shrink-0" />
                    Hạn nộp: {application.deadline ? formatDate(application.deadline) : 'Không có'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Salary / Offer Section */}
          {(isOffered || application.expected_salary || application.offered_salary) && (
            <Card className="border border-emerald-200 bg-emerald-50/50 p-5">
              <h4 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
                <DollarSign size={16} className="text-emerald-600" />
                Thông tin lương & Offer
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {application.expected_salary && (
                  <div className="rounded-lg bg-white border border-emerald-100 p-3">
                    <p className="text-xs text-emerald-600 font-bold uppercase mb-1">
                      Mức lương mong muốn
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {application.expected_salary?.toLocaleString('vi-VN')}{' '}
                      {application.salary_currency || 'VND'}
                    </p>
                  </div>
                )}
                {application.offered_salary && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-200 p-3">
                    <p className="text-xs text-emerald-700 font-bold uppercase mb-1">
                      Offer đã nhận
                    </p>
                    <p className="text-sm font-bold text-emerald-800">
                      {application.offered_salary?.toLocaleString('vi-VN')}{' '}
                      {application.salary_currency || 'VND'}
                    </p>
                  </div>
                )}
                {application.offered_start_date && (
                  <div className="rounded-lg bg-white border border-emerald-100 p-3">
                    <p className="text-xs text-emerald-600 font-bold uppercase mb-1">
                      Ngày bắt đầu dự kiến
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {formatDate(application.offered_start_date)}
                    </p>
                  </div>
                )}
                {application.offered_response_deadline && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs text-amber-700 font-bold uppercase mb-1">
                      Hạn phản hồi offer
                    </p>
                    <p className="text-sm font-bold text-amber-800">
                      {formatDate(application.offered_response_deadline)}
                    </p>
                  </div>
                )}
              </div>
              {application.offered_benefits && (
                <div className="mt-3">
                  <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Phúc lợi</p>
                  <p className="text-sm text-slate-700">{application.offered_benefits}</p>
                </div>
              )}
            </Card>
          )}

          {/* Application Summary */}
          <Card className="border border-border p-5">
            <h4 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
              <FileText size={16} className="text-secondary" />
              Tóm tắt đơn ứng tuyển
            </h4>
            <div className="space-y-3 text-sm text-txt-muted">
              <p className="flex items-start gap-2">
                <FileText size={15} className="mt-0.5 text-secondary shrink-0" />
                <span>{decodeHtml(application.cover_letter) || 'Chưa có cover letter.'}</span>
              </p>
              {application.cv_name && (
                <p className="flex items-center gap-2">
                  <Building2 size={15} className="text-accent shrink-0" />
                  CV đã sử dụng:{' '}
                  <span className="font-medium text-foreground">{application.cv_name}</span>
                </p>
              )}
              <p>
                Trạng thái hiện tại:{' '}
                <span className="font-semibold text-foreground">
                  {getStatusLabel(application.status)}
                </span>
              </p>
            </div>
          </Card>

          {/* Candidate Notes */}
          <Card className="border border-border p-5">
            <ApplicationNotes
              applicationId={application.id}
              initialNote={notes || application.candidate_note || ''}
              onNoteSaved={onNoteSaved}
            />
          </Card>

          {/* History */}
          <Card className="border border-border p-5">
            <h4 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
              <Clock size={16} className="text-secondary" />
              Lịch sử xử lý
            </h4>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-base font-semibold text-foreground">Đã nộp đơn ứng tuyển</p>
                  <p className="text-base text-txt-muted">
                    {formatDate(application.applied_at)} ({formatTimeAgo(application.applied_at)})
                  </p>
                </div>
              </div>

              {(history || []).map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {getStatusLabel(item.new_status)}
                    </p>
                    <p className="text-base text-txt-muted">
                      {item.notes ||
                        `Cập nhật từ "${getStatusLabel(item.old_status ?? null)}" sang "${getStatusLabel(item.new_status)}"`}
                    </p>
                    <p className="mt-1 text-base text-txt-light">
                      {formatDate(item.created_at)} ({formatTimeAgo(item.created_at)})
                    </p>
                  </div>
                </div>
              ))}

              {!(history || []).length ? (
                <p className="text-base text-txt-muted">Chưa có cập nhật mới sau khi nộp đơn.</p>
              ) : null}
            </div>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            {application.job_id ? (
              <Link
                to={`/candidate/jobs/${application.job_id}`}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary"
              >
                Xem lại công việc
              </Link>
            ) : null}
            <Link
              to="/candidate/notifications"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-txt-muted transition-colors hover:bg-muted"
            >
              Xem thông báo liên quan
            </Link>
            <Link
              to={`/candidate/messages?applicationId=${application.id}`}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Nhắn tin
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-base text-txt-muted">Không tải được chi tiết đơn ứng tuyển.</p>
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
  notes: PropTypes.string,
  onNoteSaved: PropTypes.func,
};

export default ApplicationDetailModal;
