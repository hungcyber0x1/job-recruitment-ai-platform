import PropTypes from 'prop-types';
import StatusBadge from '../common/StatusBadge';

/** Wrapper cho Job status - dùng unified StatusBadge */
const AdminJobStatusBadge = ({ job }) => {
  return (
    <StatusBadge
      entityType="job"
      status={job?.flagged ? 'flagged' : String(job?.status || 'draft')}
    />
  );
};

AdminJobStatusBadge.propTypes = {
  job: PropTypes.object.isRequired,
};

export default AdminJobStatusBadge;
