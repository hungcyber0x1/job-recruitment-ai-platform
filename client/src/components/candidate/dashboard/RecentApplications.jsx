import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase } from 'lucide-react';
import { getStatusLabel } from '../../../constants/status';
import { formatDate } from '../../../utils/formatters';

const RecentApplications = ({ applications = [] }) => {
  return (
    <div className="space-y-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-8 w-2 bg-accent" />
        <h2 className="text-xl font-black uppercase tracking-tight">Recent applications</h2>
      </div>

      {applications.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Briefcase size={24} className="text-muted-foreground" />
          </div>
          <p className="font-medium text-muted-foreground">You have not applied to any jobs yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Link key={app.id} to={`/candidate/applications?applicationId=${app.id}`}>
              <Card className="group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background p-2 transition-transform group-hover:-translate-y-0.5">
                      <img
                        src={
                          app.company_logo ||
                          `https://ui-avatars.com/api/?name=${app.company_name}&background=random`
                        }
                        alt={app.company_name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 pr-4">
                      <h4 className="truncate text-base font-semibold transition-colors group-hover:text-primary">
                        {app.job_title}
                      </h4>
                      <p className="mt-0.5 truncate text-sm font-medium text-muted-foreground">
                        {app.company_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                    <Badge
                      variant="outline"
                      className="border-border uppercase tracking-wider text-txt-muted shadow-sm"
                    >
                      {getStatusLabel(app.status)}
                    </Badge>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {formatDate(app.applied_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

RecentApplications.propTypes = {
  applications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      job_title: PropTypes.string.isRequired,
      company_name: PropTypes.string.isRequired,
      company_logo: PropTypes.string,
      status: PropTypes.string.isRequired,
      applied_at: PropTypes.string.isRequired,
    })
  ),
};

export default RecentApplications;
