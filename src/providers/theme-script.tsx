import { isServer } from "solid-js/web";
import type { Component } from "solid-js";

export interface ThemeScriptProps {
  /** Storage key namespace used in localStorage (default: "nikala-theme") */
  storageKey?: string;
  /** Initial default theme mode if no saved preference exists (default: "system") */
  defaultTheme?: "light" | "dark" | "system";
  /** Initial default primary accent color if no saved preference exists */
  defaultAccent?: string;
  /** Initial default border radius if no saved preference exists */
  defaultRadius?: string;
}

/**
 * Pre-hydration inline script executed synchronously before DOM paint to prevent theme flickering (anti-FOUC).
 */
export const ThemeScript: Component<ThemeScriptProps> = (props) => {
  if (!isServer) return null;
  const key = props.storageKey || "nikala-theme";
  const defTheme = props.defaultTheme || "system";
  const defAccent = props.defaultAccent || "";
  const defRadius = props.defaultRadius || "";

  const scriptText = `(function(){try{
  var key = '${key}';
  var mode = localStorage.getItem(key + '-mode') || '${defTheme}';
  var accent = localStorage.getItem(key + '-accent') || '${defAccent}';
  var radius = localStorage.getItem(key + '-radius') || '${defRadius}';

  var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var resolvedDark = mode === 'dark' || (mode === 'system' && isDark);

  var root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolvedDark ? 'dark' : 'light');
  root.style.colorScheme = resolvedDark ? 'dark' : 'light';

  var supportedAccents = ['slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];
  if (supportedAccents.indexOf(accent) !== -1) {
    var foreground = accent === 'amber' || accent === 'yellow' || accent === 'lime'
      ? 'var(--color-black)' : 'var(--color-white)';
    root.style.setProperty('--primary', 'var(--color-' + accent + '-' + (resolvedDark ? '400' : '500') + ')');
    root.style.setProperty('--primary-foreground', foreground);
  }

  if (radius) {
    var radVal = radius.endsWith('rem') ? radius : radius + 'rem';
    root.style.setProperty('--radius', radVal);
  }
}catch(e){}})();`;

  return <script innerHTML={scriptText} />;
};
