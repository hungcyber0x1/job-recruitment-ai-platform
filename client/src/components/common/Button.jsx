import PropTypes from 'prop-types';
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-ring',
  {
    variants: {
      variant: {
        primary:
          'border border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/92',
        secondary:
          'border border-border bg-card text-foreground shadow-sm hover:border-primary/20 hover:bg-muted/60',
        outline:
          'border border-border bg-card text-foreground shadow-sm hover:border-primary/20 hover:bg-muted/60',
        ghost:
          'border border-transparent bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        danger: 'border border-danger bg-danger text-white shadow-sm hover:bg-danger/92',
        destructive: 'border border-danger bg-danger text-white shadow-sm hover:bg-danger/92',
        white:
          'border border-border bg-card text-foreground shadow-sm hover:border-primary/20 hover:bg-muted/60',
        glass:
          'border border-border bg-card/80 text-foreground shadow-sm hover:border-primary/20 hover:bg-muted/60',
        accent:
          'border border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/92',
      },
      size: {
        sm: 'h-9 px-3.5 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-5 text-sm',
        xl: 'h-12 px-6 text-sm',
        icon: 'h-10 w-10 p-0',
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

const IconWrapper = ({ icon: Icon, size }) => {
  if (!Icon) return null;
  const iconSize = size === 'sm' ? 16 : size === 'lg' || size === 'xl' ? 20 : 18;

  if (React.isValidElement(Icon)) {
    return React.cloneElement(Icon, {
      size: Icon.props.size || iconSize,
      className: cn('shrink-0', Icon.props.className),
    });
  }

  if (typeof Icon === 'function' || typeof Icon === 'object') {
    const Comp = Icon;
    return <Comp size={iconSize} className="shrink-0" />;
  }
  return <span className="shrink-0">{Icon}</span>;
};

IconWrapper.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.element, PropTypes.elementType, PropTypes.node]),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'icon']),
};

const Button = React.forwardRef(
  (
    {
      children,
      variant,
      size,
      className,
      isLoading: isLoadingProp = false,
      loading, // Destructure to prevent leaking to DOM
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      disabled,
      to,
      href,
      type = 'button',
      fullWidth,
      renderAs,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const isLoading = isLoadingProp || loading;
    const content = (
      <>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          <IconWrapper icon={LeftIcon} size={size} />
        )}
        <span className="min-w-0 text-center">{children}</span>
        {!isLoading && <IconWrapper icon={RightIcon} size={size} />}
      </>
    );

    const classes = cn(buttonVariants({ variant, size, fullWidth }), className);
    const isDisabled = disabled || isLoading;

    // asChild: delegate rendering to the child element via Radix Slot
    if (asChild) {
      return (
        <Slot className={classes} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }

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
  asChild: PropTypes.bool,
  children: PropTypes.node,
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'outline',
    'ghost',
    'danger',
    'destructive',
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
