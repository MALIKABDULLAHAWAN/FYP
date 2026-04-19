import React from 'react';
import { useDesignSystem } from '../theme/DesignSystemProvider';
import './ChildFriendlyButton.css';

/**
 * ChildFriendlyButton Component
 * 
 * A child-friendly button with:
 * - Rounded corners (12px border-radius)
 * - Minimum size enforcement (44x44px)
 * - Hover state with subtle scale effect (1.05x)
 * - Focus state with 3px outline
 * - Disabled state styling
 * - Smooth transitions (200ms ease-in-out)
 * - Support for icon + label layout
 */
export function ChildFriendlyButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  type = 'button',
  ariaLabel = null,
  ...props
}) {
  const { designTokens } = useDesignSystem();

  const buttonClasses = [
    'child-friendly-button',
    `variant-${variant}`,
    `size-${size}`,
    fullWidth && 'full-width',
    disabled && 'disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconClasses = [
    'button-icon',
    `icon-position-${iconPosition}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      type={type}
      aria-label={ariaLabel}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className={iconClasses}>{icon}</span>
      )}
      {children && <span className="button-text">{children}</span>}
      {icon && iconPosition === 'right' && (
        <span className={iconClasses}>{icon}</span>
      )}
    </button>
  );
}

export default ChildFriendlyButton;
