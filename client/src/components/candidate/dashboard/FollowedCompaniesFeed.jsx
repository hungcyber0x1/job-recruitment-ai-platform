import React, { useEffect, useState } from 'react';
import { Building2, ExternalLink, MapPin, Plus, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import candidateService from '../../../services/candidateService';
import { isHandledAuthError } from '../../../utils/authErrors';

const FollowedCompaniesFeed = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await candidateService.getSavedCompanies();
      setCompanies(res.data?.data || []);
    } catch (err) {
      if (isHandledAuthError(err)) {
        setCompanies([]);
        return;
      }
      console.error('Failed to fetch followed companies:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-xl">
            <CardContent className="h-20 animate-pulse bg-slate-100" />
          </Card>
        ))}
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <Card className="rounded-xl border border-slate-200 bg-white">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Building2 className="h-10 w-10 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-500">Chưa theo dõi công ty nào</p>
          <Link to="/companies">
            <Button variant="outline" className="mt-3 rounded-lg text-sm font-bold gap-2">
              <Plus className="h-4 w-4" />
              Khám phá công ty
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {companies.slice(0, 5).map((company) => (
        <Link key={company.id} to={`/candidate/companies/${company.id}`}>
          <Card className="rounded-xl border border-slate-200 bg-white hover:shadow-md hover:border-emerald-200 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm">
                  {(company.name || company.company_name || '?').charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {company.name || company.company_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {company.location && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="h-3 w-3" />
                        {company.location}
                      </span>
                    )}
                    {company.employee_count && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Users className="h-3 w-3" />
                        {company.employee_count}
                      </span>
                    )}
                  </div>
                </div>
                {company.has_new_jobs && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 shrink-0">
                    <TrendingUp className="h-3 w-3" />
                    {company.new_job_count || 'New'} việc
                  </span>
                )}
                <ExternalLink className="h-4 w-4 text-slate-300 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
      {companies.length > 5 && (
        <Link to="/candidate/saved-companies">
          <Button variant="outline" className="w-full rounded-xl h-10 text-sm font-bold gap-2">
            <Building2 className="h-4 w-4" />
            Xem tất cả công ty đã lưu ({companies.length})
          </Button>
        </Link>
      )}
    </div>
  );
};

export default FollowedCompaniesFeed;
