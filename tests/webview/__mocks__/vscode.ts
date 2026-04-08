import * as fs from "node:fs";
import * as path from "node:path";

// Load English translations from bundle.l10n.json
const l10nPath = path.resolve(__dirname, "../../../l10n/bundle.l10n.json");
const translations: Record<string, string> = JSON.parse(fs.readFileSync(l10nPath, "utf8"));

export const l10n = {
  t: (
    key: string,
    ...args: Array<string | number | boolean | Record<string, string | number | boolean>>
  ): string => {
    const template = translations[key] || key;

    // Handle object arguments (named parameters)
    if (args.length === 1 && typeof args[0] === "object" && !Array.isArray(args[0])) {
      return template.replace(/\{(\w+)\}/g, (_, name: string) => {
        const value = (args[0] as Record<string, string | number | boolean>)[name];
        return value !== undefined ? String(value) : `{${name}}`;
      });
    }

    // Handle positional arguments {0}, {1}, etc.
    if (args.length > 0) {
      return template.replace(/\{(\d+)\}/g, (_, index) => {
        const value = args[parseInt(index, 10)];
        return value !== undefined ? String(value) : `{${index}}`;
      });
    }

    return template;
  },
  uri: undefined
};
