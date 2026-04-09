import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import Card from './Card';

/**
 * ApplicationTimeline - Visual status tracker for applications
 * Shows progression through application stages
 */
const ApplicationTimeline = ({ timeline, currentStatus }) => {
  // Status display names
  const statusNames = {
    pending: 'Application Submitted',
    reviewed: 'Under Review',
    shortlisted: 'Shortlisted',
    interviewing: 'Interview In Progress',
    interview_scheduled: 'Interview Scheduled',
    interviewed: 'Interview Completed',
    assessment_sent: 'Assessment Sent',
    assessment_completed: 'Assessment Completed',
    offered: 'Offer Made',
    hired: 'Hired',
    offer_accepted: 'Offer Accepted',
    offer_declined: 'Offer Declined',
    rejected: 'Application Rejected',
    withdrawn: 'Application Withdrawn',
  };

  // Get status icon
  const getStatusIcon = (status, isActive, isComplete) => {
    if (status === 'rejected' || status === 'offer_declined' || status === 'withdrawn') {
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

    if (isComplete || isActive) {
      return (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${isActive ? 'bg-primary shadow-glow ring-4 ring-primary/20' : 'bg-success shadow-success/20'}`}
        >
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

    return <div className="w-8 h-8 rounded-full border-2 border-secondary-300 bg-white"></div>;
  };

  // Sort timeline by date
  const sortedTimeline = timeline
    ? [...timeline].sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at))
    : [];

  return (
    <Card className="p-6 shadow-premium border-none relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all duration-500 group-hover:bg-primary/10"></div>
      <h3 className="text-lg font-black mb-6 text-foreground tracking-tight flex items-center gap-2">
        <div className="w-1.5 h-6 bg-primary rounded-full"></div>
        Application Progress
      </h3>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-secondary-200"></div>

        {/* Timeline items */}
        <div className="space-y-4">
          {sortedTimeline.length > 0 ? (
            sortedTimeline.map((item, index) => {
              const isActive = item.status === currentStatus;
              const isComplete = index < sortedTimeline.length - 1;

              return (
                <div key={index} className="relative flex items-start gap-4">
                  {/* Icon */}
                  <div className="relative z-10">
                    {getStatusIcon(item.status, isActive, isComplete)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`font-bold tracking-tight ${isActive ? 'text-primary' : 'text-foreground'}`}
                      >
                        {statusNames[item.status] || item.status}
                      </h4>
                      <span className="text-sm text-txt-muted">
                        {format(new Date(item.changed_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {item.notes && <p className="mt-1 text-sm text-txt-muted">{item.notes}</p>}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-txt-light py-8">No timeline data available</div>
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
