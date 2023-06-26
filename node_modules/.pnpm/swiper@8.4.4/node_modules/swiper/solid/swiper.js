import { template as _$template } from "solid-js/web";
import { className as _$className } from "solid-js/web";
import { effect as _$effect } from "solid-js/web";
import { createComponent as _$createComponent } from "solid-js/web";
import { insert as _$insert } from "solid-js/web";
import { memo as _$memo } from "solid-js/web";
import { spread as _$spread } from "solid-js/web";

const _tmpl$ = /*#__PURE__*/_$template(`<div class="swiper-wrapper"></div>`, 2),
      _tmpl$2 = /*#__PURE__*/_$template(`<div class="swiper-button-prev"></div>`, 2),
      _tmpl$3 = /*#__PURE__*/_$template(`<div class="swiper-button-next"></div>`, 2),
      _tmpl$4 = /*#__PURE__*/_$template(`<div class="swiper-scrollbar"></div>`, 2),
      _tmpl$5 = /*#__PURE__*/_$template(`<div class="swiper-pagination"></div>`, 2),
      _tmpl$6 = /*#__PURE__*/_$template(`<div></div>`, 2);

import { createEffect, createMemo, createSignal, onCleanup, onMount, Show, splitProps, children } from 'solid-js';
import SwiperCore from 'swiper';
import { SwiperContext } from './context.js';
import { getChangedParams } from '../components-shared/get-changed-params.js';
import { getChildren } from './get-children.js';
import { getParams } from '../components-shared/get-params.js';
import { calcLoopedSlides, renderLoop } from './loop.js';
import { mountSwiper } from '../components-shared/mount-swiper.js';
import { updateSwiper } from '../components-shared/update-swiper.js';
import { extend, needsNavigation, needsPagination, needsScrollbar, uniqueClasses } from '../components-shared/utils.js';
import { renderVirtual } from './virtual.js';
import { updateOnVirtualData } from '../components-shared/update-on-virtual-data.js';

const Swiper = props => {
  let eventsAssigned = false;
  const [containerClasses, setContainerClasses] = createSignal('swiper');
  const [virtualData, setVirtualData] = createSignal(null);
  const [, setBreakpointChanged] = createSignal(false); // The variables bellow are mofied by SolidJS and can't be const

  let initializedRef = false; // eslint-disable-line prefer-const

  let swiperElRef = null; // eslint-disable-line prefer-const

  let swiperRef = null; // eslint-disable-line prefer-const

  let oldPassedParamsRef = null; // eslint-disable-line prefer-const

  let oldSlides = null; // eslint-disable-line prefer-const

  let nextElRef = null; // eslint-disable-line prefer-const

  let prevElRef = null; // eslint-disable-line prefer-const

  let paginationElRef = null; // eslint-disable-line prefer-const

  let scrollbarElRef = null; // eslint-disable-line prefer-const

  const [local, rest] = splitProps(props, ['children', 'class', 'onSwiper', 'ref', 'tag', 'wrapperTag']);
  const params = createMemo(() => getParams(rest));
  const slidesSlots = children(() => getChildren(local.children));

  const onBeforeBreakpoint = () => {
    setBreakpointChanged(state => !state);
  };

  Object.assign(params().params.on, {
    _containerClasses(swiper, classes) {
      setContainerClasses(classes);
    }

  });

  const initSwiper = () => {
    // init swiper
    Object.assign(params().params.on, params().events);
    eventsAssigned = true;
    swiperRef = new SwiperCore(params().params);

    swiperRef.loopCreate = () => {};

    swiperRef.loopDestroy = () => {};

    if (params().params.loop) {
      swiperRef.loopedSlides = calcLoopedSlides(slidesSlots().slides, params().params);
    }

    if (swiperRef.virtual && swiperRef.params.virtual.enabled) {
      swiperRef.virtual.slides = slidesSlots().slides;
      const extendWith = {
        cache: false,
        slides: slidesSlots().slides,
        renderExternal: data => {
          setVirtualData(data);
        },
        renderExternalUpdate: true
      };
      extend(swiperRef.params.virtual, extendWith);
      extend(swiperRef.originalParams.virtual, extendWith);
    }
  };

  if (!swiperElRef) {
    initSwiper();
  } // Listen for breakpoints change


  if (swiperRef) {
    swiperRef.on('_beforeBreakpoint', onBeforeBreakpoint);
  }

  const attachEvents = () => {
    if (eventsAssigned || !params().events || !swiperRef) return;
    Object.keys(params().events).forEach(eventName => {
      swiperRef.on(eventName, params().events[eventName]);
    });
  };

  const detachEvents = () => {
    if (!params().events || !swiperRef) return;
    Object.keys(params().events).forEach(eventName => {
      swiperRef.off(eventName, params().events[eventName]);
    });
  };

  onCleanup(() => {
    if (swiperRef) swiperRef.off('_beforeBreakpoint', onBeforeBreakpoint);
  }); // set initialized flag

  createEffect(() => {
    if (!initializedRef && swiperRef) {
      swiperRef.emitSlidesClasses();
      initializedRef = true;
    }
  }); // mount swiper

  onMount(() => {
    if (local.ref) {
      if (typeof local.ref === 'function') {
        local.ref(swiperElRef);
      } else {
        local.ref = swiperElRef;
      }
    }

    if (!swiperElRef) return;

    if (swiperRef.destroyed) {
      initSwiper();
    }

    mountSwiper({
      el: swiperElRef,
      nextEl: nextElRef,
      prevEl: prevElRef,
      paginationEl: paginationElRef,
      scrollbarEl: scrollbarElRef,
      swiper: swiperRef
    }, params().params);
    if (local.onSwiper) local.onSwiper(swiperRef);
  });
  onCleanup(() => {
    if (swiperRef && !swiperRef.destroyed) {
      swiperRef.destroy(true, false);
    }
  }); // watch for params change

  createEffect(() => {
    attachEvents();
    const {
      passedParams
    } = params();
    const changedParams = getChangedParams(passedParams, oldPassedParamsRef, slidesSlots().slides, oldSlides, c => c.key);
    oldPassedParamsRef = passedParams;
    oldSlides = slidesSlots().slides;

    if (changedParams.length && swiperRef && !swiperRef.destroyed) {
      updateSwiper({
        swiper: swiperRef,
        slides: slidesSlots().slides,
        passedParams,
        changedParams,
        nextEl: nextElRef,
        prevEl: prevElRef,
        scrollbarEl: scrollbarElRef,
        paginationEl: paginationElRef
      });
    }

    onCleanup(detachEvents);
  }); // update on virtual update

  createEffect(() => {
    updateOnVirtualData(swiperRef);
    setTimeout(() => {
      updateOnVirtualData(swiperRef);
    });
  }); // bypass swiper instance to slides

  function renderSlides() {
    if (params().params.virtual) {
      return renderVirtual(swiperRef, slidesSlots().slides, virtualData());
    }

    if (!params().params.loop || swiperRef && swiperRef.destroyed) {
      return slidesSlots().slides;
    }

    return renderLoop(swiperRef, slidesSlots().slides, params().params);
  }
  /* eslint-disable react/react-in-jsx-scope */

  /* eslint-disable react/no-unknown-property */


  return (() => {
    const _el$ = _tmpl$6.cloneNode(true);

    const _ref$ = swiperElRef;
    typeof _ref$ === "function" ? _ref$(_el$) : swiperElRef = _el$;

    _$spread(_el$, () => params().rest, false, true);

    _$insert(_el$, _$createComponent(SwiperContext.Provider, {
      value: swiperRef,

      get children() {
        return [_$memo(() => slidesSlots().slots['container-start']), (() => {
          const _el$2 = _tmpl$.cloneNode(true);

          _$insert(_el$2, () => slidesSlots().slots['wrapper-start'], null);

          _$insert(_el$2, renderSlides, null);

          _$insert(_el$2, () => slidesSlots().slots['wrapper-end'], null);

          return _el$2;
        })(), _$createComponent(Show, {
          get when() {
            return needsNavigation(params().params);
          },

          get children() {
            return [(() => {
              const _el$3 = _tmpl$2.cloneNode(true);

              const _ref$2 = prevElRef;
              typeof _ref$2 === "function" ? _ref$2(_el$3) : prevElRef = _el$3;
              return _el$3;
            })(), (() => {
              const _el$4 = _tmpl$3.cloneNode(true);

              const _ref$3 = nextElRef;
              typeof _ref$3 === "function" ? _ref$3(_el$4) : nextElRef = _el$4;
              return _el$4;
            })()];
          }

        }), _$createComponent(Show, {
          get when() {
            return needsScrollbar(params().params);
          },

          get children() {
            const _el$5 = _tmpl$4.cloneNode(true);

            const _ref$4 = scrollbarElRef;
            typeof _ref$4 === "function" ? _ref$4(_el$5) : scrollbarElRef = _el$5;
            return _el$5;
          }

        }), _$createComponent(Show, {
          get when() {
            return needsPagination(params().params);
          },

          get children() {
            const _el$6 = _tmpl$5.cloneNode(true);

            const _ref$5 = paginationElRef;
            typeof _ref$5 === "function" ? _ref$5(_el$6) : paginationElRef = _el$6;
            return _el$6;
          }

        }), _$memo(() => slidesSlots().slots['container-end'])];
      }

    }));

    _$effect(() => _$className(_el$, uniqueClasses(`${containerClasses()}${local.class ? ` ${local.class}` : ''}`)));

    return _el$;
  })();
};

export { Swiper };