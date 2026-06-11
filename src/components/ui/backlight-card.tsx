import React from 'react';
import { cn } from '../../lib/utils';

interface BacklightProps {
  children: React.ReactNode;
  /** How much to blur the backlight glow (px). Default: 40 */
  blur?: number;
  /** Backlight colour – any CSS color. Default: indigo/purple mix */
  color?: string;
  /** Size of the backlight orb relative to container. Default: 80% */
  size?: string;
  className?: string;
}

/**
 * Backlight
 *
 * Magic UI-compatible Backlight component.
 * Renders a blurred, coloured glow *behind* the children, creating the effect
 * of a light source shining from underneath the card — exactly as shown in the
 * Magic UI demo (BacklightVideoDemo).
 *
 * Usage:
 *   <Backlight blur={40} color="rgba(99,102,241,0.6)">
 *     <YourCard />
 *   </Backlight>
 */
export function Backlight({
  children,
  blur = 40,
  color = 'rgba(99,102,241,0.55)',
  size = '80%',
  className,
}: BacklightProps) {
  return (
    <div className={cn('relative', className)}>
      {/* The actual backlight — blurred glow placed BEHIND children */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto"
        style={{
          height: size,
          width: size,
          left: '50%',
          transform: 'translateX(-50%)',
          background: color,
          filter: `blur(${blur}px)`,
          borderRadius: '50%',
          zIndex: 0,
        }}
      />
      {/* Children sit above the glow */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
