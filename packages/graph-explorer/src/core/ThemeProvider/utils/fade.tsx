export default function fade(color: string | undefined, opacity: number) {
  return `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;
}
