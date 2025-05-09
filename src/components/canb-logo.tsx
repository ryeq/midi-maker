import type { SVGProps } from 'react';

export function CanbLogo(props: SVGProps<SVGSVGElement>) {
  const fillColor = props.fill || '#D90082'; // Magenta

  return (
    <svg
      viewBox="0 0 330 80" // Width: C(80)+space(10)+A(70)+space(10)+N(80)+space(10)+B(70)=330
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
      {/* In an 80x80 box, actual width 70. Base from (5,70) to (75,70), peak at (40,10) relative to its group */}
      <g transform="translate(90,0)"> {/* 80 (C width) + 10 (space) */}
        <path d="M 2.5,70 L 67.5,70 L 35,10 Z" /> {/* Centered in 70 width space */}
      </g>

      {/* N shape: Semi-ellipse on top, V-shape for bottom. rx=40, ry=40. V-point at (40,70) */}
      {/* In an 80x80 box. */}
      <g transform="translate(170,0)"> {/* 90 (C_offset) + 70 (A_width) + 10 (space) */}
        <path d="M 0,40 A 40,40 0 0 1 80,40 L 40,70 Z" />
      </g>

      {/* B shape: Spine on left, two rightward curves. */}
      {/* Spine width 20. Bottom lobe rx=25, top lobe rx=20. Total height 80. Each lobe height 40. */}
      {/* Total width of B: 20 (spine) + 25 (max_rx) = 45. The logo B is wider. Let's use rx=25, spine=20 making width 45. Scale to 70 later if needed.
          Let's target total width of B to be approx 70 for visual balance.
          Spine 20. rx_top=22, rx_bottom=25. Effective width approx 20 + 25 = 45.
          To make it 70 wide: Spine 20. rx_top=45, rx_bottom=50.
          Path: M0,0 V80 H_spine A_rx_bottom,20 0 0 0 H_spine,40 A_rx_top,20 0 0 0 H_spine,0 H0 Z
      */}
      <g transform="translate(260,0)"> {/* 170 (N_offset) + 80 (N_width) + 10 (space) */}
        <path d="M0,0 V80 H20 A50,20 0 0 0 20,40 A45,20 0 0 0 20,0 H0 Z" />
      </g>
    </svg>
  );
}
