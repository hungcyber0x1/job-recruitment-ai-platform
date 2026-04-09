import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

/**
 * Parallax Component
 * Creates parallax scrolling effect
 */
const Parallax = ({ children, speed = 0.5, direction = 'up', className = '' }) => {
  const elementRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return;

      const scrolled = window.pageYOffset;
      const rect = elementRef.current.getBoundingClientRect();
      const elementTop = rect.top + scrolled;
      const elementHeight = rect.height;

      // Calculate if element is in viewport
      const windowHeight = window.innerHeight;
      const scrollProgress =
        (scrolled + windowHeight - elementTop) / (windowHeight + elementHeight);

      if (scrollProgress >= 0 && scrollProgress <= 1) {
        const movement = (scrolled - elementTop) * speed;

        let transform = '';
        switch (direction) {
          case 'up':
            transform = `translateY(${-movement}px)`;
            break;
          case 'down':
            transform = `translateY(${movement}px)`;
            break;
          case 'left':
            transform = `translateX(${-movement}px)`;
            break;
          case 'right':
            transform = `translateX(${movement}px)`;
            break;
          default:
            transform = `translateY(${-movement}px)`;
        }

        elementRef.current.style.transform = transform;
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, direction]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
};

Parallax.propTypes = {
  children: PropTypes.node.isRequired,
  speed: PropTypes.number,
  direction: PropTypes.oneOf(['up', 'down', 'left', 'right']),
  className: PropTypes.string,
};

export default Parallax;
