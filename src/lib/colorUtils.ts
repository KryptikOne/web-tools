// Color conversion utilities for OKLCH color space

export const ColorUtils = {
  // OKLCH to RGB
  oklchToRgb(l: number, c: number, h: number): [number, number, number] {
    // Convert OKLCH to OKLab
    const hRad = (h * Math.PI) / 180;
    const a = c * Math.cos(hRad);
    const b = c * Math.sin(hRad);

    // OKLab to Linear RGB
    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.291485548 * b;

    const l3 = l_ * l_ * l_;
    const m3 = m_ * m_ * m_;
    const s3 = s_ * s_ * s_;

    let r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    let b_ = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

    // Apply gamma correction
    r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
    g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
    b_ = b_ > 0.0031308 ? 1.055 * Math.pow(b_, 1 / 2.4) - 0.055 : 12.92 * b_;

    // Clamp values
    r = Math.max(0, Math.min(1, r));
    g = Math.max(0, Math.min(1, g));
    b_ = Math.max(0, Math.min(1, b_));

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b_ * 255)];
  },

  // RGB to OKLCH
  rgbToOklch(r: number, g: number, b: number): [number, number, number] {
    // Normalize RGB values
    r = r / 255;
    g = g / 255;
    b = b / 255;

    // Remove gamma correction
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    // Linear RGB to OKLab
    const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

    const l_ = Math.cbrt(l);
    const m_ = Math.cbrt(m);
    const s_ = Math.cbrt(s);

    const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
    const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
    const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

    // Convert to OKLCH
    const C = Math.sqrt(a * a + b_ * b_);
    let H = (Math.atan2(b_, a) * 180) / Math.PI;
    if (H < 0) H += 360;

    return [L, C, H];
  },

  // RGB to HEX
  rgbToHex(r: number, g: number, b: number): string {
    return (
      '#' +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
  },

  // HEX to RGB (supports #RGB, #RRGGBB, #RGBA, #RRGGBBAA formats)
  hexToRgb(hex: string): [number, number, number] | null {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Handle 3-digit hex (#RGB)
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }

    // Handle 4-digit hex (#RGBA)
    if (hex.length === 4) {
      hex = hex.split('').map(char => char + char).join('');
    }

    // Extract RGB values (ignore alpha channel if present)
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : null;
  },

  // RGB to HSL
  rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  },

  // HSL to RGB
  hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  },

  // Parse any color format
  parseColor(input: string): { type: string; rgb: [number, number, number]; alpha?: number } | null {
    input = input.trim();

    // HEX (with optional alpha channel)
    if (input.startsWith('#')) {
      const hex = input.replace(/^#/, '');
      let cleanHex = hex;
      let alpha = 1;

      // Handle 4-digit hex (#RGBA)
      if (hex.length === 4) {
        cleanHex = hex.slice(0, 3);
        alpha = parseInt(hex[3] + hex[3], 16) / 255;
      }

      // Handle 8-digit hex (#RRGGBBAA)
      if (hex.length === 8) {
        cleanHex = hex.slice(0, 6);
        alpha = parseInt(hex.slice(6, 8), 16) / 255;
      }

      const rgb = this.hexToRgb('#' + cleanHex);
      if (rgb) return { type: 'hex', rgb, alpha };
    }

    // RGB/RGBA
    const rgbMatch = input.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
    if (rgbMatch) {
      return {
        type: 'rgb',
        rgb: [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])],
        alpha: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1,
      };
    }

    // HSL/HSLA
    const hslMatch = input.match(/hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*(?:,\s*([\d.]+))?\s*\)/i);
    if (hslMatch) {
      const rgb = this.hslToRgb(parseInt(hslMatch[1]), parseInt(hslMatch[2]), parseInt(hslMatch[3]));
      return {
        type: 'hsl',
        rgb,
        alpha: hslMatch[4] ? parseFloat(hslMatch[4]) : 1,
      };
    }

    // OKLCH - Updated regex to be more flexible
    // Matches: oklch(65.0% 0.180 250.0) or oklch(0.65 0.18 250) or oklch(65% 0.18 250 / 1)
    const oklchMatch = input.match(/oklch\s*\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/i);
    if (oklchMatch) {
      // Check if first value has % or is > 1, treat as percentage
      let l = parseFloat(oklchMatch[1]);
      if (oklchMatch[1].includes('%') || l > 1) {
        l = l / 100;
      }
      const c = parseFloat(oklchMatch[2]);
      const h = parseFloat(oklchMatch[3]);
      const rgb = this.oklchToRgb(l, c, h);
      return {
        type: 'oklch',
        rgb,
        alpha: oklchMatch[4] ? parseFloat(oklchMatch[4]) : 1,
      };
    }

    return null;
  },
};
