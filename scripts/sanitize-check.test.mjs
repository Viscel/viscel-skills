import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { leerLista, revisar } from "./sanitize-check.mjs";

const SCRIPT = fileURLToPath(new URL("./sanitize-check.mjs", import.meta.url));
// Un término inventado: no existe en ningún lado, sirve para probar sin nombrar a nadie.
const LISTA = "# comentario\n\n\\bZorg[o0]nia\\b\nsecreto-[0-9]{3}\n";

function carpeta(archivos) {
  const dir = mkdtempSync(join(tmpdir(), "saneamiento-"));
  for (const [ruta, contenido] of Object.entries(archivos)) {
    const completa = join(dir, ruta);
    mkdirSync(join(completa, ".."), { recursive: true });
    writeFileSync(completa, contenido);
  }
  return dir;
}

test("la lista ignora comentarios y líneas vacías", () => {
  assert.equal(leerLista(LISTA).length, 2);
});

test("una expresión inválida dice en qué línea está, sin mostrarla", () => {
  assert.throws(() => leerLista("ok\n(sin-cerrar"), /línea 2/);
});

test("una lista vacía no es una lista", () => {
  assert.throws(() => leerLista("# sólo comentarios\n"), /vacía/);
});

test("encuentra el término en el contenido, con su línea, sin distinguir mayúsculas", () => {
  const dir = carpeta({ "docs/nota.md": "hola\nla gente de ZORGONIA usa esto\n" });
  const h = revisar(dir, leerLista(LISTA));
  assert.deepEqual(h, [{ archivo: "docs/nota.md", linea: 2, texto: "ZORGONIA" }]);
});

test("también revisa los nombres de archivo", () => {
  const dir = carpeta({ "plantillas/zorgonia-notas.md": "nada raro" });
  const h = revisar(dir, leerLista(LISTA));
  assert.equal(h.length, 1);
  assert.equal(h[0].linea, 0);
});

test("saltea binarios y la carpeta .git", () => {
  const dir = carpeta({
    "imagen.png": Buffer.from([0x89, 0x50, 0x00, 0x5a, 0x6f, 0x72, 0x67]),
    ".git/config": "Zorgonia",
  });
  assert.deepEqual(revisar(dir, leerLista(LISTA)), []);
});

test("un repo limpio no tiene hallazgos", () => {
  const dir = carpeta({ "README.md": "Skills gratis.\n" });
  assert.deepEqual(revisar(dir, leerLista(LISTA)), []);
});

test("por consola: frena con 1 y muestra archivo:línea, nunca el patrón", () => {
  const dir = carpeta({ "a.md": "uno\nsecreto-123\n" });
  const lista = join(mkdtempSync(join(tmpdir(), "lista-")), "lista.txt");
  writeFileSync(lista, LISTA);
  const r = spawnSync(process.execPath, [SCRIPT, "--lista", lista, "--raiz", dir], { encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /a\.md:2: secreto-123/);
  assert.doesNotMatch(r.stderr + r.stdout, /Zorg\[o0\]nia|\[0-9\]\{3\}/);
});

test("sin lista no pasa: sale con 2", () => {
  const dir = carpeta({ "a.md": "nada" });
  const env = { ...process.env };
  delete env.SANITIZE_BLOCKLIST;
  const r = spawnSync(process.execPath, [SCRIPT, "--raiz", dir], { encoding: "utf8", env });
  assert.equal(r.status, 2);
});
