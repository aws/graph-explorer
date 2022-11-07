import { cx } from "@emotion/css";
import isObject from "lodash/isObject";
import {
  Children,
  CSSProperties,
  forwardRef,
  MouseEventHandler,
  PropsWithChildren,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { CustomArrowProps } from "react-slick";
import { Navigation, Pagination } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  PaginationOptions,
  Swiper as SwiperClass,
  SwiperOptions,
} from "swiper/types";
import { useWithTheme, withClassNamePrefix } from "../../core";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";
import { defaultStyles, navArrowsStyles } from "./Carousel.styles";

export interface CarouselProps {
  className?: string;
  classNamePrefix?: string;
  centerMode?: boolean;
  pagination?: PaginationOptions;
  draggable?: boolean;
  effect?: SwiperOptions["effect"];
  nextArrow?: JSX.Element;
  onInit?(): void;
  prevArrow?: JSX.Element;
  slidesToShow?: number;
  swipe?: boolean;
  variableWidth?: boolean;
}

const PrevArrow = forwardRef<
  HTMLDivElement,
  {
    className?: string;
    style?: CSSProperties;
    onClick?: MouseEventHandler<any> | undefined;
    classNamePrefix?: string;
  }
>(({ className, onClick, style, classNamePrefix = "ft" }, ref) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const stylesWithTheme = useWithTheme();

  return (
    <div
      ref={ref}
      className={cx(
        stylesWithTheme(navArrowsStyles),
        pfx("carousel-nav-arrow")
      )}
    >
      <ChevronLeftIcon
        className={cx(className)}
        style={{ ...style }}
        onClick={onClick}
      />
    </div>
  );
});

const NextArrow = forwardRef<
  HTMLDivElement,
  CustomArrowProps & { classNamePrefix?: string }
>(({ className, onClick, style, classNamePrefix = "ft" }, ref) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const stylesWithTheme = useWithTheme();

  return (
    <div
      ref={ref}
      className={cx(
        stylesWithTheme(navArrowsStyles),
        pfx("carousel-nav-arrow")
      )}
    >
      <ChevronRightIcon
        className={cx(className)}
        style={{ ...style }}
        onClick={onClick}
      />
    </div>
  );
});

export type CarouselRef = SwiperClass | undefined;

export const Carousel = forwardRef<
  CarouselRef,
  PropsWithChildren<CarouselProps>
>(
  (
    {
      children,
      effect,
      className,
      draggable = true,
      slidesToShow = 5,
      centerMode,
      pagination,
      ...props
    },
    ref
  ) => {
    const nextRef = useRef<HTMLDivElement | null>(null);
    const prevRef = useRef<HTMLDivElement | null>(null);

    const childrenComputed = useMemo(
      () =>
        Children.map(children, (child, index) => {
          return (
            <SwiperSlide
              style={props.variableWidth ? { width: "auto" } : {}}
              key={index}
            >
              {child}
            </SwiperSlide>
          );
        }),
      [children, props.variableWidth]
    );

    const stylesWithTheme = useWithTheme();

    const [swiper, setSwiper] = useState<SwiperClass | undefined>(undefined);
    useImperativeHandle(ref, () => swiper, [swiper]);

    if (!childrenComputed) {
      return null;
    }

    return (
      <div className={cx(stylesWithTheme(defaultStyles), className)}>
        <PrevArrow ref={prevRef} />
        <Swiper
          onSwiper={setSwiper}
          allowTouchMove={draggable}
          pagination={pagination}
          effect={effect}
          centeredSlides={centerMode}
          spaceBetween={8}
          slidesPerView={props.variableWidth ? "auto" : slidesToShow}
          navigation={{
            nextEl: nextRef.current,
            prevEl: prevRef.current,
          }}
          onInit={swiper => {
            // run this on next tick
            setTimeout(() => {
              if (
                swiper.params.navigation &&
                isObject(swiper.params.navigation)
              ) {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
              }
            }, 0);
            setTimeout(() => {
              swiper.updateSize();
              swiper.updateSlides();
              swiper.navigation.update();
            }, 1000);
          }}
          modules={[Pagination, Navigation]}
        >
          {childrenComputed}
        </Swiper>
        <NextArrow ref={nextRef} />
      </div>
    );
  }
);

export default Carousel;
