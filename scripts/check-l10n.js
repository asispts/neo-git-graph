/**
 * Check l10n files for missing translations and parameter consistency.
 *
 * The source of truth for runtime strings is src/extension/l10n/messages.ts
 * (message ID -> English text; the message ID is the bundle key, the English
 * text is the fallback value).
 *
 * Modes:
 *   node ./scripts/check-l10n.js          check everything (used by `pnpm l10n:check`, CI)
 *   node ./scripts/check-l10n.js --sync   regenerate l10n/bundle.l10n.json from
 *                                         messages.ts first (used by `pnpm l10n:sync`)
 *
 * Checks:
 *   1. l10n/bundle.l10n.json is in sync with messages.ts (drift detection)
 *   2. bundle.l10n.<locale>.json files against the messages-derived base
 *   3. package.nls.<locale>.json files against package.nls.json
 */

const fs = require("node:fs");
const path = require("node:path");

const L10N_DIR = path.join(__dirname, "../l10n");
const BASE_FILE = "bundle.l10n.json";
const ROOT_DIR = path.join(__dirname, "..");
const PACKAGE_NLS_BASE = "package.nls.json";
const MESSAGES_ENTRY = path.join(ROOT_DIR, "src/extension/l10n/messages.ts");
const SYNC_MODE = process.argv.includes("--sync");

/**
 * Load the English messages from src/extension/l10n/messages.ts (pure data, no
 * imports) by bundling it with esbuild and evaluating the CJS output.
 *
 * @returns {Record<string, string>} base map (message ID -> English text),
 *          in messages.ts declaration order
 */
function loadEnglishMessages() {
  const { outputFiles } = require("esbuild").buildSync({
    entryPoints: [MESSAGES_ENTRY],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false
  });
  const mod = { exports: {} };
  new Function("module", "exports", outputFiles[0].text)(mod, mod.exports);

  const baseTranslations = {};
  for (const [id, text] of Object.entries(mod.exports.messages)) {
    baseTranslations[id] = text;
  }
  return baseTranslations;
}

function loadJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Extract placeholders from a translation string
 * Supports formats: {0}, {1}, {variableName}
 *
 * @param {string} text - The translation text
 * @returns {string[]} - Array of found placeholders (sorted for consistent comparison)
 */
function extractPlaceholders(text) {
  if (typeof text !== "string") {
    return [];
  }

  const placeholders = text.match(/\{[^}]+\}/g);
  return placeholders ? placeholders.toSorted() : [];
}

/**
 * Check if two placeholder arrays are equal (both are pre-sorted)
 *
 * @param {string[]} arr1
 * @param {string[]} arr2
 * @returns {boolean}
 */
function placeholdersMatch(arr1, arr2) {
  return arr1.length === arr2.length && arr1.every((p, i) => p === arr2[i]);
}

/**
 * Log a group of issues if any exist.
 *
 * @param {Array<*>} items
 * @param {(count: number) => string} header - returns the header line, given the item count
 * @param {(item: any) => string[]} formatter - returns lines to print per item
 * @returns {boolean} whether any issues were found
 */
function reportIssues(items, header, formatter) {
  if (items.length === 0) {
    return false;
  }

  console.log(header(items.length));
  items.forEach((item) => {
    formatter(item).forEach((line) => console.log(line));
  });
  return true;
}

function checkParameterConsistency(baseTranslations, translations, keys) {
  const paramIssues = [];

  keys.forEach((key) => {
    if (!(key in baseTranslations)) {
      return;
    }

    const basePlaceholders = extractPlaceholders(baseTranslations[key]);
    const translatedPlaceholders = extractPlaceholders(translations[key]);

    if (!placeholdersMatch(basePlaceholders, translatedPlaceholders)) {
      paramIssues.push({
        key,
        base: basePlaceholders,
        translated: translatedPlaceholders,
        baseText: baseTranslations[key],
        translatedText: translations[key]
      });
    }
  });

  return paramIssues;
}

/**
 * Verify that l10n/bundle.l10n.json on disk matches the messages-derived base.
 *
 * @param {Record<string, string>} baseTranslations - messages-derived base map
 *        (message ID -> English text)
 * @returns {boolean} whether any drift was found
 */
function checkBundleDrift(baseTranslations) {
  console.log(`\n=== Checking ${BASE_FILE} against messages.ts ===`);
  console.log(
    `📚 Source of truth (src/extension/l10n/messages.ts): ${Object.keys(baseTranslations).length} unique messages\n`
  );

  const onDisk = loadJson(path.join(L10N_DIR, BASE_FILE));
  if (!onDisk) {
    return true;
  }

  const baseKeys = Object.keys(baseTranslations);
  const diskKeys = Object.keys(onDisk);
  const missing = baseKeys.filter((k) => !(k in onDisk));
  const stale = diskKeys.filter((k) => !(k in baseTranslations));
  const valueMismatch = diskKeys.filter(
    (k) => k in baseTranslations && onDisk[k] !== baseTranslations[k]
  );

  const missingFound = reportIssues(
    missing,
    (count) => `  ⚠️  ${count} message(s) missing from ${BASE_FILE}:`,
    (k) => [`     - ${k}`]
  );
  const staleFound = reportIssues(
    stale,
    (count) => `  ⚠️  ${count} stale key(s) in ${BASE_FILE} not present in messages.ts:`,
    (k) => [`     - ${k}`]
  );
  const mismatchFound = reportIssues(
    valueMismatch,
    (count) => `  ⚠️  ${count} value(s) in the English bundle that differ from messages.ts:`,
    (k) => [`     - ${k}: "${onDisk[k]}" (expected "${baseTranslations[k]}")`]
  );

  if (missingFound || staleFound || mismatchFound) {
    console.log(`  💡 Run \`pnpm l10n:sync\` to regenerate ${BASE_FILE} from messages.ts\n`);
    return true;
  }

  console.log(`  ✅ ${BASE_FILE} is in sync with messages.ts\n`);
  return false;
}

/**
 * Check a set of locale files against a base translation map.
 *
 * @param {string} baseDir - directory containing the locale files
 * @param {string} baseFileName - base file name (excluded from the locale file list)
 * @param {string} filePrefix - locale file prefix, e.g. "bundle.l10n."
 * @param {string} sectionTitle - title printed before the checks
 * @param {string} type - stat type, e.g. "bundle" or "package"
 * @param {Record<string, string>} baseTranslations - base translation map
 * @param {string} baseLabel - label for the base, shown in the output
 */
function checkFileSet(
  baseDir,
  baseFileName,
  filePrefix,
  sectionTitle,
  type,
  baseTranslations,
  baseLabel
) {
  const baseKeys = Object.keys(baseTranslations);
  console.log(`\n${sectionTitle}`);
  console.log(`📚 Base (${baseLabel}): ${baseKeys.length} keys\n`);

  const files = fs
    .readdirSync(baseDir)
    .filter((file) => file.startsWith(filePrefix) && file !== baseFileName)
    .toSorted();

  if (files.length === 0) {
    console.log("✅ No additional translation files found\n");
    return { hasIssues: false, coverageStats: [] };
  }

  let hasIssues = false;
  const coverageStats = [];

  files.forEach((file) => {
    const filePath = path.join(baseDir, file);
    const translations = loadJson(filePath);

    if (!translations) {
      return;
    }

    const keys = Object.keys(translations);
    const missing = baseKeys.filter((k) => !(k in translations));
    const extra = keys.filter((k) => !(k in baseTranslations));
    const locale = file.replace(filePrefix, "").replace(".json", "");

    const coverage =
      baseKeys.length > 0
        ? Math.round(((keys.length - extra.length) / baseKeys.length) * 1000) / 10
        : 0;

    coverageStats.push({
      locale,
      type,
      coverage,
      total: baseKeys.length,
      translated: keys.length - extra.length
    });

    console.log(`🌍 ${locale} (${file}): ${keys.length} keys - Coverage: ${coverage}%`);

    const missingFound = reportIssues(
      missing,
      (count) => `  ⚠️  Missing ${count} translation(s):`,
      (k) => [`     - ${k}: "${baseTranslations[k]}"`]
    );

    const extraFound = reportIssues(
      extra,
      (count) => `  ⚠️  Extra ${count} key(s) not in base:`,
      (k) => [`     - ${k}`]
    );

    const paramIssues = checkParameterConsistency(baseTranslations, translations, keys);
    const paramFound = reportIssues(
      paramIssues,
      (count) => `  ⚠️  Parameter mismatch in ${count} translation(s):`,
      (issue) => [
        `     - ${issue.key}:`,
        `       Base: "${issue.baseText}" -> [${issue.base.join(", ")}]`,
        `       Translation: "${issue.translatedText}" -> [${issue.translated.join(", ")}]`
      ]
    );

    if (missingFound || extraFound || paramFound) {
      hasIssues = true;
    } else {
      console.log(`  ✅ Complete`);
    }

    console.log("");
  });

  return { hasIssues, coverageStats };
}

/**
 * Format a coverage stat as a summary table cell
 *
 * @param {{coverage: number, translated: number, total: number}|undefined} stat
 * @returns {string}
 */
function formatCell(stat) {
  return stat === undefined ? "N/A" : `${stat.coverage}% (${stat.translated}/${stat.total})`;
}

/**
 * Center text within a fixed width
 *
 * @param {string} text
 * @param {number} width
 * @returns {string}
 */
function centerText(text, width) {
  const pad = width - text.length;
  return " ".repeat(Math.floor(pad / 2)) + text + " ".repeat(Math.ceil(pad / 2));
}

function printCoverageSummary(allStats) {
  if (allStats.length === 0) {
    return;
  }

  const localeMap = {};
  allStats.forEach((stat) => {
    localeMap[stat.locale] ??= {};
    localeMap[stat.locale][stat.type] = stat;
  });

  const headers = ["Language", "bundle.l10n.*", "package.nls.*"];
  const rows = Object.keys(localeMap)
    .toSorted()
    .map((locale) => [
      locale,
      formatCell(localeMap[locale].bundle),
      formatCell(localeMap[locale].package)
    ]);

  const widths = headers.map((header, i) =>
    Math.max(header.length, ...rows.map((row) => row[i].length))
  );

  const border = (left, join, right) =>
    left + widths.map((w) => "─".repeat(w + 2)).join(join) + right;

  console.log("\n📊 Coverage Summary by Language:\n");
  console.log(border("┌", "┬", "┐"));
  const headerCells = headers.map((header, i) => centerText(header, widths[i]));
  console.log(`│ ${headerCells.join(" │ ")} │`);
  console.log(border("├", "┼", "┤"));
  rows.forEach(([locale, bundleCov, packageCov]) => {
    const cells = [
      locale.padEnd(widths[0]),
      bundleCov.padStart(widths[1]),
      packageCov.padStart(widths[2])
    ];
    console.log(`│ ${cells.join(" │ ")} │`);
  });
  console.log(border("└", "┴", "┘") + "\n");
}

function checkTranslations() {
  const englishMessages = loadEnglishMessages();

  if (SYNC_MODE) {
    const content = JSON.stringify(englishMessages, null, 2) + "\n";
    fs.writeFileSync(path.join(L10N_DIR, BASE_FILE), content);
    console.log(
      `✍️  Wrote ${BASE_FILE} (${Object.keys(englishMessages).length} keys) from messages.ts`
    );
  }

  const driftIssues = checkBundleDrift(englishMessages);

  const bundleResult = checkFileSet(
    L10N_DIR,
    BASE_FILE,
    "bundle.l10n.",
    "=== Checking bundle.l10n.* files ===",
    "bundle",
    englishMessages,
    "src/extension/l10n/messages.ts"
  );

  const packageBase = loadJson(path.join(ROOT_DIR, PACKAGE_NLS_BASE));
  const packageResult = packageBase
    ? checkFileSet(
        ROOT_DIR,
        PACKAGE_NLS_BASE,
        "package.nls.",
        "=== Checking package.nls.* files ===",
        "package",
        packageBase,
        PACKAGE_NLS_BASE
      )
    : { hasIssues: true, coverageStats: [] };

  printCoverageSummary([...bundleResult.coverageStats, ...packageResult.coverageStats]);

  const hasIssues = driftIssues || bundleResult.hasIssues || packageResult.hasIssues;

  if (hasIssues) {
    console.log("⚠️  Translation issues found\n");
    process.exit(1);
  } else {
    console.log("✅ All translations are complete\n");
  }
}

checkTranslations();
