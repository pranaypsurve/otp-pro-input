/** Parse a CSS color to #rrggbb for color inputs, or return fallback. */
export function toHexColor(value: string, fallback = '#6366f1'): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const [, r, g, b] = value.match(/^#(.)(.)(.)$/) ?? [];
    if (r && g && b) return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}
