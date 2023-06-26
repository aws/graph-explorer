function isMarkFilled({ mark, offset, value }) {
  return typeof offset === "number" ? mark.value >= offset && mark.value <= value : mark.value <= value;
}

export { isMarkFilled };
//# sourceMappingURL=is-mark-filled.js.map
