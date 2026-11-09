---
name: revisar
description: Revisa una web en celular, tablet y escritorio de una sola pasada y devuelve los defectos medidos (desborde horizontal, texto ilegible, elementos cortados, botones chicos para el dedo, contenido tapado por una barra fija, errores de consola), con capturas de cada tamaño. Usala antes de dar por terminado cualquier cambio en una web, aunque el pedido no mencione el celular, y cuando alguien diga que algo se ve mal en el teléfono. Se dispara con "revisá en el celular", "fijate cómo se ve en mobile", "se ve mal en el teléfono", "revisá responsive", "¿está listo?" sobre una web.
---

# Revisar una web en el celular

La mayoría de la gente entra a una web desde el teléfono. Si algo funciona en la
computadora y se ve mal en el celular, el trabajo no está terminado.

Esta skill no da consejos de CSS: **mide**. Abre la página en cuatro tamaños de
pantalla, busca los defectos que más se repiten y saca una captura de cada uno.

## Cuándo usarla

- Antes de decir «listo» sobre cualquier cambio o construcción de una web.
- Después de tocar tipografía, distribución, animaciones o imágenes.
- Cuando alguien avisa que algo se ve mal en el celular.

No esperes a que te la pidan: revisar el celular es parte de terminar.

## Los tamaños

| Nombre | Medidas | Por qué |
|---|---|---|
| `celular-360` | 360×740 | Un Android chico: el caso más apretado |
| `celular-390` | 390×844 | Un iPhone de los últimos años: el más común |
| `tablet-768` | 768×1024 | Tablet vertical: la que más se olvida |
| `escritorio-1440` | 1440×900 | Una computadora de referencia |

Los dos de celular se simulan con pantalla táctil y doble densidad de píxeles.

## Qué mide

1. **Desborde horizontal.** La página es más ancha que la pantalla y obliga a
   achicarla para leer. Es el defecto más común y el más grave.
2. **Texto ilegible.** Cualquier texto visible de menos de 12 px.
3. **Elementos que se salen por los costados.** Una cinta que se mueve y que
   algún contenedor recorta no cuenta: está hecha así a propósito.
4. **Botones y enlaces chicos para el dedo.** Menos de 44×44 px.
5. **Contenido tapado por una barra fija de arriba.** Por ejemplo, el título
   principal debajo del menú.
6. **Errores de consola** en cada tamaño: a veces algo falla sólo en el celular.
7. **Capturas** de cada tamaño, para mirar con los ojos lo que no se mide.

Bloquean (y el comando termina con código 1) el desborde horizontal, el texto
ilegible y un tamaño que no se pudo revisar. Lo demás se informa y se decide.

## La primera vez

El script usa Playwright, un navegador que se maneja por programa. Se instala una
sola vez, en la carpeta de esta skill (la que figura como «Base directory» al
cargarla):

```bash
cd "<carpeta de esta skill>"
npm install
npx playwright install chromium
```

Si la computadora tiene Google Chrome instalado, la revisión lo usa; si no, usa
el que baja el segundo comando.

## Cómo se corre

```bash
node "<carpeta de esta skill>/scripts/revisar.mjs" <dirección> [--salida carpeta] [--scroll 0.3,0.6,0.9] [--espera 6000] [--json]
```

- `<dirección>`: la página a revisar. Sirve una de internet o una local
  (`http://localhost:3000`). Si la web no está levantada, levantala primero.
- `--salida`: dónde guardar las capturas. Por defecto, `revision-celular/` en la
  carpeta desde donde se corre.
- `--scroll`: capturas extra a esas alturas de la página (0,5 es la mitad), para
  ver secciones que no entran en la primera pantalla.
- `--espera`: cuántos milisegundos espera a que terminen las animaciones de
  entrada antes de medir. Por defecto 6000.
- `--json`: las mediciones crudas, para otro programa.

Revisá también las páginas que importan además de la de inicio: la de un
producto, el formulario de contacto, el carrito.

## Cómo informar

Primero lo que bloquea, después lo que molesta. Siempre con el tamaño donde pasa
y el número medido: «en `celular-360` la página mide 412 px» y no «se ve un poco
ancha». Después de arreglar, corré la revisión otra vez y decí a cuánto quedó.

Mirá las capturas antes de dar el visto bueno: hay defectos que no se miden, como
dos elementos encimados o una imagen deformada. Si algo no se pudo revisar,
decilo: un tamaño que falló no es un tamaño que pasó.

## Trampas conocidas

- **Unidades `vmin` en el texto.** En vertical siguen al ancho, y el texto queda
  a la mitad de lo que se ve en la computadora. Poné un piso:
  `clamp(1rem, 4vmin, 2rem)`.
- **Tailwind y las variables.** `text-[var(--x)]` se interpreta como un color, no
  como un tamaño. Para el tamaño es `text-[length:var(--x)]`.
- **Imágenes y videos en caché.** Al reemplazar un archivo, cambiale el nombre
  (`portada.v2.jpg`). Los teléfonos guardan la copia vieja con más ganas que la
  computadora: si alguien dice que «sigue igual» después de un arreglo, sospechá
  del caché primero.
- **Una escala de espaciado que no es la de fábrica.** Si el proyecto cambia la
  unidad base de espaciado, las utilidades dejan de medir lo que parecen. Para
  el mínimo táctil escribí los píxeles: `min-h-[44px]`.
- **La barra fija y su contenedor.** El `<header>` suele ser más alto que la barra
  que se ve. Para saber qué tapa, medí lo que pinta adentro, no la caja.
- **Secciones que no entran.** Una sección centrada con muchas filas se corta
  arriba y abajo en el celular. Alinearla arriba y esconder lo secundario suele
  andar mejor que achicar todo.
- **Scroll suavizado.** En sitios que lo usan, mover la página con `scrollTo` no
  dispara las animaciones y las capturas parecen errores. El script baja con la
  rueda, como una persona.
