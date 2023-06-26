import { toRgba } from '../../../utils/to-rgba/to-rgba.js';

function lighten(color, alpha) {
  const { r, g, b, a } = toRgba(color);
  const light = (input) => Math.round(input + (255 - input) * alpha);
  return `rgba(${light(r)}, ${light(g)}, ${light(b)}, ${a})`;
}

export { lighten };
//# sourceMappingURL=lighten.js.map
