import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { build, preview } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const artifacts = join(root, "artifacts");
mkdirSync(artifacts, { recursive: true });
execFileSync(npm, ["run", "build"], { cwd: root, stdio: "inherit" });
const [packed] = JSON.parse(
  execFileSync(
    npm,
    ["pack", "--ignore-scripts", "--json", "--pack-destination", artifacts],
    {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    },
  ),
);
assert.equal(packed.name, "@erme2/feature-flag-evaluator");
assert.ok(packed.files.some((file) => file.path === "dist/index.d.ts"));
assert.ok(
  packed.files.some((file) => file.path === "dist/feature-flag-evaluator.js"),
);
assert.ok(
  packed.files.every(
    (file) =>
      ["package.json", "README.md", "LICENSE"].includes(file.path) ||
      /^dist\/[^/]+\.(js|d\.ts)$/.test(file.path),
  ),
);
const archive = resolve(artifacts, packed.filename);

// Install a real archive in independent hosts, without source aliases or symlinks.
for (const reactVersion of ["18", "19"]) {
  const consumer = realpathSync(mkdtempSync(join(tmpdir(), "ffe-consumer-")));
  let server;
  let browser;
  try {
    writeFileSync(
      join(consumer, "package.json"),
      JSON.stringify({
        private: true,
        type: "module",
      }),
    );
    execFileSync(
      npm,
      [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        archive,
        `react@${reactVersion}`,
        `react-dom@${reactVersion}`,
        `@types/react@${reactVersion}`,
        `@types/react-dom@${reactVersion}`,
      ],
      { cwd: consumer, stdio: "inherit" },
    );
    const installed = JSON.parse(
      readFileSync(
        join(
          consumer,
          "node_modules/@erme2/feature-flag-evaluator/package.json",
        ),
        "utf8",
      ),
    );
    assert.deepEqual(Object.keys(installed.exports), ["."]);
    writeFileSync(
      join(consumer, "index.html"),
      '<div id="root"></div><script type="module" src="/main.tsx"></script>',
    );
    writeFileSync(
      join(consumer, "main.tsx"),
      `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { FeatureFlagEvaluator, evaluate, isFlags, type Flag }
        from '@erme2/feature-flag-evaluator';
      const flags: Flag[] = [{ key: 'smoke', enabled: true,
        rules: [{ id: 'default', kind: 'default', variant: 'control' }] }];
      if (!isFlags(flags) || evaluate(flags[0], {}).variant !== 'control') {
        throw new Error('Public evaluator exports failed');
      }
      createRoot(document.getElementById('root')!).render(
        <FeatureFlagEvaluator initialFlags={flags} onChange={next => {
          document.body.dataset.variant = next[0].rules[0].variant;
        }} />
      );
    `,
    );
    execFileSync(
      process.execPath,
      [
        join(root, "node_modules/typescript/bin/tsc"),
        "--noEmit",
        "--strict",
        "--skipLibCheck",
        "--target",
        "ES2022",
        "--module",
        "ESNext",
        "--moduleResolution",
        "Bundler",
        "--jsx",
        "react-jsx",
        "main.tsx",
      ],
      { cwd: consumer, stdio: "inherit" },
    );
    await build({ root: consumer, configFile: false, logLevel: "warn" });
    server = await preview({
      root: consumer,
      configFile: false,
      logLevel: "warn",
      preview: { host: "127.0.0.1", port: 0 },
    });
    const address = server.httpServer.address();
    assert.ok(address && typeof address !== "string");
    browser = await chromium.launch({ channel: "chrome" });
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.getByRole("button", { name: "Edit rule 1" }).click();
    await page.getByLabel("Returned variant").fill("installed");
    await page.getByRole("button", { name: "Save rule" }).click();
    assert.equal(
      await page.locator("body").getAttribute("data-variant"),
      "installed",
    );
    assert.match(await page.locator(".ffe-result").innerText(), /installed/);
    assert.equal(await page.evaluate(() => document.styleSheets.length), 0);
    assert.deepEqual(errors, []);
    console.log(
      `Packed widget passed: React ${reactVersion}, types, production build, editing, callback, no CSS.`,
    );
  } finally {
    await browser?.close();
    if (server) await new Promise((done) => server.httpServer.close(done));
    rmSync(consumer, { recursive: true, force: true });
  }
}
console.log(`Verified archive: ${archive}`);
