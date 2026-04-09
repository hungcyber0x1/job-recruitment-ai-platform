import PropTypes from 'prop-types';
import { CheckCircle2, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const defaultChecklist = [
  { label: 'Thông tin cơ bản', key: 'basic_info' },
  { label: 'Upload CV', key: 'resume' },
  { label: 'Kinh nghiệm làm việc', key: 'experience' },
  { label: 'Học vấn', key: 'education' },
  { label: 'Kỹ năng chuyên môn', key: 'skills' },
  { label: 'Công việc mong muốn', key: 'preferences' },
];

const ProfileCompletion = ({ completion, missingItems }) => {
  const missingSet = new Set(missingItems);
  const checklist = defaultChecklist.map((item) => ({
    ...item,
    completed: !missingSet.has(item.key),
  }));

  return (
    <div className="group relative flex h-full flex-col overflow-hidden">
      <div className="relative z-10 mb-6">
        <div className="flex w-fit items-center gap-2 rounded-md bg-secondary/10 px-3 py-1.5 text-secondary">
          <CheckCircle2 size={16} />
          <p className="text-xs font-semibold tracking-wide">
            Hoàn thiện thêm để tăng <span className="font-bold">{completion}%</span> cơ hội
          </p>
        </div>
      </div>

      <div className="relative z-10 mb-8 w-full">
        <div className="mb-3 flex items-end justify-between">
          <span className="text-5xl font-bold tracking-tight">{completion}%</span>
          <div className="pb-1">
            <Badge
              variant={completion >= 80 ? 'default' : completion >= 50 ? 'secondary' : 'outline'}
            >
              {completion >= 80 ? 'Elite' : completion >= 50 ? 'Strong' : 'Standard'}
            </Badge>
          </div>
        </div>
        <Progress value={completion} className="h-3" />
      </div>

      <div className="relative z-10 flex-1 space-y-3">
        {checklist.map((item) => (
          <div
            key={item.key}
            className="group/item flex items-center gap-4 rounded-xl border border-transparent p-3 transition-all duration-300 hover:border-border hover:bg-secondary/5"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${item.completed ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'}`}
            >
              {item.completed ? (
                <CheckCircle2 size={18} strokeWidth={2.5} />
              ) : (
                <Circle size={18} strokeWidth={2.5} />
              )}
            </div>
            <div className="flex-1">
              <span
                className={`text-sm font-medium ${item.completed ? 'text-muted-foreground' : 'text-foreground'}`}
              >
                {item.label}
              </span>
            </div>
            {!item.completed ? (
              <Button variant="outline" size="sm" asChild>
                <Link to="/candidate/profile">Cập nhật</Link>
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      <Button
        className="mt-8 w-full bg-primary text-white shadow-premium transition-all hover:-translate-y-0.5 hover:bg-primary"
        size="lg"
        asChild
      >
        <Link to="/candidate/profile">Chỉnh sửa hồ sơ</Link>
      </Button>
    </div>
  );
};

ProfileCompletion.propTypes = {
  completion: PropTypes.number,
  missingItems: PropTypes.arrayOf(PropTypes.string),
};

ProfileCompletion.defaultProps = {
  completion: 70,
  missingItems: [],
};

export default ProfileCompletion;
