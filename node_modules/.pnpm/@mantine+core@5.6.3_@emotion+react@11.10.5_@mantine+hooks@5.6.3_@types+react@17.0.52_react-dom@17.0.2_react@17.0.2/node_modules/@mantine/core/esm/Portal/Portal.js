import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useIsomorphicEffect } from '@mantine/hooks';
import { useComponentDefaultProps, useMantineTheme } from '@mantine/styles';

function Portal(props) {
  const { children, target, className } = useComponentDefaultProps("Portal", {}, props);
  const theme = useMantineTheme();
  const [mounted, setMounted] = useState(false);
  const ref = useRef();
  useIsomorphicEffect(() => {
    setMounted(true);
    ref.current = !target ? document.createElement("div") : typeof target === "string" ? document.querySelector(target) : target;
    if (!target) {
      document.body.appendChild(ref.current);
    }
    return () => {
      !target && document.body.removeChild(ref.current);
    };
  }, [target]);
  if (!mounted) {
    return null;
  }
  return createPortal(/* @__PURE__ */ React.createElement("div", {
    className,
    dir: theme.dir
  }, children), ref.current);
}
Portal.displayName = "@mantine/core/Portal";

export { Portal };
//# sourceMappingURL=Portal.js.map
