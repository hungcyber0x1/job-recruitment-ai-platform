import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import logoImg from '@/assets/logo.png';

const Logo = ({ className = 'h-12 w-auto', asLink = true }) => {
  const content = (
    <img src={logoImg} alt="HireBot Logo" className={`object-contain ${className}`} />
  );

  if (asLink) {
    return (
      <Link
        to="/"
        className="inline-flex items-center transition-transform hover:scale-105 active:scale-95 duration-200"
      >
        {content}
      </Link>
    );
  }

  return <div className="inline-flex items-center">{content}</div>;
};

Logo.propTypes = {
  className: PropTypes.string,
  asLink: PropTypes.bool,
};

export default Logo;
