import type { ReactNode } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import styles from "./BannerCard.styles";

export type BannerCardFlatProps = {
  classNamePrefix?: "ft";
  title: string;
  subtitle?: string;
  value: ReactNode;
  color?: string;
  variant?: "info" | "success" | "error" | "warning";
  onClick?(): void;
};

const BannerCardFlat = ({
  title,
  subtitle,
  value,
  color,
  classNamePrefix = "ft",
  variant = "info",
}: BannerCardFlatProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  return (
    <div
      className={styleWithTheme(styles.contentNumber(classNamePrefix, variant))}
    >
      <div className={pfx("value")}>
        <span style={{ color }}>{value}</span>
      </div>
      <div className={pfx("widget-content")}>
        <div className={pfx("title")}>{title}</div>
        <div className={pfx("subtitle")}>{subtitle}</div>
      </div>
    </div>
  );
};

export default BannerCardFlat;
