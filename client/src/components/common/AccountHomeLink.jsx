import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

import { cn } from '@/utils';

const AccountHomeLink = ({ className, onClick }) => (
  <Link
    to="/"
    onClick={onClick}
    className={cn(
      'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 text-sm font-bold text-emerald-700 shadow-sm shadow-emerald-900/5 transition-all hover:border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 active:scale-95 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/15',
      className
    )}
    aria-label="Về trang chủ"
    title="Về trang chủ"
  >
    <Home className="h-4 w-4 shrink-0" />
    <span className="hidden sm:inline">Trang chủ</span>
  </Link>
);

AccountHomeLink.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default AccountHomeLink;
