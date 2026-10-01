#!/usr/bin/env node
/**
 * Consistencia de los plugins del marketplace:
 * - cada entrada de marketplace.json apunta a una carpeta con .claude-plugin/plugin.json;
 * - el `name` de la entrada y el de plugin.json son iguales (si no, la instalación
 *   falla con "Plugin not found in marketplace");
 * - la versión de plugin.json es la primera entrada de su CHANGELOG.md;
 * - cada skill tiene SKILL.md con `name` igual a su carpeta y una `description`.
 *
 *   node scripts/check-plugin.mjs [--raiz <carpeta>]
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

function frontmatter(texto) {
  const m = texto.replace(/\r\n?/g, "\n").match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const campos = {};
  for (const linea of m[1].split("\n")) {
    const kv = linea.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (kv) campos[kv[1]] = kv[2].trim();
  }
  return campos;
}

export function revisarMarketplace(raiz) {
  const problemas = [];
  const rutaMarket = join(raiz, ".claude-plugin", "marketplace.json");
  if (!existsSync(rutaMarket)) return ["Falta .claude-plugin/marketplace.json"];
  const market = JSON.parse(readFileSync(rutaMarket, "utf8"));

  for (const entrada of market.plugins ?? []) {
    const carpeta = join(raiz, entrada.source);
    const rutaPlugin = join(carpeta, ".claude-plugin", "plugin.json");
    if (!existsSync(rutaPlugin)) {
      problemas.push(`${entrada.name}: falta ${entrada.source}/.claude-plugin/plugin.json`);
      continue;
    }
    const plugin = JSON.parse(readFileSync(rutaPlugin, "utf8"));
    if (plugin.name !== entrada.name) {
      problemas.push(`${entrada.name}: plugin.json se llama "${plugin.name}"`);
    }

    const rutaCambios = join(carpeta, "CHANGELOG.md");
    const primera = existsSync(rutaCambios)
      ? readFileSync(rutaCambios, "utf8").match(/^## (\d+\.\d+\.\d+)/m)?.[1]
      : undefined;
    if (!primera) problemas.push(`${entrada.name}: el CHANGELOG.md no tiene ninguna versión`);
    else if (primera !== plugin.version) {
      problemas.push(`${entrada.name}: plugin.json dice ${plugin.version} y el CHANGELOG arranca en ${primera}`);
    }

    const carpetaSkills = join(carpeta, "skills");
    if (existsSync(carpetaSkills)) {
      for (const skill of readdirSync(carpetaSkills)) {
        const rutaSkill = join(carpetaSkills, skill, "SKILL.md");
        if (!existsSync(rutaSkill)) {
          problemas.push(`${entrada.name}/${skill}: falta SKILL.md`);
          continue;
        }
        const fm = frontmatter(readFileSync(rutaSkill, "utf8"));
        if (fm.name !== skill) problemas.push(`${entrada.name}/${skill}: el name del SKILL.md es "${fm.name}"`);
        if (!fm.description) problemas.push(`${entrada.name}/${skill}: falta la description`);
      }
    }
  }
  return problemas;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const i = process.argv.indexOf("--raiz");
  const raiz = i >= 0 ? process.argv[i + 1] : process.cwd();
  const problemas = revisarMarketplace(raiz);
  if (problemas.length === 0) {
    console.log("Plugins consistentes: nombres, versiones y skills.");
  } else {
    for (const p of problemas) console.error(p);
    process.exitCode = 1;
  }
}
