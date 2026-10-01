#!/usr/bin/env node
/**
 * Arma los archivos de un release:
 *
 *   node scripts/empaquetar.mjs memoria-obsidian--v1.0.0
 *
 * El tag tiene la forma de `claude plugin tag`: {plugin}--v{versión}. Deja en dist/:
 * - {plugin}-{versión}.zip: la skill `guardar` como skill suelta para subir a
 *   claude.ai (SKILL.md en la raíz de la carpeta, con el nombre del plugin), sus
 *   referencias, el README y la licencia;
 * - vault-arranque-{versión}.zip: la plantilla del vault, lista para abrir en Obsidian;
 * - notas.md: la sección del CHANGELOG de esa versión, para el texto del release.
 *
 * Sin dependencias: el zip lo escribe este script (deflate y CRC32 de node:zlib), con
 * fechas fijas para que el mismo commit dé siempre los mismos bytes.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { crc32, deflateRawSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const FECHA_DOS = (1 << 5) | 1; // 1980-01-01: fija a propósito
const HORA_DOS = 0;

/** entradas: [{ ruta, datos?: Buffer }]; sin datos y con "/" al final = carpeta. */
export function zip(entradas) {
  const locales = [];
  const centrales = [];
  let offset = 0;
  for (const e of entradas) {
    const nombre = Buffer.from(e.ruta, "utf8");
    const esCarpeta = e.ruta.endsWith("/");
    const crudo = esCarpeta ? Buffer.alloc(0) : e.datos;
    const comprimido = esCarpeta ? crudo : deflateRawSync(crudo, { level: 9 });
    const deflate = !esCarpeta && comprimido.length < crudo.length;
    const cuerpo = deflate ? comprimido : crudo;
    const crc = esCarpeta ? 0 : crc32(crudo);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // nombres en UTF-8
    local.writeUInt16LE(deflate ? 8 : 0, 8);
    local.writeUInt16LE(HORA_DOS, 10);
    local.writeUInt16LE(FECHA_DOS, 12);
    local.writeUInt32LE(crc >>> 0, 14);
    local.writeUInt32LE(cuerpo.length, 18);
    local.writeUInt32LE(crudo.length, 22);
    local.writeUInt16LE(nombre.length, 26);
    local.writeUInt16LE(0, 28);
    locales.push(local, nombre, cuerpo);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(deflate ? 8 : 0, 10);
    central.writeUInt16LE(HORA_DOS, 12);
    central.writeUInt16LE(FECHA_DOS, 14);
    central.writeUInt32LE(crc >>> 0, 16);
    central.writeUInt32LE(cuerpo.length, 20);
    central.writeUInt32LE(crudo.length, 24);
    central.writeUInt16LE(nombre.length, 28);
    central.writeUInt32LE(esCarpeta ? 0x10 : 0, 38); // atributo DOS de carpeta
    central.writeUInt32LE(offset, 42);
    centrales.push(central, nombre);

    offset += local.length + nombre.length + cuerpo.length;
  }
  const directorio = Buffer.concat(centrales);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(entradas.length, 8);
  fin.writeUInt16LE(entradas.length, 10);
  fin.writeUInt32LE(directorio.length, 12);
  fin.writeUInt32LE(offset, 16);
  return Buffer.concat([...locales, directorio, fin]);
}

function recorrer(carpeta, prefijo) {
  const entradas = [];
  for (const nombre of readdirSync(carpeta).sort()) {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) {
      entradas.push({ ruta: `${prefijo}${nombre}/` });
      entradas.push(...recorrer(ruta, `${prefijo}${nombre}/`));
    } else if (nombre !== ".gitkeep") {
      entradas.push({ ruta: `${prefijo}${nombre}`, datos: readFileSync(ruta) });
    }
  }
  return entradas;
}

/** La sección "## {versión}" del CHANGELOG, sin el título. */
export function notasDeVersion(changelog, version) {
  const lineas = changelog.replace(/\r\n?/g, "\n").split("\n");
  const i = lineas.findIndex((l) => l.startsWith(`## ${version}`));
  if (i < 0) return null;
  const fin = lineas.findIndex((l, n) => n > i && l.startsWith("## "));
  return lineas
    .slice(i + 1, fin < 0 ? undefined : fin)
    .join("\n")
    .trim();
}

export function empaquetar(raiz, tag, salida = join(raiz, "dist")) {
  const m = tag.match(/^([a-z0-9-]+)--v(\d+\.\d+\.\d+)$/);
  if (!m) throw new Error(`El tag "${tag}" no tiene la forma {plugin}--v{versión}`);
  const [, plugin, version] = m;
  const carpeta = join(raiz, "plugins", plugin);
  const manifiesto = JSON.parse(readFileSync(join(carpeta, ".claude-plugin", "plugin.json"), "utf8"));
  if (manifiesto.version !== version) {
    throw new Error(`El tag dice ${version} y plugin.json dice ${manifiesto.version}`);
  }
  const notas = notasDeVersion(readFileSync(join(carpeta, "CHANGELOG.md"), "utf8"), version);
  if (!notas) throw new Error(`El CHANGELOG no tiene la sección ${version}`);

  mkdirSync(salida, { recursive: true });

  // La skill suelta para claude.ai: la carpeta lleva el nombre del plugin y el
  // SKILL.md también, porque "guardar" a secas no dice nada fuera del plugin.
  const guardar = join(carpeta, "skills", "guardar");
  const skill = readFileSync(join(guardar, "SKILL.md"), "utf8").replace(
    /^name: guardar$/m,
    `name: ${plugin}`,
  );
  const suelta = [
    { ruta: `${plugin}/` },
    { ruta: `${plugin}/SKILL.md`, datos: Buffer.from(skill, "utf8") },
    { ruta: `${plugin}/references/` },
    ...recorrer(join(guardar, "references"), `${plugin}/references/`),
    { ruta: `${plugin}/README.md`, datos: readFileSync(join(carpeta, "README.md")) },
    { ruta: `${plugin}/LICENSE`, datos: readFileSync(join(raiz, "LICENSE")) },
  ];
  const archivos = [];
  const zipSkill = join(salida, `${plugin}-${version}.zip`);
  writeFileSync(zipSkill, zip(suelta));
  archivos.push(zipSkill);

  const plantilla = join(carpeta, "skills", "iniciar", "plantilla-vault");
  if (existsSync(plantilla)) {
    const zipVault = join(salida, `vault-arranque-${version}.zip`);
    writeFileSync(zipVault, zip([{ ruta: "Cerebro/" }, ...recorrer(plantilla, "Cerebro/")]));
    archivos.push(zipVault);
  }

  writeFileSync(join(salida, "notas.md"), `${notas}\n`);
  return { plugin, version, archivos };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const tag = process.argv[2];
  if (!tag) {
    console.error("Uso: node scripts/empaquetar.mjs {plugin}--v{versión}");
    process.exitCode = 2;
  } else {
    const r = empaquetar(process.cwd(), tag);
    for (const a of r.archivos) console.log(`${a} · ${statSync(a).size} bytes`);
  }
}
