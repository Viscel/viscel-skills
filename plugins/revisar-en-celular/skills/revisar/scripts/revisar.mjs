#!/usr/bin/env node
/**
 * Revisa una web en celular, tablet y escritorio, y devuelve los defectos
 * medidos: desborde horizontal, texto ilegible, elementos cortados, botones
 * chicos para el dedo, contenido tapado por una barra fija y errores de consola.
 *
 *   node revisar.mjs <dirección> [--salida carpeta] [--scroll 0.3,0.6,0.9]
 *                    [--espera 6000] [--json]
 *
 * Sale con 1 si hay algo que bloquea (desborde horizontal, texto ilegible o un
 * tamaño de pantalla que no se pudo revisar), así sirve como control antes de
 * dar un trabajo por terminado. Con --json devuelve las mediciones crudas.
 */
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error(
    "Falta Playwright, el navegador que usa la revisión. Se instala una sola vez, en la carpeta de esta skill:\n" +
      "  npm install\n" +
      "  npx playwright install chromium",
  );
  process.exit(2);
}

const TAMANOS = [
  { nombre: "celular-360", ancho: 360, alto: 740, celular: true },
  { nombre: "celular-390", ancho: 390, alto: 844, celular: true },
  { nombre: "tablet-768", ancho: 768, alto: 1024, celular: false },
  { nombre: "escritorio-1440", ancho: 1440, alto: 900, celular: false },
];

const LETRA_MINIMA = 12; // px: por debajo no se lee en la mano
const TOQUE_MINIMO = 44; // px: lo mínimo cómodo para un dedo

const args = process.argv.slice(2);
const direccion = args[0];
if (!direccion || direccion.startsWith("--")) {
  console.error("Uso: node revisar.mjs <dirección> [--salida carpeta] [--scroll 0.3,0.6] [--espera 6000] [--json]");
  process.exit(2);
}
const opcion = (nombre) => {
  const i = args.indexOf(`--${nombre}`);
  return i > -1 ? args[i + 1] : undefined;
};
const salida = resolve(opcion("salida") ?? join(process.cwd(), "revision-celular"));
const espera = Number(opcion("espera") ?? 6000);
const comoJson = args.includes("--json");
const paradas = (opcion("scroll") ?? "")
  .split(",")
  .map(Number)
  .filter((n) => n > 0 && n <= 1);

// Corre adentro de la página: junta las mediciones de un tamaño de pantalla.
const MEDIR = ({ LETRA_MINIMA, TOQUE_MINIMO }) => {
  // Visible y adentro de la pantalla: lo que está entero fuera de ella (el enlace
  // «saltar al contenido», un menú cerrado) está escondido a propósito.
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.right > 0 && r.left < document.documentElement.clientWidth;
  };
  const nombre = (el) => {
    const id = el.id ? `#${el.id}` : "";
    const clase = typeof el.className === "string" && el.className.trim()
      ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
      : "";
    const texto = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30);
    return `${el.tagName.toLowerCase()}${id}${clase}${texto ? ` «${texto}»` : ""}`;
  };

  const ancho = document.documentElement.clientWidth;
  const r = { anchoMedido: ancho, desborde: null, letraChica: [], cortados: [], toquesChicos: [], tapados: [] };

  // Una cinta que se mueve, o cualquier cosa que un contenedor recorta con
  // overflow hidden o clip (también el body), se sale a propósito y no se ve.
  const recortadoAdrede = (el) => {
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflow === "hidden" || cs.overflowX === "hidden" || cs.overflowX === "clip") return true;
    }
    return false;
  };

  // 1. Desborde horizontal: la página es más ancha que la pantalla Y hay algo que
  // se ve más allá del borde. Si lo que sobra está recortado, la persona no lo ve
  // ni puede mover la página para el costado: no es un defecto.
  const anchoDoc = document.documentElement.scrollWidth;
  if (anchoDoc > ancho + 1) {
    const culpables = [...document.querySelectorAll("body *")]
      .filter((el) => {
        const c = el.getBoundingClientRect();
        return c.width > 0 && c.height > 0 && c.right > ancho + 1 && c.left < ancho &&
          getComputedStyle(el).position !== "fixed" && !recortadoAdrede(el);
      })
      .slice(0, 3)
      .map(nombre);
    if (culpables.length) r.desborde = { anchoDoc, anchoPantalla: ancho, culpables };
  }

  // 2. Texto por debajo del mínimo legible.
  const vistos = new Set();
  document.querySelectorAll("p,span,li,a,h1,h2,h3,h4,h5,h6,button,label,td,th,div").forEach((el) => {
    if (!visible(el)) return;
    const textoPropio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!textoPropio) return;
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (px && px < LETRA_MINIMA) {
      const k = nombre(el);
      if (!vistos.has(k)) {
        vistos.add(k);
        r.letraChica.push({ el: k, px: Math.round(px * 10) / 10 });
      }
    }
  });

  // 3. Elementos que se salen por los costados (lo recortado adrede no cuenta).
  document.querySelectorAll("body *").forEach((el) => {
    if (!visible(el)) return;
    if (getComputedStyle(el).position === "fixed") return;
    if (el.getAttribute("aria-hidden") === "true") return;
    if (recortadoAdrede(el)) return;
    const c = el.getBoundingClientRect();
    if (c.width < 24 || c.height < 12) return;
    if ((c.left < -2 || c.right > ancho + 2) && (el.textContent || "").trim().length > 2) {
      r.cortados.push({ el: nombre(el), izquierda: Math.round(c.left), derecha: Math.round(c.right) });
    }
  });

  // 4. Lo que se toca con el dedo y es más chico que el mínimo.
  document.querySelectorAll("a,button,[role=button],input,select,textarea").forEach((el) => {
    if (!visible(el)) return;
    const c = el.getBoundingClientRect();
    if (c.width < TOQUE_MINIMO || c.height < TOQUE_MINIMO) {
      r.toquesChicos.push({ el: nombre(el), ancho: Math.round(c.width), alto: Math.round(c.height) });
    }
  });

  // 5. Contenido tapado por una barra fija de arriba. Muchas veces el <header> es
  // un contenedor transparente, más alto que la barra que se ve, y no recibe
  // clics: lo que tapa es lo que pinta adentro, no su caja.
  const pinta = (el) => {
    const cs = getComputedStyle(el);
    const fondo = cs.backgroundColor.replace(/\s/g, "");
    const opaco = fondo && fondo !== "transparent" && !/^rgba\(.*,0\)$/.test(fondo);
    return opaco || (cs.backdropFilter && cs.backdropFilter !== "none");
  };
  const barras = [...document.querySelectorAll("header,nav,[class*=nav],[class*=header]")]
    .filter((el) => visible(el) && getComputedStyle(el).position === "fixed")
    .filter((el) => el.getBoundingClientRect().top < 120);
  const partes = barras.flatMap((el) =>
    getComputedStyle(el).pointerEvents === "none"
      ? [...el.querySelectorAll("*")].filter((d) => visible(d) && getComputedStyle(d).pointerEvents !== "none" && pinta(d))
      : [el],
  );
  if (partes.length) {
    const piso = Math.max(...partes.map((el) => el.getBoundingClientRect().bottom));
    document.querySelectorAll("h1,h2,h3,p,button,a").forEach((el) => {
      if (!visible(el) || getComputedStyle(el).position === "fixed") return;
      if (barras.some((b) => b.contains(el))) return;
      const c = el.getBoundingClientRect();
      if (c.top < piso - 4 && c.bottom > 8 && c.height > 14 && (el.textContent || "").trim().length > 2) {
        r.tapados.push({ el: nombre(el), arriba: Math.round(c.top), pisoDeLaBarra: Math.round(piso) });
      }
    });
  }

  r.letraChica = r.letraChica.slice(0, 10);
  r.cortados = r.cortados.slice(0, 8);
  r.toquesChicos = r.toquesChicos.slice(0, 8);
  r.tapados = r.tapados.slice(0, 5);
  return r;
};

mkdirSync(salida, { recursive: true });
let navegador;
try {
  navegador = await chromium.launch({ channel: "chrome" });
} catch {
  navegador = await chromium.launch();
}

let bloqueantes = 0;
const informe = [];

for (const t of TAMANOS) {
  const contexto = await navegador.newContext({
    viewport: { width: t.ancho, height: t.alto },
    isMobile: t.celular,
    hasTouch: t.celular,
    deviceScaleFactor: 2,
  });
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(String(e).slice(0, 140)));
  pagina.on("console", (m) => {
    if (m.type() === "error") errores.push(m.text().slice(0, 140));
  });

  const etiqueta = `${t.nombre} (${t.ancho}×${t.alto})`;
  try {
    await pagina.goto(direccion, { waitUntil: "domcontentloaded", timeout: 60000 });
    await pagina.waitForTimeout(espera); // animaciones de entrada
    for (const boton of ["text=Aceptar", "text=Accept all", "text=Entendido"]) {
      try {
        await pagina.click(boton, { timeout: 1000 });
      } catch {}
    }
    await pagina.waitForTimeout(800);

    const m = await pagina.evaluate(MEDIR, { LETRA_MINIMA, TOQUE_MINIMO });
    await pagina.screenshot({ path: join(salida, `${t.nombre}-arriba.png`), timeout: 60000 });

    for (const parada of paradas) {
      // Con la rueda y no con scrollTo: en sitios con scroll suavizado, scrollTo
      // no mueve las animaciones y la captura sale engañosa.
      await pagina.mouse.move(t.ancho / 2, t.alto / 2);
      const destino = await pagina.evaluate((f) => (document.body.scrollHeight - innerHeight) * f, parada);
      let y = await pagina.evaluate(() => window.scrollY);
      while (y < destino) {
        const paso = Math.min(700, destino - y);
        await pagina.mouse.wheel(0, paso);
        y += paso;
        await pagina.waitForTimeout(35);
      }
      await pagina.waitForTimeout(1500);
      await pagina.screenshot({ path: join(salida, `${t.nombre}-${Math.round(parada * 100)}.png`), timeout: 60000 });
    }

    const defectos = [];
    // Si el navegador no respetó el ancho pedido, todo lo demás está medido en otra pantalla.
    if (Math.abs(m.anchoMedido - t.ancho) > 1) {
      defectos.push(`NO SE PUDO SIMULAR ESTE ANCHO: se pidieron ${t.ancho} px y la página midió ${m.anchoMedido}`);
      bloqueantes++;
    }
    if (m.desborde) {
      defectos.push(`DESBORDE HORIZONTAL: la página mide ${m.desborde.anchoDoc} px en una pantalla de ${m.desborde.anchoPantalla} (se sale: ${m.desborde.culpables.join(" · ")})`);
      bloqueantes++;
    }
    if (m.letraChica.length) {
      defectos.push(`TEXTO ILEGIBLE (menos de ${LETRA_MINIMA} px): ${m.letraChica.map((x) => `${x.px} px ${x.el}`).join(" · ")}`);
      bloqueantes++;
    }
    if (m.cortados.length) defectos.push(`SE SALEN POR LOS COSTADOS: ${m.cortados.map((x) => x.el).join(" · ")}`);
    if (m.tapados.length) defectos.push(`TAPADOS POR LA BARRA DE ARRIBA: ${m.tapados.map((x) => x.el).join(" · ")}`);
    if (m.toquesChicos.length) {
      defectos.push(`CHICOS PARA EL DEDO (menos de ${TOQUE_MINIMO} px): ${m.toquesChicos.map((x) => `${x.ancho}×${x.alto} ${x.el}`).join(" · ")}`);
    }
    if (errores.length) defectos.push(`ERRORES EN LA CONSOLA: ${[...new Set(errores)].slice(0, 3).join(" | ")}`);

    informe.push({ tamano: etiqueta, defectos, medicion: m, errores: [...new Set(errores)] });
  } catch (e) {
    informe.push({ tamano: etiqueta, defectos: [`NO SE PUDO REVISAR: ${String(e).slice(0, 120)}`], error: String(e).slice(0, 240) });
    bloqueantes++;
  }
  await contexto.close();
}
await navegador.close();

if (comoJson) {
  console.log(JSON.stringify({ direccion, salida, letraMinima: LETRA_MINIMA, toqueMinimo: TOQUE_MINIMO, bloqueantes, tamanos: informe }, null, 2));
  process.exit(bloqueantes ? 1 : 0);
}

console.log(`\nRevisión de ${direccion}\n`);
for (const r of informe) {
  if (!r.defectos.length) {
    console.log(`✓ ${r.tamano}: sin defectos`);
    continue;
  }
  console.log(`✗ ${r.tamano}`);
  for (const d of r.defectos) console.log(`    · ${d}`);
}
console.log(`\nCapturas en: ${salida}`);
console.log(bloqueantes ? `\n✖ ${bloqueantes} defecto(s) que bloquean: no está terminado.\n` : "\n✓ Nada que bloquee.\n");
process.exit(bloqueantes ? 1 : 0);
