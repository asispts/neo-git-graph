import * as fs from "node:fs";
import * as path from "node:path";

import { l10n } from "vscode";

let _extensionPath: string | undefined;

export function initL10n(extensionPath: string) {
  _extensionPath = extensionPath;
}

/**
 * Cache for loaded translation files
 */
let englishTranslations: Record<string, string> | null = null;

/**
 * Load English (base) translations from bundle.l10n.json
 */
function loadEnglishTranslations(translationPath: string): Record<string, string> {
  if (englishTranslations !== null) {
    return englishTranslations;
  }

  try {
    const l10nPath = path.join(translationPath, "bundle.l10n.json");
    const content = fs.readFileSync(l10nPath, "utf8");
    englishTranslations = JSON.parse(content);
    return englishTranslations as Record<string, string>;
  } catch (error) {
    console.error("Failed to load English translations:", error);
    englishTranslations = {};
    return englishTranslations;
  }
}

/**
 * Translate with fallback to English
 *
 * If the translation is missing in the current language, it will fall back to English.
 *
 * @param key - Translation key
 * @param args - Optional arguments for string interpolation
 * @returns Translated string
 */
export function t(key: string, ...args: Array<string | number | boolean>): string;
export function t(key: string, args: Record<string, string | number | boolean>): string;
export function t(
  key: string,
  ...args: Array<string | number | boolean | Record<string, string | number | boolean>>
): string {
  // Try to get translation from current locale
  let result: string;

  if (args.length === 1 && typeof args[0] === "object" && !Array.isArray(args[0])) {
    result = l10n.t(key, args[0]);
  } else {
    result = l10n.t(key, ...(args as Array<string | number | boolean>));
  }

  if (result !== key) return result;

  const translationPath = l10n.uri?.fsPath
    ? path.dirname(l10n.uri.fsPath)
    : _extensionPath
      ? path.join(_extensionPath, "l10n")
      : undefined;
  if (!translationPath) return result;
  const enTranslations = loadEnglishTranslations(translationPath);
  const fallback = enTranslations[key];
  if (!fallback) return result;

  if (args.length === 1 && typeof args[0] === "object") {
    return interpolate(fallback, args[0]);
  } else if (args.length > 0) {
    return interpolate(fallback, args as Array<string | number | boolean>);
  }
  return fallback;
}

/**
 * Simple string interpolation for fallback translations
 * Supports both positional ({0}, {1}) and named ({name}) placeholders
 */
function interpolate(
  template: string,
  args: Record<string, string | number | boolean> | Array<string | number | boolean>
): string {
  if (Array.isArray(args)) {
    // Positional arguments: {0}, {1}, etc.
    return template.replace(/\{(\d+)\}/g, (_, index) => {
      const value = args[parseInt(index, 10)];
      return value !== undefined ? String(value) : `{${index}}`;
    });
  } else {
    // Named arguments: {name}, {value}, etc.
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      const value = args[key];
      return value !== undefined ? String(value) : `{${key}}`;
    });
  }
}
