import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Scroll Reveal Component
 * Reveals children with animation when scrolled into view using Framer Motion
 */
const ScrollReveal = ({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 0.6, // duration in seconds for Framer Motion
  threshold = 0.1,
  once = true,
  className = '',
}) => {
  const variants = {
    hidden: {
      opacity: 0,
      y: animation === 'fade-up' ? 30 : animation === 'fade-down' ? -30 : 0,
      x: animation === 'fade-left' ? 30 : animation === 'fade-right' ? -30 : 0,
      scale: animation === 'scale' ? 0.95 : animation === 'zoom' ? 0.5 : 1,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: duration,
        delay: delay,
        ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for "premium" feel
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: threshold }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Stagger Container Component
 * Staggers animation of children
 */
export const StaggerContainer = ({
  children,
  staggerDelay = 0.1,
  className = '',
  viewportThreshold = 0.1,
}) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: viewportThreshold }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

ScrollReveal.propTypes = {
  children: PropTypes.node.isRequired,
  animation: PropTypes.oneOf(['fade-up', 'fade-down', 'fade-left', 'fade-right', 'scale', 'zoom']),
  delay: PropTypes.number,
  duration: PropTypes.number,
  threshold: PropTypes.number,
  once: PropTypes.bool,
  className: PropTypes.string,
};

StaggerContainer.propTypes = {
  children: PropTypes.node.isRequired,
  staggerDelay: PropTypes.number,
  className: PropTypes.string,
  viewportThreshold: PropTypes.number,
};

export default ScrollReveal;
