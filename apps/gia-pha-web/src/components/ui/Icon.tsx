"use client";

import { type LucideProps, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconProps extends LucideProps {
  icon: LucideIcon;
}

/**
 * Heritage Cloud icon wrapper — sets project-wide defaults:
 * - size 18 (matches text-base line-height)
 * - strokeWidth 1.5 (matches gold border line weight)
 * - shrink-0 (prevents squishing in flex layouts)
 *
 * Usage:
 *   import { Flame } from "lucide-react";
 *   <Icon icon={Flame} className="text-antique-gold" />
 */
export default function Icon({
  icon: IconComponent,
  className,
  size = 18,
  strokeWidth = 1.5,
  ...props
}: IconProps) {
  return (
    <IconComponent
      className={cn("shrink-0", className)}
      size={size}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}
