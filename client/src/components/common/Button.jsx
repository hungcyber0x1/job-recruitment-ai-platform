import PropTypes from 'prop-types';
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none focus-ring',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-white shadow-card hover:bg-primary/90 border border-transparent hover-lift hover-glow',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/92 border border-transparent hover-lift',
        outline:
          'bg-transparent text-foreground border border-white/10 hover:border-primary/60 hover:text-primary hover:bg-primary/10 shadow-sm hover-lift',
        ghost: 'bg-transparent text-slate-400 hover:text-primary hover:bg-primary/10 hover-scale',
        danger:
          'bg-error/10 text-error hover:bg-error hover:text-white transition-all duration-300 hover-lift',
        white:
          'bg-slate-900 text-foreground shadow-card hover:shadow-glow border border-white/10 hover:bg-slate-800 hover-lift',
        glass:
          'glass text-primary border border-white/10 hover:bg-slate-900/90 shadow-glass hover-lift',
        accent: 'bg-accent text-white shadow-card hover:bg-accent/90 hover-lift hover-glow',
      },
      size: {
        sm: 'px-4 py-2 text-sm rounded-xl',
        md: 'px-6 py-3.5 text-base rounded-2xl',
        lg: 'px-8 py-4.5 text-lg rounded-2xl',
        xl: 'px-10 py-5.5 text-xl rounded-[1.5rem]',
        icon: 'p-3.5 rounded-xl',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

const IconWrapper = ({ icon: Icon, side, size }) => {
  if (!Icon) return null;
  const iconSize = size === 'sm' ? 14 : size === 'lg' || size === 'xl' ? 20 : 18;
  const margin = side === 'left' ? 'mr-2' : 'ml-2';

  if (React.isValidElement(Icon)) {
    return React.cloneElement(Icon, {
      size: Icon.props.size || iconSize,
      className: cn(margin, 'shrink-0', Icon.props.className),
    });
  }

  if (typeof Icon === 'function' || typeof Icon === 'object') {
    const Comp = Icon;
    return <Comp size={iconSize} className={cn(margin, 'shrink-0')} />;
  }
  return <span className={cn(margin, 'shrink-0')}>{Icon}</span>;
};

IconWrapper.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.element, PropTypes.elementType, PropTypes.node]),
  side: PropTypes.oneOf(['left', 'right']).isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'icon']),
};

const Button = React.forwardRef(
  (
    {
      children,
      variant,
      size,
      className,
      isLoading = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      disabled,
      to,
      href,
      type = 'button',
      fullWidth,
      renderAs,
      ...props
    },
    ref
  ) => {
    const content = (
      <>
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />
        ) : (
          <IconWrapper icon={LeftIcon} side="left" size={size} />
        )}
        <span>{children}</span>
        {!isLoading && <IconWrapper icon={RightIcon} side="right" size={size} />}
      </>
    );

    const classes = cn(buttonVariants({ variant, size, fullWidth }), className);
    const isDisabled = disabled || isLoading;

    if (to) {
      if (isDisabled) {
        return (
          <span className={cn(classes, 'cursor-not-allowed opacity-60')} {...props}>
            {content}
          </span>
        );
      }
      return (
        <Link to={to} className={classes} ref={ref} {...props}>
          {content}
        </Link>
      );
    }

    if (href) {
      if (isDisabled) {
        return (
          <span className={cn(classes, 'cursor-not-allowed opacity-60')} {...props}>
            {content}
          </span>
        );
      }
      return (
        <a
          href={href}
          className={classes}
          ref={ref}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {content}
        </a>
      );
    }

    if (renderAs) {
      const Component = renderAs;
      if (isDisabled) {
        return (
          <span className={cn(classes, 'cursor-not-allowed opacity-60')} {...props}>
            {content}
          </span>
        );
      }
      return (
        <Component className={classes} ref={ref} {...props}>
          {content}
        </Component>
      );
    }

    return (
      <button type={type} className={classes} disabled={isDisabled} ref={ref} {...props}>
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'outline',
    'ghost',
    'danger',
    'white',
    'glass',
    'accent',
  ]),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'icon']),
  className: PropTypes.string,
  isLoading: PropTypes.bool,
  leftIcon: PropTypes.oneOfType([PropTypes.element, PropTypes.elementType, PropTypes.node]),
  rightIcon: PropTypes.oneOfType([PropTypes.element, PropTypes.elementType, PropTypes.node]),
  disabled: PropTypes.bool,
  to: PropTypes.string,
  href: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  fullWidth: PropTypes.bool,
  renderAs: PropTypes.elementType,
};

export default Button;
