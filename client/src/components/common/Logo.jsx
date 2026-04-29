import React from 'react';
import { Link } from 'react-router-dom';
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

export default Logo;
