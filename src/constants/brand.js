/* White-label settings, read at build time. A normal build is ARSDEEN; a client's copy sets these, e.g.
     VITE_BRAND_NAME="Acme Logistics"          name in the sidebar, page title, footer and login page
     VITE_BRAND_LOGO=/brand/logo.png           wide logo (any background - it sits on a white chip)
     VITE_BRAND_MARK=/brand/mark.png           square mark for the collapsed sidebar and the browser tab
     VITE_BRAND_COLOR=#ff785a                  accent colour (buttons, links, active menu item)
     VITE_BRAND_TAGLINE="..."                  headline on the login page
     VITE_BRAND_POINTS="One|Two|Three"         three short lines under it
     VITE_HIDE_PAGES=/crm/content,/crm/portal  menu items to hide for this client */
const env = import.meta.env;
const list = (v, sep) => String(v || "").split(sep).map((s) => s.trim()).filter(Boolean);

export const BRAND = {
  name: env.VITE_BRAND_NAME || "ARSDEEN",
  logo: env.VITE_BRAND_LOGO || "",
  mark: env.VITE_BRAND_MARK || "",
  color: env.VITE_BRAND_COLOR || "",
  tagline: env.VITE_BRAND_TAGLINE || "",
  points: list(env.VITE_BRAND_POINTS, "|"),
  hiddenPages: list(env.VITE_HIDE_PAGES, ","),
};
export const isWhiteLabel = !!env.VITE_BRAND_NAME;
export const pageHidden = (path) => BRAND.hiddenPages.some((p) => path === p || path.startsWith(`${p}/`));

const hexToHsl = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return null;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const h = d === 0 ? 0 : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [Math.round(((h * 60) + 360) % 360), Math.round(s * 100), Math.round(l * 100)];
};

// Re-colour the CRM, set the tab title and icon. Called once at start-up.
export const applyBrand = () => {
  document.title = `${BRAND.name} CRM`;
  const hsl = hexToHsl(BRAND.color);
  if (hsl) {
    const [h, s, l] = hsl;
    const style = document.createElement("style");
    style.textContent = `:root{--brand:${h} ${s}% ${l}%;--brand-soft:${h} 100% 96%;--ring:${h} ${s}% ${l}%}.dark{--brand:${h} ${s}% ${Math.min(l + 6, 72)}%;--brand-soft:${h} 40% 16%;--ring:${h} ${s}% ${l}%}`;
    document.head.appendChild(style);
  }
  if (BRAND.mark) {
    document.querySelectorAll('link[rel="shortcut icon"]').forEach((el) => el.remove());
    const icon = Object.assign(document.createElement("link"), { rel: "icon", href: BRAND.mark });
    document.head.appendChild(icon);
  }
};
