"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import * as Tooltip from "@radix-ui/react-tooltip";
import { LuGitBranchPlus, LuLayoutList, LuMap, LuSettings, LuChartColumn, LuGrip } from "react-icons/lu";

const MAGNIFICATION = 58;
const DISTANCE = 120;
const BASE_SIZE = 38;

function DockIcon({ mouseX, children, label, onClick }: { mouseX: ReturnType<typeof useMotionValue<number>>; children: React.ReactNode; label: string; onClick?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-DISTANCE, 0, DISTANCE], [BASE_SIZE, MAGNIFICATION, BASE_SIZE]);

  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger asChild>
        <motion.div
          ref={ref}
          style={{ width }}
          onClick={onClick}
          className="aspect-square flex items-center justify-center rounded-full cursor-pointer hover:bg-white/10 transition-colors duration-200 text-white"
        >
          {children}
        </motion.div>
      </Tooltip.Trigger>
      <Tooltip.Content sideOffset={12} className="bg-black/80 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm border border-white/10">
        {label}
        <Tooltip.Arrow className="fill-black/80" />
      </Tooltip.Content>
    </Tooltip.Root>
  );
}

export default function Dock({ onAddFlight, onToggleView, view }: { onAddFlight: () => void; onToggleView: () => void; view: "map" | "list" }) {
  const mouseX = useMotionValue(Infinity);

  return (
    <Tooltip.Provider>
      <nav className="absolute  z-10 bottom-6 left-1/2 -translate-x-1/2">
        <motion.div
          onMouseMove={(e) => mouseX.set(e.pageX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          className="h-[60px] p-2 flex items-center gap-1 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md"
        >
          <DockIcon mouseX={mouseX} label="Add flight" onClick={onAddFlight}>
            <LuGitBranchPlus size={20} />
          </DockIcon>

          <DockIcon mouseX={mouseX} label={view === "map" ? "List flights" : "Map"} onClick={onToggleView}>
            {view === "map" ? <LuLayoutList size={20} /> : <LuMap size={20} />}
          </DockIcon>

          <DockIcon mouseX={mouseX} label="Statistics">
            <LuChartColumn size={20} />
          </DockIcon>

          <div className="w-px h-6 bg-white/20 mx-1" />

          <DockIcon mouseX={mouseX} label="Settings">
            <LuSettings size={20} />
          </DockIcon>
        </motion.div>
      </nav>
    </Tooltip.Provider>
  );
}
