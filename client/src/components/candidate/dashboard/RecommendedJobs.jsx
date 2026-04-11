import PropTypes from 'prop-types';
import { Bookmark, DollarSign, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

const RecommendedJobs = ({ jobs }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="border-2 border-foreground bg-primary p-2 text-white shadow-[2px_2px_0_0_hsl(var(--foreground))]">
            <Sparkles size={16} strokeWidth={3} />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight">Gợi ý tối ưu</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {jobs.map((job) => (
          <Card
            key={job.id}
            className="group relative flex cursor-pointer flex-col justify-between overflow-visible card-premium-hover"
          >
            <div className="absolute -top-3 right-6 z-10 transition-colors">
              <Badge className="flex items-center gap-1.5 bg-state-success px-3 py-1.5 text-white shadow-md hover:bg-state-success/90">
                <Sparkles size={14} strokeWidth={2.5} />
                {job.match_score || 95}% Phù hợp
              </Badge>
            </div>

            <CardContent className="pb-4 pt-6">
              <div className="mb-4 mt-2 flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-background p-2 shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5">
                  <img
                    src={
                      job.company_logo ||
                      `https://ui-avatars.com/api/?name=${job.company_name}&background=random`
                    }
                    alt={job.company_name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="mt-0.5 min-w-0 flex-1 pr-4">
                  <h4 className="line-clamp-1 text-lg font-bold transition-colors group-hover:text-primary">
                    {job.title}
                  </h4>
                  <p className="mb-3 line-clamp-1 text-base font-medium text-muted-foreground">
                    {job.company_name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1.5 rounded-md font-medium"
                    >
                      <MapPin size={12} strokeWidth={2.5} /> {job.location || 'Ho Chi Minh'}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1.5 rounded-md border-state-success/20 bg-state-success/10 font-medium text-state-success"
                    >
                      <DollarSign size={12} strokeWidth={2.5} /> {job.salary_range || 'Thoa thuan'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="mt-auto justify-between border-t pt-5">
              <div className="flex -space-x-2">
                {['React', 'NodeJS', 'Figma'].map((skill) => (
                  <div
                    key={skill}
                    className="z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-sm font-semibold text-muted-foreground shadow-sm"
                    title={skill}
                  >
                    {skill[0]}
                  </div>
                ))}
                <div className="relative z-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
                  +3
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="hover:border-secondary/30 hover:text-secondary"
                >
                  <Bookmark size={18} />
                </Button>
                <Button asChild className="transition-transform hover:-translate-y-0.5">
                  <Link to={`/candidate/jobs/${job.id}`} className="flex items-center gap-2">
                    <Sparkles size={14} /> Ứng tuyển
                  </Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

RecommendedJobs.propTypes = {
  jobs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      title: PropTypes.string,
      company_name: PropTypes.string,
      company_logo: PropTypes.string,
      location: PropTypes.string,
      salary_range: PropTypes.string,
      match_score: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })
  ),
};

RecommendedJobs.defaultProps = {
  jobs: [],
};

export default RecommendedJobs;
