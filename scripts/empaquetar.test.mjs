import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { crc32, inflateRawSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { empaquetar, notasDeVersion } from "./empaquetar.mjs";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));

/** Lee un zip desde su directorio central y verifica el CRC de cada archivo. */
function leerZip(buf) {
  const fin = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.ok(fin >= 0, "falta el fin del directorio central");
  const total = buf.readUInt16LE(fin + 10);
  let p = buf.readUInt32LE(fin + 16);
  const entradas = {};
  for (let i = 0; i < total; i++) {
    assert.equal(buf.readUInt32LE(p), 0x02014b50);
    const metodo = buf.readUInt16LE(p + 10);
    const crc = buf.readUInt32LE(p + 16);
    const comprimido = buf.readUInt32LE(p + 20);
    const largoNombre = buf.readUInt16LE(p + 28);
    const offset = buf.readUInt32LE(p + 42);
    const nombre = buf.subarray(p + 46, p + 46 + largoNombre).toString("utf8");
    const inicio = offset + 30 + buf.readUInt16LE(offset + 26) + buf.readUInt16LE(offset + 28);
    const cuerpo = buf.subarray(inicio, inicio + comprimido);
    const datos = metodo === 8 ? inflateRawSync(cuerpo) : cuerpo;
    if (!nombre.endsWith("/")) assert.equal(crc32(datos) >>> 0, crc, `CRC de ${nombre}`);
    entradas[nombre] = datos.toString("utf8");
    p += 46 + largoNombre;
  }
  return entradas;
}

test("arma la skill suelta para claude.ai con el nombre del plugin", () => {
  const dist = mkdtempSync(join(tmpdir(), "dist-"));
  empaquetar(RAIZ, "memoria-obsidian--v1.0.0", dist);
  const z = leerZip(readFileSync(join(dist, "memoria-obsidian-1.0.0.zip")));
  assert.match(z["memoria-obsidian/SKILL.md"], /^---\nname: memoria-obsidian\n/);
  assert.ok("memoria-obsidian/references/extraction-guide.md" in z);
  assert.ok("memoria-obsidian/references/file-templates.md" in z);
  assert.ok("memoria-obsidian/LICENSE" in z);
});

test("arma el vault de arranque con las carpetas vacías y sin los .gitkeep", () => {
  const dist = mkdtempSync(join(tmpdir(), "dist-"));
  empaquetar(RAIZ, "memoria-obsidian--v1.0.0", dist);
  const z = leerZip(readFileSync(join(dist, "vault-arranque-1.0.0.zip")));
  assert.ok("Cerebro/INDEX.md" in z);
  assert.ok("Cerebro/03-Templates/context-note.md" in z);
  assert.ok("Cerebro/02-Entidades/clientes/" in z);
  assert.ok(!Object.keys(z).some((n) => n.endsWith(".gitkeep")));
});

test("el mismo commit da los mismos bytes", () => {
  const a = mkdtempSync(join(tmpdir(), "dist-"));
  const b = mkdtempSync(join(tmpdir(), "dist-"));
  empaquetar(RAIZ, "memoria-obsidian--v1.0.0", a);
  empaquetar(RAIZ, "memoria-obsidian--v1.0.0", b);
  assert.deepEqual(
    readFileSync(join(a, "memoria-obsidian-1.0.0.zip")),
    readFileSync(join(b, "memoria-obsidian-1.0.0.zip")),
  );
});

test("un tag con otra versión que plugin.json no se empaqueta", () => {
  assert.throws(() => empaquetar(RAIZ, "memoria-obsidian--v9.9.9", mkdtempSync(join(tmpdir(), "d-"))), /9\.9\.9/);
});

test("un tag mal formado no se empaqueta", () => {
  assert.throws(() => empaquetar(RAIZ, "memoria-obsidian@1.0.0"), /no tiene la forma/);
});

test("las notas del release son la sección del CHANGELOG", () => {
  const ch = "# Cambios\n\n## 1.1.0 (2026-11-01)\n\n- Nuevo\n\n## 1.0.0 (2026-10-01)\n\n- Primera\n";
  assert.equal(notasDeVersion(ch, "1.1.0"), "- Nuevo");
  assert.equal(notasDeVersion(ch, "1.0.0"), "- Primera");
  assert.equal(notasDeVersion(ch, "2.0.0"), null);
});
