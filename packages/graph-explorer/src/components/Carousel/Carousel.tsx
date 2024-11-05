import { cn } from "@/utils";
import isObject from "lodash/isObject";
import {
  Children,
  CSSProperties,
  forwardRef,
  MouseEventHandler,
  PropsWithChildren,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { CustomArrowProps } from "react-slick";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  PaginationOptions,
  Swiper as SwiperClass,
  SwiperOptions,
} from "swiper/types";
import { useWithTheme } from "@/core";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { navArrowsStyles } from "./Carousel.styles";

export interface CarouselProps {
  className?: string;
  centerMode?: boolean;
  pagination?: PaginationOptions;
  draggable?: boolean;
  effect?: SwiperOptions["effect"];
  nextArrow?: JSX.Element;
  onInit?(): void;
  prevArrow?: JSX.Element;
  slidesToShow?: number;
  swipe?: boolean;
}

const PrevArrow = forwardRef<
  HTMLDivElement,
  {
    className?: string;
    style?: CSSProperties;
    onClick?: MouseEventHandler<any> | undefined;
  }
>(({ className, onClick, style }, ref) => {
  const stylesWithTheme = useWithTheme();

  return (
    <div
      ref={ref}
      className={cn(stylesWithTheme(navArrowsStyles), "carousel-nav-arrow")}
    >
      <ChevronLeftIcon
        className={cn(className)}
        style={{ ...style }}
        onClick={onClick}
      />
    </div>
  );
});

const NextArrow = forwardRef<HTMLDivElement, CustomArrowProps>(
  ({ className, onClick, style }, ref) => {
    const stylesWithTheme = useWithTheme();

    return (
      <div
        ref={ref}
        className={cn(stylesWithTheme(navArrowsStyles), "carousel-nav-arrow")}
      >
        <ChevronRightIcon
          className={cn(className)}
          style={{ ...style }}
          onClick={onClick}
        />
      </div>
    );
  }
);

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
    },
    ref
  ) => {
    const nextRef = useRef<HTMLDivElement | null>(null);
    const prevRef = useRef<HTMLDivElement | null>(null);

    const childrenComputed = useMemo(
      () =>
        Children.map(children, (child, index) => {
          return (
            <SwiperSlide className="w-full" key={index}>
              {child}
            </SwiperSlide>
          );
        }),
      [children]
    );

    const [swiper, setSwiper] = useState<SwiperClass | undefined>(undefined);
    useImperativeHandle(ref, () => swiper, [swiper]);

    const [_, startTransition] = useTransition();
    const onInit = useCallback((swiper: SwiperClass) => {
      // run this on next tick
      startTransition(() => {
        if (swiper.params.navigation && isObject(swiper.params.navigation)) {
          swiper.params.navigation.prevEl = prevRef.current;
          swiper.params.navigation.nextEl = nextRef.current;
        }
      });
      startTransition(() => {
        swiper.updateSize();
        swiper.updateSlides();
        swiper.navigation.update();
      });
    }, []);

    if (!childrenComputed) {
      return null;
    }

    return (
      <div className={cn("flex", className)}>
        <PrevArrow ref={prevRef} />
        <Swiper
          onSwiper={setSwiper}
          allowTouchMove={draggable}
          pagination={pagination}
          effect={effect}
          centeredSlides={centerMode}
          spaceBetween={8}
          slidesPerView={slidesToShow}
          navigation={{
            nextEl: nextRef.current,
            prevEl: prevRef.current,
          }}
          onInit={onInit}
          modules={[Pagination, Navigation]}
          className="w-[320px] overflow-y-auto"
        >
          {childrenComputed}
        </Swiper>
        <NextArrow ref={nextRef} />
      </div>
    );
  }
);

export default Carousel;
