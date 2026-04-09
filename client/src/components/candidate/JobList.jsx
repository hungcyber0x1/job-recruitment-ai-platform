import PropTypes from 'prop-types';
import React from 'react';

import JobCard from './JobCard';

const JobList = ({ jobs, loading, emptyMessage }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-48 rounded-[32px] border border-gray-100 bg-white p-10 shadow-sm animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <div className="rounded-[40px] border border-dashed border-gray-200 bg-white py-32 text-center">
        <p className="font-medium text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
};

JobList.propTypes = {
  jobs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    })
  ),
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
};

JobList.defaultProps = {
  jobs: [],
  loading: false,
  emptyMessage: 'Không tìm thấy công việc nào.',
};

export default JobList;
