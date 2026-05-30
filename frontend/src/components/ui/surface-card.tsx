import type { ReactNode } from "react";

import type { NavGroupAccent } from "@/lib/navigation-config";
import {
  premiumCard,
  premiumCardHover,
  surfaceCard,
  surfaceCardElevated,
  surfaceCardHeader,
} from "@/lib/ui-theme";

type SurfaceCardProps = {
  children: ReactNode;
  header?: ReactNode;
  accent?: NavGroupAccent;
  elevated?: boolean;
  premium?: boolean;
  hover?: boolean;
  className?: string;
  bodyClassName?: string;
};

export function SurfaceCard({
  children,
  header,
  accent = "emerald",
  elevated = false,
  premium = false,
  hover = false,
  className,
  bodyClassName,
}: SurfaceCardProps) {
  const cardClass = premium
    ? `${premiumCard} ${hover ? premiumCardHover : ""}`
    : elevated
      ? surfaceCardElevated
      : surfaceCard;

  return (
    <div className={[cardClass, className].filter(Boolean).join(" ")}>
      {header ? (
        <div className={surfaceCardHeader(accent)}>{header}</div>
      ) : null}
      <div className={bodyClassName ?? (header ? "p-5" : "p-5")}>{children}</div>
    </div>
  );
}
