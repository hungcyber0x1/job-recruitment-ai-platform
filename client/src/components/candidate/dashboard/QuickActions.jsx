import React from 'react';
import { Search, Edit, MessageSquare, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuickActions = () => {
  const actions = [
    {
      label: 'Tìm việc làm',
      icon: <Search size={20} />,
      path: '/candidate/jobs',
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      label: 'Cập nhật hồ sơ',
      icon: <Edit size={20} />,
      path: '/candidate/profile',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Chat với AI',
      icon: <MessageSquare size={20} />,
      path: '/candidate/chat',
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'Tải CV mới',
      icon: <Upload size={20} />,
      path: '/candidate/profile',
      color: 'text-state-warning',
      bg: 'bg-state-warning/10',
    },
  ];

  return (
    <div className="flex flex-col h-full relative group">
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, idx) => (
          <Link
            key={idx}
            to={action.path}
            className="group flex flex-col items-center justify-center rounded-2xl border border-border bg-white p-5 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-premium"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-300 ${action.bg} ${action.color}`}
            >
              <div className="transition-colors">{action.icon}</div>
            </div>
            <span className="text-xs font-semibold tracking-wide text-txt-muted transition-colors group-hover:text-foreground">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
