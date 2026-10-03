#!/usr/bin/env bun
/**
 * Can a model-declared saga be opened in the Workflow Designer?
 *
 * `buildSagaBpmn` emits no `bpmndi` layout on the stated grounds that bpmn-js
 * lays out a diagram that has none. This checks that claim against the real
 * component: it opens the model-managed workflow and reports whether its steps
 * are visible, and what the canvas did.
 */

import { chromium } from "playwright";

const FRONTEND = "http://localhost:3001";
const BACKEND = "http://localhost:3000";
const SHOTS = ".gstack/qa-reports/screenshots";

const token = await fetch(`${BACKEND}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@admin.com", password: "admin" }),
})
  .then((r) => r.json())
  .then((j: any) => j.token);

const definitions = await fetch(`${BACKEND}/api/workflow`, {
  headers: { Authorization: `Bearer ${token}` },
}).then((r) => r.json());

const managed = (definitions as any[]).find((w) => w.is_model_managed);
if (!managed) {
  console.log("no model-managed workflow to check");
  process.exit(0);
}

console.log(`Model-managed workflow: ${managed.name}`);
console.log(`  has <bpmndi:BPMNDiagram>: ${String(managed.bpmn_xml).includes("BPMNDiagram")}`);
console.log(`  serviceTask count:        ${String(managed.bpmn_xml).split("<bpmn:serviceTask").length - 1}`);

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } } as never);

const errors: string[] = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text().split("\n")[0]!);
});

await page.goto(`${FRONTEND}/auth/login`, { waitUntil: "networkidle" });
await page.fill('input[type="email"]', "admin@admin.com");
await page.fill('input[type="password"]', "admin");
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);

await page.goto(`${FRONTEND}/admin/workflow-definitions/${managed.id}/edit`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(2500);
await page.screenshot({ path: `${SHOTS}/saga-model-managed-edit.png`, fullPage: true });

const body = await page.locator("body").innerText();

// The four steps the drug-discovery saga declares, by their flowchart labels.
const expectedLabels = ["Stage base days", "Compute resolution days", "Open a CAPA", "Escalate the deviation"];
const visible = expectedLabels.filter((label) => body.includes(label));

console.log(`\n  step labels visible in the designer: ${visible.length}/${expectedLabels.length}`);
for (const label of expectedLabels) {
  console.log(`    ${visible.includes(label) ? "shown  " : "MISSING"} ${label}`);
}
console.log(`\n  console errors: ${errors.length}`);
for (const error of errors.slice(0, 6)) console.log(`    ${error}`);

// Does the canvas hold a rendered diagram?
const canvasShapes = await page.locator(".djs-element").count();
console.log(`\n  bpmn-js rendered elements: ${canvasShapes}`);

await browser.close();
