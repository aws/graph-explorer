import { cx } from "@emotion/css";
import type { PropsWithChildren, ReactElement } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import Card from "../../Card";
import styles from "./BannerCard.styles";
import BannerCardFlat from "./BannerCardFlat";
import BannerCardList from "./BannerCardList";
import BannerCardWidget from "./BannerCardWidget";

export type BannerCardComposition = {
  WidgetContent: typeof BannerCardWidget;
  ListContent: typeof BannerCardList;
  FlatVariant: typeof BannerCardFlat;
};

export type BannerCardProps = {
  classNamePrefix?: string;
  className?: string;
  outlined?: boolean;
  onClick?(): void;
};

export const BannerCard = ({
  className,
  classNamePrefix = "ft",
  outlined = false,
  onClick,
  children,
}: PropsWithChildren<BannerCardProps>): ReactElement => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);
  return (
    <Card
      onClick={onClick}
      className={cx(
        styleWithTheme(styles.bannerCard(classNamePrefix)),
        {
          [pfx("outlined")]: outlined,
          [pfx("clickable")]: !!onClick,
        },
        className
      )}
      elevation={0}
    >
      {children}
    </Card>
  );
};

BannerCard.WidgetContent = BannerCardWidget;
BannerCard.ListContent = BannerCardList;
BannerCard.FlatVariant = BannerCardFlat;

export default BannerCard as ((
  props: PropsWithChildren<BannerCardProps>
) => ReactElement) &
  BannerCardComposition;
