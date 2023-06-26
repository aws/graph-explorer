var $4hxXn$react = require("react");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "SSRProvider", () => $29383e587d62412a$export$9f8ac96af4b1b2ae);
$parcel$export(module.exports, "useSSRSafeId", () => $29383e587d62412a$export$619500959fc48b26);
$parcel$export(module.exports, "useIsSSR", () => $29383e587d62412a$export$535bd6ca7f90a273);

// Default context value to use in case there is no SSRProvider. This is fine for
// client-only apps. In order to support multiple copies of React Aria potentially
// being on the page at once, the prefix is set to a random number. SSRProvider
// will reset this to zero for consistency between server and client, so in the
// SSR case multiple copies of React Aria is not supported.
const $29383e587d62412a$var$defaultContext = {
    prefix: String(Math.round(Math.random() * 10000000000)),
    current: 0
};
const $29383e587d62412a$var$SSRContext = /*#__PURE__*/ ($parcel$interopDefault($4hxXn$react)).createContext($29383e587d62412a$var$defaultContext);
function $29383e587d62412a$export$9f8ac96af4b1b2ae(props) {
    let cur = $4hxXn$react.useContext($29383e587d62412a$var$SSRContext);
    let value = $4hxXn$react.useMemo(()=>({
            // If this is the first SSRProvider, start with an empty string prefix, otherwise
            // append and increment the counter.
            prefix: cur === $29383e587d62412a$var$defaultContext ? '' : `${cur.prefix}-${++cur.current}`,
            current: 0
        })
    , [
        cur
    ]);
    return(/*#__PURE__*/ ($parcel$interopDefault($4hxXn$react)).createElement($29383e587d62412a$var$SSRContext.Provider, {
        value: value
    }, props.children));
}
let $29383e587d62412a$var$canUseDOM = Boolean(typeof window !== 'undefined' && window.document && window.document.createElement);
function $29383e587d62412a$export$619500959fc48b26(defaultId) {
    let ctx = $4hxXn$react.useContext($29383e587d62412a$var$SSRContext);
    // If we are rendering in a non-DOM environment, and there's no SSRProvider,
    // provide a warning to hint to the developer to add one.
    if (ctx === $29383e587d62412a$var$defaultContext && !$29383e587d62412a$var$canUseDOM) console.warn('When server rendering, you must wrap your application in an <SSRProvider> to ensure consistent ids are generated between the client and server.');
    return $4hxXn$react.useMemo(()=>defaultId || `react-aria${ctx.prefix}-${++ctx.current}`
    , [
        defaultId
    ]);
}
function $29383e587d62412a$export$535bd6ca7f90a273() {
    let cur = $4hxXn$react.useContext($29383e587d62412a$var$SSRContext);
    let isInSSRContext = cur !== $29383e587d62412a$var$defaultContext;
    let [isSSR, setIsSSR] = $4hxXn$react.useState(isInSSRContext);
    // If on the client, and the component was initially server rendered,
    // then schedule a layout effect to update the component after hydration.
    if (typeof window !== 'undefined' && isInSSRContext) // This if statement technically breaks the rules of hooks, but is safe
    // because the condition never changes after mounting.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    $4hxXn$react.useLayoutEffect(()=>{
        setIsSSR(false);
    }, []);
    return isSSR;
}




//# sourceMappingURL=main.js.map
