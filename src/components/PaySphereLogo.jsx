import React from 'react';

/**
 * PaySphere Brand Logo Component
 * A modern, clean, user-friendly sphere & node geometric logo
 */
export const PaySphereLogo = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-14 h-14"
  }[size] || "w-10 h-10";

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="psGradient1" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" />
            <stop offset="0.5" stopColor="#4F46E5" />
            <stop offset="1" stopColor="#3730A3" />
          </linearGradient>
          <linearGradient id="psGradient2" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" stopOpacity="0.9" />
            <stop offset="1" stopColor="#818CF8" stopOpacity="0.4" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer glowing ambient ring */}
        <circle cx="24" cy="24" r="21" stroke="url(#psGradient2)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />

        {/* Main modern sphere emblem */}
        <circle cx="24" cy="24" r="18" fill="url(#psGradient1)" />

        {/* Inner dynamic orbital rings representing payroll & management flow */}
        <ellipse cx="24" cy="24" rx="14" ry="7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" transform="rotate(-30 24 24)" opacity="0.85" />
        <ellipse cx="24" cy="24" rx="14" ry="7" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" transform="rotate(30 24 24)" opacity="0.95" />

        {/* Central core node */}
        <circle cx="24" cy="24" r="3.5" fill="#FFFFFF" />
      </svg>
    </div>
  );
};

export default PaySphereLogo;
