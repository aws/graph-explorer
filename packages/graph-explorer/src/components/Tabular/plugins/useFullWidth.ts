/**
 * This small plugin only fixes the combination of "useResizeColumns" and "useFlexLayout" hooks.
 * When useResizeColumns is disabled and fullWidth is enabled,
 * useResizeColumns deletes the flexGrow CSS property.
 *
 * Here, we ensure that "useFullWidth" plugin is run after those plugins to fix the styling issue.
 */

import { ensurePluginOrder } from "react-table";
import type { Hooks, TableInstance } from "react-table";

const pluginName = "useFullWidth";

const useFullWidth = <T extends object>(hooks: Hooks<T>) => {
  hooks.getHeaderProps.push((headerProps, { column }) => {
    const flexGrow = column.width || column.totalWidth || 1;

    if (column.maxWidth) {
      return headerProps;
    }

    return {
      ...headerProps,
      style: {
        ...headerProps.style,
        flex: `${flexGrow} 0 auto`,
      },
    };
  });
  hooks.getCellProps.push((cellProps, { cell: { column } }) => {
    const flexGrow = column.width || column.totalWidth || 1;

    if (column.maxWidth) {
      return cellProps;
    }

    return {
      ...cellProps,
      style: {
        ...cellProps.style,
        flex: `${flexGrow} 0 auto`,
      },
    };
  });
  hooks.useInstance.push(useInstance);
};

useFullWidth.pluginName = pluginName;

function useInstance<T extends object>(instance: TableInstance<T>) {
  const { plugins } = instance;

  ensurePluginOrder(plugins, ["useResizeColumns", "useFlexLayout"], pluginName);
}

export default useFullWidth;
