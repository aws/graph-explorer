import { cx } from "@emotion/css";
import type { ReactNode } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import styles from "./BannerCard.styles";

export type BannerCardListProps = {
  classNamePrefix?: "ft";
  options: { key?: string; value?: ReactNode }[];
};

const BannerCardList = ({
  options,
  classNamePrefix = "ft",
}: BannerCardListProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);
  return (
    <div className={styleWithTheme(styles.listContent(classNamePrefix))}>
      {options.map((option, index) => (
        <div key={index}>
          {option.key}{" "}
          <span
            className={cx(pfx("capitalized-bold"), {
              [pfx("primary-color")]: index % 2 !== 0,
            })}
          >
            {option.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default BannerCardList;
