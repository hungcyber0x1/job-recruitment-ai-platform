import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';

const CompanyDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  return <Navigate to={`/companies/${id}${location.search || ''}`} replace />;
};

export default CompanyDetailPage;
