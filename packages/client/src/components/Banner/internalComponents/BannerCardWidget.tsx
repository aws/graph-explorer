import type { ReactNode } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import styles from "./BannerCard.styles";

export type BannerCardWidgetProps = {
  label: string;
  value: ReactNode;
  startAdornment?: ReactNode;
  classNamePrefix?: "ft";
  color?: string;
};

const BannerCardWidget = ({
  label,
  value,
  color,
  startAdornment,
  classNamePrefix = "ft",
}: BannerCardWidgetProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  return (
    <div className={styleWithTheme(styles.widgetContent(classNamePrefix))}>
      <div className={pfx("value")}>
        <span className={pfx("card-start-adornment")}> {startAdornment}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div className={pfx("label")}>{label}</div>
    </div>
  );
};

export default BannerCardWidget;
