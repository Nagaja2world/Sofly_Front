// src/components/profile/illustrations.tsx
// 인라인 SVG 일러스트. props: size, style, className

import React from 'react';

interface IlloProps {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

export function PlaneIllo({ size = 120, style, className }: IlloProps) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 200 140" style={style} className={className} aria-hidden>
      <ellipse cx="40" cy="40" rx="20" ry="10" fill="#dbe6ee" opacity="0.9" />
      <ellipse cx="55" cy="35" rx="14" ry="8"  fill="#dbe6ee" opacity="0.9" />
      <path d="M30,90 Q80,50 170,80" fill="none" stroke="#bfae6b" strokeWidth="1.4" strokeDasharray="3 4" strokeLinecap="round" opacity="0.5" />
      <g transform="translate(95,55) rotate(-12)">
        <rect x="0" y="0" width="80" height="22" rx="11" fill="#f5d15a" stroke="#2b2b2b" strokeWidth="1.4" />
        <path d="M80,2 L94,11 L80,20 Z" fill="#f5d15a" stroke="#2b2b2b" strokeWidth="1.4" />
        <path d="M2,0 L-8,-12 L8,0 Z" fill="#a0c1d5" stroke="#2b2b2b" strokeWidth="1.4" />
        <path d="M30,18 L20,38 L55,30 Z" fill="#a0c1d5" stroke="#2b2b2b" strokeWidth="1.4" strokeLinejoin="round" />
        {[22, 34, 46, 58].map((cx) => (
          <circle key={cx} cx={cx} cy={11} r={3} fill="#fcf9ef" stroke="#2b2b2b" strokeWidth="1.1" />
        ))}
      </g>
    </svg>
  );
}

export function ButterflyIllo({ size = 60, style, className }: IlloProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" style={style} className={className} aria-hidden>
      <g transform="translate(30,30)">
        <ellipse cx="0" cy="0" rx="1.6" ry="11" fill="#2b2b2b" />
        <path d="M0,-8 C-18,-22 -22,-2 -2,0 Z"  fill="#f5d15a" stroke="#2b2b2b" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M0,-8 C18,-22 22,-2 2,0 Z"     fill="#f5d15a" stroke="#2b2b2b" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M0,2 C-14,4 -16,18 -2,8 Z"     fill="#a0c1d5" stroke="#2b2b2b" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M0,2 C14,4 16,18 2,8 Z"        fill="#a0c1d5" stroke="#2b2b2b" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="-9" cy="-10" r="1.4" fill="#2b2b2b" />
        <circle cx="9"  cy="-10" r="1.4" fill="#2b2b2b" />
        <path d="M-1,-10 C-3,-16 -7,-18 -8,-20" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M1,-10  C3,-16  7,-18  8,-20"  fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function FlowersIllo({ size = 110, style, className }: IlloProps) {
  const blossoms: [number, number, number][] = [
    [55, 30, 9], [42, 38, 7], [68, 38, 7],
    [50, 22, 6], [62, 22, 6], [56, 14, 5],
  ];
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 110 130" style={style} className={className} aria-hidden>
      <path d="M55,130 C55,90 50,80 55,40" fill="none" stroke="#7fa890" strokeWidth="2" />
      <path d="M55,90 C45,80 40,75 35,72" fill="none" stroke="#7fa890" strokeWidth="1.6" />
      <path d="M55,75 C65,70 70,65 78,62" fill="none" stroke="#7fa890" strokeWidth="1.6" />
      <ellipse cx="32" cy="70" rx="8" ry="3.5" fill="#c6dccb" stroke="#7fa890" strokeWidth="1" transform="rotate(-30 32 70)" />
      <ellipse cx="80" cy="60" rx="8" ry="3.5" fill="#c6dccb" stroke="#7fa890" strokeWidth="1" transform="rotate(30 80 60)" />
      {blossoms.map(([cx, cy, r], i) => (
        <g key={i}>
          {[0, 72, 144, 216, 288].map((a) => {
            const rad = (a * Math.PI) / 180;
            return (
              <ellipse key={a}
                cx={cx + Math.cos(rad) * r * 0.6}
                cy={cy + Math.sin(rad) * r * 0.6}
                rx={r * 0.5} ry={r * 0.7}
                fill="#f5d15a" stroke="#bfae6b" strokeWidth="0.7"
                transform={`rotate(${a} ${cx} ${cy})`}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={r * 0.35} fill="#caa12d" />
        </g>
      ))}
    </svg>
  );
}

export function TreesIllo({ size = 130, style, className }: IlloProps) {
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 130 110" style={style} className={className} aria-hidden>
      <ellipse cx="40" cy="50" rx="28" ry="36" fill="#f5d15a" stroke="#bfae6b" strokeWidth="1" />
      <ellipse cx="42" cy="45" rx="14" ry="20" fill="#fef4cc" opacity="0.6" />
      <rect x="36" y="80" width="8" height="22" rx="2" fill="#7a5a3a" />
      <ellipse cx="92" cy="60" rx="20" ry="26" fill="#a0c1d5" stroke="#6e9bb6" strokeWidth="1" />
      <rect x="89" y="80" width="6" height="22" rx="2" fill="#7a5a3a" />
    </svg>
  );
}
