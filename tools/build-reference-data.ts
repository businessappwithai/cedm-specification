#!/usr/bin/env bun
/**
 * Build domain/reference-data/*.yaml: the shared geography, money and language lists.
 *
 * Every generated application ships the same Country, StateProvince, City, Currency
 * and Language rows, because they come from the common CEDM specification and not
 * from each application's author. The sources are public registries: pycountry's
 * copies of ISO 3166-1 (countries), ISO 3166-2 (subdivisions), ISO 4217
 * (currencies) and ISO 639 (languages), and geonamescache's GeoNames tables
 * (cities: the national capitals and every city of 750 thousand or more). The
 * checked-in files are the specification; this tool is how they were made, and
 * a run reproduces them byte for byte.
 *
 * The sources are the two packages' published wheels, pinned by version and
 * SHA-256 below: downloaded from PyPI once into a cache, or read from a
 * directory you supply. A wheel whose digest differs is refused — a registry
 * that changed under the same version is not the one these files were built from.
 *
 *     bun tools/build-reference-data.ts                 # download (cached) and build
 *     bun tools/build-reference-data.ts --wheels DIR    # offline: the two .whl files in DIR
 *     bun tools/build-reference-data.ts --check         # exit 1 if a file would change
 *
 * Subdivisions are the first level of the countries in SUBDIVISION_COUNTRIES —
 * the whole ISO table is five thousand rows, and an application that needs another
 * country's states adds them as rows of its own. Cities link to a state or province
 * where the registry says which: the United States and Canada (GeoNames numbers
 * Canada's provinces, and CANADA maps them to ISO 3166-2); elsewhere the state is
 * left empty and the city belongs to its country alone.
 */

import "./lib/cli";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { ROOT } from "./lib/library";
import { fixed } from "./lib/text";
import { Wheel } from "./lib/wheel";
import type { Spec } from "./lib/yaml";

const OUT = path.join(ROOT, "domain", "reference-data");

const SOURCES = {
  pycountry: {
    file: "pycountry-26.2.16-py3-none-any.whl",
    version: "26.2.16",
    sha256: "115c4baf7cceaa30f59a4694d79483c9167dbce7a9de4d3d571c5f3ea77c305a",
  },
  geonamescache: {
    file: "geonamescache-3.0.2-py3-none-any.whl",
    version: "3.0.2",
    sha256: "b830e8942f2d58c7e68782dcf4dff2ffe8c4104a35ee881ed1ad4023cefcdba4",
  },
} as const;

const SUBDIVISION_COUNTRIES = new Set([
  "US",
  "CA",
  "MX",
  "BR",
  "AR",
  "CL",
  "CO",
  "PE",
  "AU",
  "NZ",
  "IN",
  "CN",
  "JP",
  "KR",
  "ID",
  "PH",
  "TH",
  "VN",
  "MY",
  "SG",
  "PK",
  "BD",
  "GB",
  "IE",
  "DE",
  "FR",
  "ES",
  "IT",
  "NL",
  "BE",
  "CH",
  "AT",
  "SE",
  "NO",
  "DK",
  "FI",
  "PL",
  "PT",
  "ZA",
  "NG",
  "KE",
  "EG",
  "AE",
  "SA",
  "TR",
  "RU",
  "UA",
]);
const CANADA: Record<string, string> = {
  "01": "AB",
  "02": "BC",
  "03": "MB",
  "04": "NB",
  "05": "NL",
  "07": "NS",
  "08": "ON",
  "09": "PE",
  "10": "QC",
  "11": "SK",
  "12": "YT",
  "13": "NT",
  "14": "NU",
};
const ZERO = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "ISK",
  "JPY",
  "KMF",
  "KRW",
  "PYG",
  "RWF",
  "UGX",
  "UYI",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);
const THREE = new Set(["BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"]);
const CAPITAL_OR_POPULATION = 750_000;

/* ---- the sources ------------------------------------------------------------ */

async function wheel(name: keyof typeof SOURCES, directory: string | undefined): Promise<Wheel> {
  const source = SOURCES[name];
  const cache =
    directory ??
    path.join(process.env.XDG_CACHE_HOME ?? path.join(homedir(), ".cache"), "cedm-reference-data");
  const file = path.join(cache, source.file);
  if (!existsSync(file)) {
    if (directory) throw new Error(`${file} is missing`);
    const meta = (await (
      await fetch(`https://pypi.org/pypi/${name}/${source.version}/json`)
    ).json()) as Spec;
    const url = meta.urls?.find((u: Spec) => u.filename === source.file)?.url;
    if (!url) throw new Error(`PyPI lists no ${source.file}`);
    console.log(`downloading ${source.file}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    mkdirSync(cache, { recursive: true });
    writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  }
  const bytes = readFileSync(file);
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== source.sha256)
    throw new Error(`${file}: sha256 ${digest}, expected ${source.sha256}`);
  return new Wheel(bytes);
}

/**
 * The values of a JSON object in the order the file lists them. JSON.parse
 * moves integer-like keys (GeoNames ids) to the front in numeric order, and the
 * order decides which of two equally populous places is kept.
 */
function valuesInFileOrder(text: string): Spec[] {
  // A city holds no nested object, so `"<digits>": {` occurs only as a top-level
  // key; prefixing it keeps it a string key, and a string key keeps its place.
  return Object.values(JSON.parse(text.replace(/([{,]\s*)"(\d+)"(\s*:\s*\{)/g, '$1"#$2"$3')));
}

/* ---- the rows --------------------------------------------------------------- */

/** Order by code point, as the files have always been sorted. */
const byCodePoint = (a: string, b: string) => {
  const x = Array.from(a);
  const y = Array.from(b);
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    const d = (x[i]?.codePointAt(0) ?? 0) - (y[i]?.codePointAt(0) ?? 0);
    if (d) return d;
  }
  return x.length - y.length;
};

/** `Rio de Janeiro` → `RIO-DE-JANEIRO`; accents folded, anything else dropped. */
function slug(name: string): string {
  const plain = name.normalize("NFKD").replace(/[\u0080-\uffff]/g, "");
  return (
    plain
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "CITY"
  );
}

/** Four decimals, ties to even on the exact value; a whole number written as one. */
const coordinate = (value: number) => Number(fixed(value, 4)) + 0;

/** One row, as a single-line JSON object with `, ` and `: ` between its parts. */
const rowText = (row: Record<string, unknown>) =>
  `{${Object.entries(row)
    .map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`)
    .join(", ")}}`;

function render(
  entity: string,
  key: string,
  source: string,
  rows: Array<Record<string, unknown>>
): string {
  const lines = [
    `# ${entity} — reference data of the common CEDM specification.`,
    `# Source: ${source}`,
    "# Generated by tools/build-reference-data.ts — do not edit; rerun the tool.",
    "referenceData:",
    `  entity: ${entity}`,
    `  key: ${key}`,
    `  count: ${rows.length}`,
    "  rows:",
    ...rows.map((row) => `    - ${rowText(row)}`),
  ];
  return `${lines.join("\n")}\n`;
}

async function build(wheels: string | undefined): Promise<Map<string, string>> {
  const iso = await wheel("pycountry", wheels);
  const geo = await wheel("geonamescache", wheels);
  const db = (file: string, key: string) =>
    JSON.parse(iso.text(`pycountry/databases/${file}`))[key] as Spec[];
  const info = JSON.parse(geo.text("geonamescache/data/countries.json")) as Record<string, Spec>;
  const out = new Map<string, string>();

  const currencies = db("iso4217.json", "4217").sort((a, b) => byCodePoint(a.alpha_3, b.alpha_3));
  out.set(
    "currency",
    render(
      "Currency",
      "code",
      "ISO 4217 (pycountry)",
      currencies.map((c) => ({
        code: c.alpha_3,
        name: c.name,
        decimalPlaces: ZERO.has(c.alpha_3) ? 0 : THREE.has(c.alpha_3) ? 3 : 2,
        status: "ACTIVE",
      }))
    )
  );
  const knownCurrencies = new Set(currencies.map((c) => c.alpha_3));

  const countries = db("iso3166-1.json", "3166-1").sort((a, b) =>
    byCodePoint(a.alpha_2, b.alpha_2)
  );
  out.set(
    "country",
    render(
      "Country",
      "code",
      "ISO 3166-1 (pycountry), GeoNames country info",
      countries.map((c) => {
        const g = info[c.alpha_2] ?? {};
        const row: Record<string, unknown> = {
          code: c.alpha_2,
          alpha3: c.alpha_3,
          numericCode: c.numeric,
          name: c.name,
        };
        if (g.phone) row.phoneCode = String(g.phone).split(",")[0]?.trim();
        if (knownCurrencies.has(g.currencycode)) row.currency = g.currencycode;
        return row;
      })
    )
  );
  const countryCodes = new Set(countries.map((c) => c.alpha_2));

  const languages = db("iso639-3.json", "639-3")
    .filter((l) => "alpha_2" in l)
    .sort((a, b) => byCodePoint(a.alpha_2, b.alpha_2));
  out.set(
    "language",
    render(
      "Language",
      "code",
      "ISO 639-1 (pycountry)",
      languages.map((l) => ({ code: l.alpha_2, name: l.name }))
    )
  );

  const subdivisions = db("iso3166-2.json", "3166-2")
    .filter(
      (s) => !("parent" in s) && SUBDIVISION_COUNTRIES.has(String(s.code).split("-")[0] as string)
    )
    .sort((a, b) => byCodePoint(a.code, b.code));
  out.set(
    "state-province",
    render(
      "StateProvince",
      "code",
      "ISO 3166-2 first level (pycountry)",
      subdivisions.map((s) => ({
        code: s.code,
        name: s.name,
        subdivisionType: s.type,
        country: String(s.code).split("-")[0],
      }))
    )
  );
  const stateCodes = new Set(subdivisions.map((s) => s.code));

  const capitals = new Set(
    Object.entries(info)
      .filter(([, g]) => g.capital)
      .map(([c, g]) => `${c}\u0000${g.capital}`)
  );
  const isCapital = (city: Spec) => capitals.has(`${city.countrycode}\u0000${city.name}`);
  const cities = valuesInFileOrder(geo.text("geonamescache/data/cities15000.json")).filter(
    (city) =>
      countryCodes.has(city.countrycode) &&
      (city.population >= CAPITAL_OR_POPULATION || isCapital(city))
  );
  // Several GeoNames places share a capital's name; the most populous is the capital.
  const best = new Map<string, Spec>();
  for (const city of [...cities].sort((a, b) => b.population - a.population)) {
    const id = `${city.countrycode}\u0000${city.name}`;
    if (!best.has(id)) best.set(id, city);
  }
  const rows = [...best.values()]
    .sort((a, b) => byCodePoint(a.countrycode, b.countrycode) || byCodePoint(a.name, b.name))
    .map((city) => {
      const cc: string = city.countrycode;
      const admin: string = city.admin1code;
      const state =
        cc === "US" ? `US-${admin}` : cc === "CA" && CANADA[admin] ? `CA-${CANADA[admin]}` : null;
      const row: Record<string, unknown> = {
        code: `${cc}-${slug(city.name)}`,
        name: city.name,
        country: cc,
      };
      if (state && stateCodes.has(state)) row.stateProvince = state;
      row.population = city.population;
      // A whole number is written as one (`125`, not `125.0`): the generators read
      // numbers differently and must print the same text.
      row.latitude = coordinate(city.latitude);
      row.longitude = coordinate(city.longitude);
      if (city.timezone) row.timezone = city.timezone;
      if (isCapital(city)) row.isCapital = true;
      return row;
    });
  const codes = new Set<unknown>();
  for (const row of rows) {
    if (codes.has(row.code)) throw new Error(`two cities would share the code ${row.code}`);
    codes.add(row.code);
  }
  out.set(
    "city",
    render(
      "City",
      "code",
      "GeoNames (geonamescache): national capitals and cities of 750 thousand or more",
      rows
    )
  );
  return out;
}

const argv = process.argv.slice(2);
const at = argv.indexOf("--wheels");
let files: Map<string, string>;
try {
  files = await build(at >= 0 ? argv[at + 1] : undefined);
} catch (error) {
  console.error(`build-reference-data: ${error instanceof Error ? error.message : error}`);
  process.exit(2);
}
const check = argv.includes("--check");
let stale = 0;
for (const [name, text] of files) {
  const file = path.join(OUT, `${name}.yaml`);
  const count = text.split("\n").filter((line) => line.startsWith("    - ")).length;
  if (existsSync(file) && readFileSync(file, "utf-8") === text) {
    console.log(`${name}: ${count} rows, unchanged`);
    continue;
  }
  stale++;
  if (check) console.log(`${name}: stale`);
  else {
    mkdirSync(OUT, { recursive: true });
    writeFileSync(file, text);
    console.log(`${name}: ${count} rows written`);
  }
}
process.exit(check && stale ? 1 : 0);
