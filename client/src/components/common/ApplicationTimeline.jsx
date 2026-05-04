import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import Card from './Card';
import { APP_STATUS_CONFIG, getAppStatusLabel } from '../../constants';

/**
 * ApplicationTimeline - Visual status tracker for applications
 * Dùng centralized constants từ ../../constants/status.js
 *
 * ⚠️  Chỉ hỗ trợ 10 statuses chuẩn từ APP_STATUS_VALUES.
 * Các status không chuẩn (interview_scheduled, assessment_sent, etc.)
 * KHÔNG có trong hệ thống này - chúng là legacy/placeholder.
 */
const ApplicationTimeline = ({ timeline, currentStatus }) => {
  const sortedTimeline = timeline
    ? [...timeline].sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at))
    : [];

  const isRejectedOrWithdrawn = (status) => status === 'rejected' || status === 'withdrawn';

  const isFinalState = (status) =>
    status === 'hired' || status === 'accepted' || status === 'rejected' || status === 'withdrawn';

  const getStatusIcon = (status, isActive, isComplete) => {
    if (isRejectedOrWithdrawn(status)) {
      return (
        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      );
    }

    if (isComplete) {
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      );
    }

    if (isActive) {
      return (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md ring-4 ring-primary/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      );
    }

    return <div className="w-8 h-8 rounded-full border-2 border-slate-300 bg-white"></div>;
  };

  return (
    <Card className="p-6 shadow-premium border-none relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all duration-500 group-hover:bg-primary/10"></div>
      <h3 className="text-lg font-bold mb-6 text-foreground tracking-normal flex items-center gap-2">
        <div className="w-1.5 h-6 bg-primary rounded-full"></div>
        Tiến trình ứng tuyển
      </h3>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>

        <div className="space-y-4">
          {sortedTimeline.length > 0 ? (
            sortedTimeline.map((item, index) => {
              const isActive = item.status === currentStatus;
              const isComplete = index < sortedTimeline.length - 1;
              const label = getAppStatusLabel(item.status);

              return (
                <div key={index} className="relative flex items-start gap-4">
                  <div className="relative z-10">
                    {getStatusIcon(item.status, isActive, isComplete)}
                  </div>

                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`font-bold tracking-normal ${
                          isActive
                            ? 'text-primary'
                            : isRejectedOrWithdrawn(item.status)
                              ? 'text-red-600'
                              : 'text-foreground'
                        }`}
                      >
                        {label}
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(item.changed_at), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="mt-1 text-base text-muted-foreground">{item.notes}</p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Không có dữ liệu tiến trình
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

ApplicationTimeline.propTypes = {
  timeline: PropTypes.arrayOf(
    PropTypes.shape({
      status: PropTypes.string.isRequired,
      changed_at: PropTypes.string.isRequired,
      notes: PropTypes.string,
    })
  ),
  currentStatus: PropTypes.string.isRequired,
};

export default ApplicationTimeline;
