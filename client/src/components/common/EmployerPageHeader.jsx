import React from 'react';
import PropTypes from 'prop-types';
import PageHeader from './PageHeader';

const EmployerPageHeader = (props) => {
  return (
    <PageHeader 
      rootLabel="Nhà tuyển dụng" 
      rootPath="/employer/dashboard" 
      {...props} 
    />
  );
};

EmployerPageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  actions: PropTypes.node,
};

export default EmployerPageHeader;
