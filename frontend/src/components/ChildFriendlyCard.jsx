import React from 'react';
import './ChildFriendlyCard.css';

/**
 * ChildFriendlyCard Component
 * 
 * A card component with:
 * - 16px border-radius
 * - Box shadow (0 2px 8px rgba(0,0,0,0.1))
 * - Hover lift effect
 * - Flexible content layout
 * - Responsive padding (20px on desktop, 16px on mobile)
 */
export function ChildFriendlyCard({
  children,
  onClick = null,
  className = '',
  interactive = false,
  variant = 'default',
  padding = 'default',
  ...props
}) {
  const cardClasses = [
    'child-friendly-card',
    `variant-${variant}`,
    `padding-${padding}`,
    interactive && 'interactive',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = interactive ? onClick : null;

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      {...props}
    >
      {children}
    </div>
  );
}

export default ChildFriendlyCard;
