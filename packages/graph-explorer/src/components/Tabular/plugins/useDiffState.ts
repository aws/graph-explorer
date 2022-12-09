/**
 * This plugin checks difference between filters
 */
import { ensurePluginOrder } from "react-table";
import type { ActionType, Hooks, TableInstance, TableState } from "react-table";

const pluginName = "useDiffState";

export type UseDiffState = {
  diff: {
    filters: boolean;
  };
};

const initialState: UseDiffState = {
  diff: {
    filters: false,
  },
};

const reducer = <T extends object>(
  newState: TableState<T>,
  action: ActionType,
  previousState?: TableState<T>
) => {
  if (action.type === "init") {
    return {
      ...newState,
      ...initialState,
    };
  }

  if (action.type === "setFilter" && previousState?.filters) {
    // Short circuit to avoid loops
    // If the number of filters changes, means that any filter change
    if (newState.filters.length !== previousState.filters.length) {
      return {
        ...newState,
        diff: {
          ...newState.diff,
          filters: true,
        },
      };
    }

    // If any filter has been updated, should be triggered too
    const hasChanged = newState.filters.some(newFilter => {
      return previousState.filters.find(
        prevFilter =>
          prevFilter.id === newFilter.id && prevFilter.value !== newFilter.value
      );
    });

    if (hasChanged) {
      return {
        ...newState,
        diff: {
          ...newState.diff,
          filters: true,
        },
      };
    }
  }

  // resetPage is triggered every change of state: filters, sorts, ...
  if (action.type === "resetPage") {
    return {
      ...newState,
      diff: {
        filters: false,
      },
    };
  }

  return newState;
};

const useDiffState = <T extends object>(hooks: Hooks<T>) => {
  hooks.useInstance.push(useInstance);
  hooks.stateReducers.push(reducer);
};

useDiffState.pluginName = pluginName;

function useInstance<T extends object>(instance: TableInstance<T>) {
  const { plugins } = instance;

  ensurePluginOrder(plugins, ["useFilters", "useGlobalFilter"], pluginName);
}

export default useDiffState;
