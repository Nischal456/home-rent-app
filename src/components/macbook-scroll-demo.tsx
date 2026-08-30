import React from "react";
import { MacbookScroll } from "@/components/ui/macbook-scroll";

export function MacbookScrollDemo() {
  return (
    <div className="w-full overflow-hidden bg-[#F8FAFC]">
      <MacbookScroll
        title={
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-[#0B2863] to-slate-900 text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] block px-4">
            Manage all rent & utility bills <br /> through one premium dashboard.
          </span>
        }
        src="/dashboard.jpeg"
        showGradient={false}
      />
    </div>
  );
}
