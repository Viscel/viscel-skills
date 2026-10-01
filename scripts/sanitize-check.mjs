#!/usr/bin/env node
/**
 * Control de saneamiento: nada privado sale en este repo.
 *
 *   node scripts/sanitize-check.mjs [--lista <archivo>] [--raiz <carpeta>]
 *
 * Recorre todo el repo (menos .git, node_modules y dist), nombres de archivo
 * incluidos, y busca cada expresión de la lista de bloqueo sin distinguir
 * mayúsculas. Imprime archivo:línea y lo que encontró, y sale con 1 si hay algo.
 *
 * La lista NO vive en el repo: nombra clientes. Sale de `--lista`, de la variable
 * SANITIZE_BLOCKLIST (el secret del CI) o de `git config viscel.blocklist` (la
 * ruta local, que no se commitea). Sin lista sale con 2: un control que no se
 * pudo correr frena igual que uno que falla.
 *
 * Nunca imprime los patrones: los logs del CI de un repo público son públicos.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SALTEAR = new Set([".git", "node_modules", "dist"]);

/** Una expresión por línea; las vacías y las que empiezan con # se ignoran. */
export function leerLista(texto) {
  const patrones = [];
  texto.split(/\r?\n/).forEach((linea, n) => {
    const p = linea.trim();
    if (!p || p.startsWith("#")) return;
    try {
      patrones.push(new RegExp(p, "giu"));
    } catch {
      throw new Error(`La línea ${n + 1} de la lista no es una expresión válida`);
    }
  });
  if (patrones.length === 0) throw new Error("La lista de bloqueo está vacía");
  return patrones;
}

function archivos(carpeta, raiz = carpeta) {
  const salida = [];
  for (const nombre of readdirSync(carpeta)) {
    if (SALTEAR.has(nombre)) continue;
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...archivos(ruta, raiz));
    else salida.push(relative(raiz, ruta).split("\\").join("/"));
  }
  return salida;
}

function buscar(texto, patrones) {
  const encontrados = [];
  for (const p of patrones) {
    p.lastIndex = 0;
    for (const m of texto.matchAll(p)) encontrados.push(m[0]);
  }
  return encontrados;
}

/** Devuelve los hallazgos: [{ archivo, linea, texto }]. Línea 0 = el nombre del archivo. */
export function revisar(raiz, patrones) {
  const hallazgos = [];
  for (const archivo of archivos(raiz)) {
    for (const t of buscar(archivo, patrones)) hallazgos.push({ archivo, linea: 0, texto: t });

    const datos = readFileSync(join(raiz, archivo));
    if (datos.subarray(0, 8000).includes(0)) continue; // binario
    datos
      .toString("utf8")
      .split(/\r?\n/)
      .forEach((contenido, n) => {
        for (const t of buscar(contenido, patrones)) {
          hallazgos.push({ archivo, linea: n + 1, texto: t });
        }
      });
  }
  return hallazgos;
}

function listaDesdeGit(raiz) {
  try {
    const ruta = execFileSync("git", ["-C", raiz, "config", "--get", "viscel.blocklist"], {
      encoding: "utf8",
    }).trim();
    return ruta && existsSync(ruta) ? readFileSync(ruta, "utf8") : null;
  } catch {
    return null;
  }
}

function principal(argv) {
  const arg = (nombre) => {
    const i = argv.indexOf(nombre);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const raiz = arg("--raiz") ?? process.cwd();
  const archivoLista = arg("--lista");
  const texto = archivoLista
    ? readFileSync(archivoLista, "utf8")
    : (process.env.SANITIZE_BLOCKLIST ?? listaDesdeGit(raiz));

  if (!texto) {
    console.error(
      "No hay lista de bloqueo: pasá --lista, la variable SANITIZE_BLOCKLIST o `git config viscel.blocklist <ruta>`.",
    );
    return 2;
  }

  let patrones;
  try {
    patrones = leerLista(texto);
  } catch (e) {
    console.error(e.message);
    return 2;
  }

  const hallazgos = revisar(raiz, patrones);
  if (hallazgos.length === 0) {
    console.log(`Saneamiento limpio: ${archivos(raiz).length} archivos revisados.`);
    return 0;
  }
  for (const h of hallazgos) console.error(`${h.archivo}:${h.linea}: ${h.texto}`);
  console.error(`\n${hallazgos.length} coincidencias con la lista de bloqueo. No se publica.`);
  return 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = principal(process.argv.slice(2));
}
