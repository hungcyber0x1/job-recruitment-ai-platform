import PropTypes from 'prop-types';
import React from 'react';
import { MapPin, Users, Briefcase } from 'lucide-react';
import Card from '../../common/Card';
import { Link } from 'react-router-dom';

const CompanyCard = ({ company }) => {
  return (
    <Card hover className="p-0 flex flex-col h-full overflow-hidden outline-none">
      <div className="h-24 bg-slate-100/50 relative border-b border-slate-100/50">
        {/* Optional Cover Image */}
      </div>
      <div className="px-6 pt-12 pb-6 relative flex flex-col flex-1">
        <div className="w-16 h-16 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center absolute -top-8 left-6 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
          <img
            src={
              company.logo || `https://ui-avatars.com/api/?name=${company.name}&background=random`
            }
            alt={company.name}
            className="w-full h-full object-contain p-1.5"
          />
        </div>

        <div className="flex flex-col flex-1 text-left">
          <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1 group-hover:text-primary transition-colors leading-snug tracking-normal">
            {company.name}
          </h3>
          <p className="text-sm font-medium text-slate-500 mb-5 truncate">{company.industry}</p>

          <div className="space-y-2.5 mb-6 text-sm">
            <div className="flex items-center gap-2.5 font-medium text-slate-600">
              <MapPin size={16} className="text-slate-400 flex-shrink-0" />
              <span className="truncate">{company.location}</span>
            </div>
            <div className="flex items-center gap-2.5 font-medium text-slate-600">
              <Users size={16} className="text-slate-400 flex-shrink-0" />
              <span>{company.size} nhân viên</span>
            </div>
            <div className="flex items-center gap-2.5 font-medium text-slate-600">
              <Briefcase size={16} className="text-slate-400 flex-shrink-0" />
              <span className="text-primary font-bold">{company.openPositions} việc làm</span>
            </div>
          </div>

          <Link
            to={`/companies/${company.id}`}
            className="block w-full py-2.5 rounded-xl bg-slate-50 text-slate-600 font-bold text-center text-sm btn-hover-secondary"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </Card>
  );
};

CompanyCard.propTypes = {
  company: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    logo: PropTypes.string,
    name: PropTypes.string,
    industry: PropTypes.string,
    location: PropTypes.string,
    size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    openPositions: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
};

export default CompanyCard;
