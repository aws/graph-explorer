import { BaseTabularTheme } from "./Tabular.model";

const baseTheme: BaseTabularTheme = {
  background: "inherit",
  border: "inherit",
  color: "solid 1px #d3d3d3",
  header: {
    background: "#f8f8f8",
    color: "inherit",
    border: "solid 1px #d3d3d3",
    padding: "4px 8px 0",
    minHeight: "auto",
    resizing: {
      background: "#e0e0e0",
      color: "inherit",
      border: "dashed 1px #d3d3d3",
    },
    label: {
      fontWeight: "600",
      minHeight: "32px",
      margin: "0",
      padding: "0",
    },
    filter: {
      minHeight: "38px",
      margin: "4px 0 0 0",
      padding: "0",
    },
    sorter: {
      color: "inherit",
      opacity: "1",
      hover: {
        color: "inherit",
        opacity: "0.5",
      },
    },
    controls: {
      background: "#f8f8f8",
      color: "inherit",
      border: "solid 1px #d3d3d3",
      padding: "4px 8px",
    },
  },
  row: {
    background: "inherit",
    color: "inherit",
    border: "solid 1px #d3d3d3",
    minHeight: "32px",
    hover: {
      background: "rgba(238,238,238,0.5)",
      color: "inherit",
    },
    selectable: {
      background: "inherit",
      color: "inherit",
      hover: {
        background: "rgba(18, 142, 229, 0.5)",
        color: "inherit",
      },
    },
    selected: {
      background: "rgba(18, 142, 229, 0.25)",
      color: "inherit",
    },
    resizing: {
      background: "inherit",
      color: "inherit",
      border: "dashed 1px #d3d3d3",
    },
  },
  footer: {
    controls: {
      background: "#fff",
      color: "inherit",
      border: "solid 1px #d3d3d3",
      padding: "4px 8px",
    },
  },
};

export default baseTheme;
