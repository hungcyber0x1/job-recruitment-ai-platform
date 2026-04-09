import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';

/**
 * 3D Tilt Card Component
 * Card that tilts based on mouse position
 */
const TiltCard = ({
  children,
  className = '',
  maxTilt = 10,
  perspective = 1000,
  scale = 1.05,
  speed = 400,
}) => {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();

    // Calculate mouse position relative to card center
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Calculate rotation angles
    const rotateX = -(y / rect.height) * maxTilt;
    const rotateY = (x / rect.width) * maxTilt;

    setTransform(
      `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`
    );
  };

  const handleMouseLeave = () => {
    setTransform('');
  };

  return (
    <div
      ref={cardRef}
      className={`transition-transform ${className}`}
      style={{
        transform,
        transitionDuration: `${speed}ms`,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

TiltCard.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  maxTilt: PropTypes.number,
  perspective: PropTypes.number,
  scale: PropTypes.number,
  speed: PropTypes.number,
};

export default TiltCard;
