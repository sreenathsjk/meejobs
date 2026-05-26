import React from "react";

interface MeeJobsLogoProps {
  className?: string; // Optional class for layout and centering
  darkBg?: boolean;   // Whether it is displayed on a dark background (white text for "jobs")
}

export default function MeeJobsLogo({ className = "", darkBg = false }: MeeJobsLogoProps) {
  return (
    <div 
      className={`flex flex-col select-none ${className}`} 
      id="meejobs-logo-container"
    >
      <div className="flex items-baseline justify-center sm:justify-start leading-none">
        <span className="font-display font-extrabold text-[28px] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FFAE19] to-[#FF6D00]">
          Mee
        </span>
        <span className={`font-display font-bold text-[28px] tracking-tight ${darkBg ? "text-white" : "text-slate-800"}`}>
          jobs
        </span>
      </div>
    </div>
  );
}
