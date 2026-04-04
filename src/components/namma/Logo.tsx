import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  color?: string; // Shield color
  arrowColor?: string; // Arrow color
}

export function Logo({ 
  className = "", 
  size = 32, 
  color = "#E85D1A", 
  arrowColor = "white" 
}: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Shield Path */}
      <path
        d="M12 2L4 5V11C4 16.14 7.41 20.92 12 22C16.59 20.92 20 16.14 20 11V5L12 2Z"
        fill={color}
      />
      
      {/* 3 Modernized Negative Space Arrows */}
      <path
        d="M8.5 16.5L14.5 10.5M14.5 10.5H11.5M14.5 10.5V13.5"
        stroke={arrowColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 13.5L11.5 8.5M11.5 8.5H9.5M11.5 8.5V10.5"
        stroke={arrowColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 18.5L16.5 12.5M16.5 12.5H13.5M16.5 12.5V15.5"
        stroke={arrowColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
