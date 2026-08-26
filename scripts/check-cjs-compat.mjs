// Build-time guard against a regression that only shows up in production.
//
// Background: Vercel's Lambda module loader overrides Node's Module._load and
// does NOT implement require()-of-ESM interop, even on Node versions where
// stock Node supports it natively. firebase-admin -> jwks-rsa does
// require('jose'), so if jose resolves to an ESM-only build (v6+ dropped its
// CommonJS export), EVERY admin API route crashes at runtime with
// ERR_REQUIRE_ESM -- while still working perfectly in local dev.
//
// That failure mode is invisible until someone hits a live admin route, so
// this check runs at build time instead. package.json pins jose via
// "overrides"; this fails the build if that pin is ever removed, bumped past
// v5, or silently undone by a dependency update.

import { createRequire } from "module";

const require = createRequire(import.meta.url);

function fail(message) {
  console.error("\n\x1b[31mBUILD BLOCKED: CommonJS compatibility check failed\x1b[0m");
  console.error(message);
  console.error(
    "\nFix: keep the `overrides.jose` pin in package.json at ^5.x (jose 5 ships\n" +
      "a real CommonJS build; jose 6+ is ESM-only). Then run `npm install`.\n"
  );
  process.exit(1);
}

// Resolve jose the same way jwks-rsa does, so we check the copy that actually
// gets loaded at runtime rather than any hoisted top-level one.
let josePkgPath;
try {
  josePkgPath = require.resolve("jose/package.json", {
    paths: [require.resolve("jwks-rsa/package.json")],
  });
} catch {
  // jwks-rsa not installed (firebase-admin removed?) -- nothing to guard.
  console.log("check-cjs-compat: jwks-rsa not present, skipping.");
  process.exit(0);
}

const jose = require(josePkgPath);
const rootExport = jose.exports?.["."];

if (!rootExport || typeof rootExport !== "object") {
  fail(`jose@${jose.version} has no resolvable "." export map.`);
}

if (!rootExport.require) {
  fail(
    `jose@${jose.version} has no CommonJS ("require") export condition.\n` +
      `jwks-rsa calls require('jose'), which will throw ERR_REQUIRE_ESM on Vercel.`
  );
}

// Prove it actually loads, and that the two functions jwks-rsa uses are present.
let loaded;
try {
  loaded = require(require.resolve("jose", { paths: [require.resolve("jwks-rsa/package.json")] }));
} catch (err) {
  fail(`require('jose') threw: ${err.message}`);
}

for (const fn of ["importJWK", "exportSPKI"]) {
  if (typeof loaded[fn] !== "function") {
    fail(`jose@${jose.version} is missing ${fn}(), which jwks-rsa requires.`);
  }
}

console.log(`check-cjs-compat: jose@${jose.version} exposes a working CommonJS build.`);
