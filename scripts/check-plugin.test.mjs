import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { revisarMarketplace } from "./check-plugin.mjs";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));

function copia() {
  const dir = mkdtempSync(join(tmpdir(), "plugin-"));
  cpSync(join(RAIZ, ".claude-plugin"), join(dir, ".claude-plugin"), { recursive: true });
  cpSync(join(RAIZ, "plugins"), join(dir, "plugins"), { recursive: true });
  return dir;
}

test("el repo real es consistente", () => {
  assert.deepEqual(revisarMarketplace(RAIZ), []);
});

test("un nombre distinto entre marketplace.json y plugin.json se detecta", () => {
  const dir = copia();
  const ruta = join(dir, "plugins", "memoria-obsidian", ".claude-plugin", "plugin.json");
  const p = JSON.parse(readFileSync(ruta, "utf8"));
  writeFileSync(ruta, JSON.stringify({ ...p, name: "memoria" }));
  assert.match(revisarMarketplace(dir).join("\n"), /plugin\.json se llama "memoria"/);
});

test("una versión que no es la primera del CHANGELOG se detecta", () => {
  const dir = copia();
  const ruta = join(dir, "plugins", "memoria-obsidian", ".claude-plugin", "plugin.json");
  const p = JSON.parse(readFileSync(ruta, "utf8"));
  writeFileSync(ruta, JSON.stringify({ ...p, version: "9.9.9" }));
  assert.match(revisarMarketplace(dir).join("\n"), /plugin\.json dice 9\.9\.9/);
});

test("una skill cuyo name no coincide con su carpeta se detecta", () => {
  const dir = copia();
  const ruta = join(dir, "plugins", "memoria-obsidian", "skills", "guardar", "SKILL.md");
  writeFileSync(ruta, readFileSync(ruta, "utf8").replace("name: guardar", "name: otra"));
  assert.match(revisarMarketplace(dir).join("\n"), /guardar: el name del SKILL\.md es "otra"/);
});
