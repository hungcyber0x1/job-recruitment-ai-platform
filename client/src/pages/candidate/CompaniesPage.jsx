import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const CompaniesPage = () => {
  const location = useLocation();
  return <Navigate to={`/companies${location.search || ''}`} replace />;
};

export default CompaniesPage;
