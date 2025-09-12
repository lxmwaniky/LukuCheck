
// src/components/LukuBadge.tsx
'use client';

import { Star, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LukuBadgeProps {
  lukuPoints: number | undefined;
  className?: string;
  size?: 'sm' | 'default'; // sm for header, default for leaderboard
}

export function LukuBadge({ lukuPoints, className, size = 'default' }: LukuBadgeProps) {
  if (lukuPoints === undefined || lukuPoints < 15) {
    return null; // No badge below 15 points (changed from 20)
  }

  let badgeColor = "text-yellow-600 dark:text-yellow-700";
  let fillBadgeColor = "fill-yellow-600 dark:fill-yellow-700";
  let BadgeIcon = Star;
  let title = "Luku Bronze";
  let iconSizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  if (lukuPoints >= 250) {
    badgeColor = "text-sky-500 dark:text-sky-400";
    fillBadgeColor = "fill-sky-500 dark:fill-sky-400";
    BadgeIcon = Award;
    title = "Luku Legend";
  } else if (lukuPoints >= 100) {
    badgeColor = "text-yellow-400 dark:text-yellow-300";
    fillBadgeColor = "fill-yellow-400 dark:fill-yellow-300";
    BadgeIcon = Star;
    title = "Luku Gold";
  } else if (lukuPoints >= 50) {
    badgeColor = "text-slate-400 dark:text-slate-300";
    fillBadgeColor = "fill-slate-400 dark:fill-slate-300";
    BadgeIcon = Star;
    title = "Luku Silver";
  } else if (lukuPoints >= 20) {
    // Keep existing bronze (20-49 points)
    title = "Luku Bronze";
  } else if (lukuPoints >= 15) {
    // New Style Rookie badge (15-19 points)
    badgeColor = "text-emerald-500 dark:text-emerald-400";
    fillBadgeColor = "fill-emerald-500 dark:fill-emerald-400";
    BadgeIcon = Star;
    title = "Style Rookie";
    title = "Luku Gold";
  } else if (lukuPoints >= 50) {
    badgeColor = "text-slate-400 dark:text-slate-300";
    fillBadgeColor = "fill-slate-400 dark:fill-slate-300";
    BadgeIcon = Star;
    title = "Luku Silver";
  }
  // Default is Bronze (20-49 points)

  const tooltipText = `${title} (${lukuPoints} LukuPoints)`;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center cursor-default", className)}>
            <BadgeIcon className={cn(iconSizeClass, badgeColor, fillBadgeColor)} />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
