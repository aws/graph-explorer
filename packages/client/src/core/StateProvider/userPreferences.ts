import { atom } from "recoil";
import localForageEffect from "./localForageEffect";

export type VertexPreferences = {
  type: string;
  /**
   * Color overwrite for vertex
   */
  color?: string;
  /**
   * Label overwrite for vertex
   */
  displayLabel?: string;
  /**
   * Icon overwrite for vertex
   */
  iconUrl?: string;
  /**
   * Icon overwrite for vertex
   */
  iconImageType?: string;
  /**
   * Vertex attribute to be used as label
   */
  displayNameAttribute?: string;
  /**
   * Vertex attribute to be used as description
   */
  longDisplayNameAttribute?: string;
};

export type UserPreferences = {
  layout: {
    activeToggles: Set<string>;
    activeSidebarItem: string | null;
  };
  styling: {
    vertices?: Array<VertexPreferences>;
  };
};

export const userStylingAtom = atom<UserPreferences["styling"]>({
  key: "user-styling",
  default: {},
  effects: [localForageEffect()],
});

export const userLayoutAtom = atom<UserPreferences["layout"]>({
  key: "user-layout",
  default: {
    activeToggles: new Set(["graph-viewer", "table-view"]),
    activeSidebarItem: null,
  },
  effects: [localForageEffect()],
});
