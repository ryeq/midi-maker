
import type { SVGProps } from 'react';

export function CanbLogo(props: SVGProps<SVGSVGElement>) {
  const fillColor = props.fill || '#D90082'; // Magenta

  return (
    <svg
      viewBox="0 0 300 80" // Width: C(80)+A(70)+N(80)+B(70)=300 (spacing=0)
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CANB Logo"
      {...props}
      fill={fillColor}
    >
      {/* C shape: 3/4 circle (missing top-right quadrant) */}
      {/* Centered at (40,40) within an 80x80 box. Radius 40. */}
      <g transform="translate(0,0)">
        <path d="M 40,0 A 40,40 0 0 0 0,40 L 40,40 Z" />
        <path d="M 0,40 A 40,40 0 0 0 40,80 L 40,40 Z" />
        <path d="M 40,80 A 40,40 0 0 0 80,40 L 40,40 Z" />
      </g>

      {/* A shape: Triangle */}
      {/* In an 70x80 box. Base from (0,80) to (70,80), peak at (35,0) relative to its group */}
      <g transform="translate(80,0)"> {/* C_width(80) */}
        <path d="M 0,80 L 70,80 L 35,0 Z" /> {/* Full height triangle */}
      </g>

      {/* N shape: Semi-ellipse on top, V-shape for bottom. rx=40, ry=40. V-point at (40,80) */}
      {/* In an 80x80 box. */}
      <g transform="translate(150,0)"> {/* C_width(80) + A_width(70) */}
        <path d="M 0,40 A 40,40 0 0 1 80,40 L 40,80 Z" /> {/* V-point at y=80 */}
      </g>

      {/* B shape: Spine on left, two rightward curves. */}
      {/* Spine width 20. Bottom lobe rx=50,ry=20. Top lobe rx=45,ry=20. Total height 80. Each lobe height 40. */}
      {/* Total width of B approx 70. */}
      <g transform="translate(230,0)"> {/* C_width(80) + A_width(70) + N_width(80) */}
        {/* Corrected sweep-flag from 0 to 1 for rightward curves */}
        <path d="M0,0 V80 H20 A50,20 0 0 1 20,40 A45,20 0 0 1 20,0 H0 Z" />
      </g>
    </svg>
  );
}
