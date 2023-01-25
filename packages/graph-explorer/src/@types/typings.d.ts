import "rc-dock";

declare global {
  /**
   * Main level and all nested will be optional
   */
  type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
  };

  /**
   * Main level and all nested will be required
   */
  type DeepRequired<T> = {
    [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
  };

  type ObjectMapWithAugmentedType<T, R> = { [K in keyof T]: T[K] & R };

  type ValueOf<T> = T[keyof T];

  /**
   * Use
   * interface Interface {
   *   propA?: string
   *   propB?: {
   *     subPropsBPropA?: number
   *   }
   * }
   *
   * PartiallyRequired<Interface, "propB"> is equivalent to
   * interface Interface {
   *   propA?: string
   *   propB: { <-- This is now required but not its inner props
   *     subPropsBPropA?: number
   *   }
   * }
   */
  type PartiallyRequired<T, Keys extends keyof T> = T & Required<Pick<T, Keys>>;

  /**
   * Use
   * interface Interface {
   *   propA?: string
   *   propB?: {
   *     subPropsBPropA?: number
   *   }
   * }
   *
   * PartiallyDeepRequired<Interface, "propB"> is equivalent to
   * interface Interface {
   *   propA?: string <-- This continues be optional
   *   propB: { <-- This is now required
   *     subPropsBPropA: number <-- Also its inner props
   *   }
   * }
   */
  type PartiallyDeepRequired<T, Keys extends keyof T> = T &
    DeepRequired<Pick<T, Keys>>;

  type ValuesOf<T extends any[]> = T[number];

  /**
   * This allows to create actions types for reducers.
   * Example:
   * ReducerAction<"action_name", { id: string }>
   */
  type ReducerAction<TType, TPayload> = TPayload extends undefined
    ? {
        type: TType;
        payload?: TPayload;
      }
    : {
        type: TType;
        payload: TPayload;
      };

  type ReducerActionDispatch<TState, TAction> = (
    state: TState,
    action: TAction
  ) => TState;

  interface PromiseWithCancel<T> extends Promise<T> {
    cancel?: () => void;
  }

  /** Graph explorer version extracted from package.json */
  const __GRAPH_EXP_VERSION__: string;
}

declare module "rc-dock" {
  /**
   * TabBase allow to add custom props
   */
  export interface TabBase {
    /**
     * id must be unique
     */
    id?: string;

    /** @deprecated - this is used by old dashboard */
    widgetName?: string;

    type: string;
  }
}
export {};
