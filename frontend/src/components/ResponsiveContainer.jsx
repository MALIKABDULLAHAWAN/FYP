import React from 'react';
import './ResponsiveContainer.css';

/**
 * ResponsiveContainer Component
 * 
 * Provides responsive layout with:
 * - Breakpoint support (mobile, tablet, desktop)
 * - Column layout system (1 column mobile, 2 tablet, 3+ desktop)
 * - Responsive padding and margins
 * - Responsive font size scaling
 */
export function ResponsiveContainer({
  children,
  columns = 'auto',
  gap = 'md',
  padding = 'md',
  maxWidth = 'full',
  centered = false,
  className = '',
  ...props
}) {
  const containerClasses = [
    'responsive-container',
    `columns-${columns}`,
    `gap-${gap}`,
    `padding-${padding}`,
    `max-width-${maxWidth}`,
    centered && 'centered',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} {...props}>
      {children}
    </div>
  );
}

/**
 * ResponsiveGrid Component
 * Grid layout with responsive columns
 */
export function ResponsiveGrid({
  children,
  columns = 'auto',
  gap = 'md',
  className = '',
  ...props
}) {
  const gridClasses = [
    'responsive-grid',
    `grid-columns-${columns}`,
    `gap-${gap}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
}

/**
 * ResponsiveRow Component
 * Flex row with responsive wrapping
 */
export function ResponsiveRow({
  children,
  gap = 'md',
  align = 'center',
  justify = 'flex-start',
  wrap = true,
  className = '',
  ...props
}) {
  const rowClasses = [
    'responsive-row',
    `gap-${gap}`,
    `align-${align}`,
    `justify-${justify}`,
    wrap && 'wrap',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rowClasses} {...props}>
      {children}
    </div>
  );
}

/**
 * ResponsiveColumn Component
 * Flex column with responsive sizing
 */
export function ResponsiveColumn({
  children,
  gap = 'md',
  align = 'stretch',
  justify = 'flex-start',
  flex = 1,
  className = '',
  ...props
}) {
  const columnClasses = [
    'responsive-column',
    `gap-${gap}`,
    `align-${align}`,
    `justify-${justify}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={columnClasses}
      style={{ flex }}
      {...props}
    >
      {children}
    </div>
  );
}

export default ResponsiveContainer;
