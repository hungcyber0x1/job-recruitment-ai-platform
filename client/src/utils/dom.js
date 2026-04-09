/**
 * DOM manipulation utilities
 * @module utils/dom
 */

/**
 * Scroll to top of page with smooth animation
 * @returns {void}
 */
export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Scroll to a specific element
 * @param {string} elementId - ID of the element to scroll to
 * @param {Object} options - Scroll options
 * @param {ScrollBehavior} options.behavior - Scroll behavior (smooth/auto)
 * @param {ScrollLogicalPosition} options.block - Vertical alignment
 * @returns {void}
 */
export const scrollToElement = (elementId, options = {}) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({
      behavior: options.behavior || 'smooth',
      block: options.block || 'start',
    });
  }
};

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if element is in viewport
 */
export const isInViewport = (element) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};
