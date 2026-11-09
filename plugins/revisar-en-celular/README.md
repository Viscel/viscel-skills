# revisar-en-celular

Revisa una web en celular, tablet y escritorio de una sola pasada y devuelve los defectos
medidos, con una captura de cada tamaño. Claude Code la usa antes de dar por terminado un
cambio en una web.

## Instalar

```bash
claude plugin marketplace add Viscel/viscel-skills
claude plugin install revisar-en-celular@viscel-skills
```

La primera vez, la skill instala Playwright en su propia carpeta (`npm install` y
`npx playwright install chromium`). Necesita Node 20 o más nuevo.

## Usar

Pedile a Claude Code «revisá cómo se ve en el celular» sobre la web en la que estés
trabajando, o corré el script vos:

```bash
node <carpeta de la skill>/scripts/revisar.mjs https://tu-web.com --scroll 0.5,0.9
```

Mide desborde horizontal, texto de menos de 12 px, elementos que se salen por los costados,
botones de menos de 44×44 px, contenido tapado por una barra fija y errores de consola. Sale con
código 1 si hay algo que bloquea.

Más detalle y novedades: https://taller.viscel.com.ar/recursos/revisar-en-celular

## Licencia

MIT. Hecho por Viscel Labs.
