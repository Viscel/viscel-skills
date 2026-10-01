---
name: iniciar
description: Arma el vault de Obsidian que usa la memoria de Claude Code y te propone el bloque para tu CLAUDE.md, así cada sesión empieza leyendo el índice. Usala una vez, antes del primer guardado, o para apuntar la memoria a otro vault. Se dispara con "armá la memoria", "iniciá el vault", "configurá la memoria en obsidian", "quiero empezar a usar la memoria". Para guardar una sesión está /memoria-obsidian:guardar.
---

# Memoria en Obsidian: iniciar

Dejás armado el vault donde va a vivir la memoria y le explicás al usuario cómo se usa. Son cinco
pasos. No escribís nada fuera de la carpeta que elija el usuario y de su `CLAUDE.md`, y en el
`CLAUDE.md` sólo escribís con su permiso.

## 1 · Elegir la carpeta

Preguntá dónde quiere el vault. Sugerí `~/Documents/Cerebro` (en Windows,
`%USERPROFILE%\Documents\Cerebro`). Si ya usa Obsidian, puede ser una carpeta adentro de su vault.

Si en esa carpeta ya hay un `INDEX.md`, no pises nada: preguntá si quiere usar ese vault como está.
Si dice que sí, saltá al paso 4.

## 2 · Copiar la plantilla

La plantilla está en `plantilla-vault/`, dentro de la carpeta de esta skill. Copiá a la carpeta
elegida:

- `INDEX.md`
- `03-Templates/context-note.md`
- las carpetas vacías: `01-Proyectos/`, `02-Entidades/clientes/`, `02-Entidades/personas/`,
  `02-Entidades/tech/`, `04-Archivo/` y `30-Sistemas/` (no copies los `.gitkeep`)

**Nunca sobrescribas un archivo que ya exista.** Si alguno está, dejalo y avisale.

## 3 · Completar el índice

En el `INDEX.md` copiado, reemplazá `AAAA-MM-DD` por la fecha de hoy. Si el usuario ya te contó
en qué proyectos está, ofrecé sumarlos a la tabla de proyectos activos.

## 4 · Proponer el bloque para el CLAUDE.md

El bloque va en su `CLAUDE.md` global (`~/.claude/CLAUDE.md`). Mostráselo entero, con la ruta real:

```markdown
## Memoria en Obsidian
Vault: <ruta>
Al iniciar una sesión: leé <ruta>/INDEX.md y el MOC del proyecto activo.
Al cerrar algo relevante (decisión, avance, bug resuelto): usá /memoria-obsidian:guardar.
```

Preguntale si lo agregás. **Esperá la respuesta.**

- Si dice que sí: agregalo al final del archivo, sin tocar lo que ya tiene (si el archivo no
  existe, crealo con sólo este bloque). Si ya había un bloque `## Memoria en Obsidian`, reemplazá
  ese bloque y nada más.
- Si dice que no: dejale el bloque para que lo pegue él cuando quiera.

## 5 · Cerrar

Contale en pocas líneas:

- dónde quedó el vault y qué carpetas tiene;
- que la próxima sesión va a arrancar leyendo `INDEX.md`;
- que cuando cierre algo que valga la pena corra `/memoria-obsidian:guardar` (o le pida
  "guardá esto en la memoria");
- que si usa Obsidian, abra la carpeta como vault para ver el grafo.

## Reglas

- No escribas fuera de la carpeta del vault y del `CLAUDE.md` global.
- No escribas en el `CLAUDE.md` sin un sí explícito.
- No guardes secretos en ningún archivo del vault, tampoco de ejemplo.
