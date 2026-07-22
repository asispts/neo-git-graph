/**
 * Check l10n files for missing translations and parameter consistency
 * Compares all translation files against the base bundle.l10n.json and package.nls.json
 */

const fs = require("node:fs");
const path = require("node:path");

const L10N_DIR = path.join(__dirname, "../l10n");
const BASE_FILE = "bundle.l10n.json";
const ROOT_DIR = path.join(__dirname, "..");
const PACKAGE_NLS_BASE = "package.nls.json";

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

function checkFileSet(baseDir, baseFileName, filePrefix, sectionTitle, type) {
  const basePath = path.join(baseDir, baseFileName);
  const baseTranslations = loadJson(basePath);

  if (!baseTranslations) {
    console.error(`Failed to load base file: ${baseFileName}`);
    return { hasIssues: true, coverageStats: [] };
  }

  const baseKeys = Object.keys(baseTranslations);
  console.log(`\n${sectionTitle}`);
  console.log(`📚 Base file (${baseFileName}): ${baseKeys.length} keys\n`);

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
  const bundleResult = checkFileSet(
    L10N_DIR,
    BASE_FILE,
    "bundle.l10n.",
    "=== Checking bundle.l10n.* files ===",
    "bundle"
  );

  const packageResult = checkFileSet(
    ROOT_DIR,
    PACKAGE_NLS_BASE,
    "package.nls.",
    "=== Checking package.nls.* files ===",
    "package"
  );

  printCoverageSummary([...bundleResult.coverageStats, ...packageResult.coverageStats]);

  const hasIssues = bundleResult.hasIssues || packageResult.hasIssues;

  if (hasIssues) {
    console.log("⚠️  Translation issues found\n");
    process.exit(1);
  } else {
    console.log("✅ All translations are complete\n");
  }
}

checkTranslations();
