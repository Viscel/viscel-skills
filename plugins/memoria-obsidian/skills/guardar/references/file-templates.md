# Formatos por tipo de nota

Todas las notas del vault llevan frontmatter completo. La plantilla base vive en
`03-Templates/context-note.md`; acá está el detalle por tipo, con los valores válidos.

## Frontmatter: campos y valores

```yaml
---
title: "Título de la nota"
type: proyecto | entidad | moc | nota | archivo
project: el-slug-del-proyecto   # por ejemplo mi-app, web-panaderia, automatizaciones
status: activo | pausado | completado | archivado | en-curso | entregado
updated: 2026-08-03
tags: [#arquitectura, #decision, #cliente]
related: ["_Mi-App MOC", "nota-relacionada"]
---
```

`updated` siempre en `AAAA-MM-DD` y siempre la fecha real de hoy. `related` usa los nombres de
archivo sin extensión, que después se linkean con `[[...]]` en el cuerpo.

---

## 1 · Nota de proyecto

Va en `01-Proyectos/{proyecto}/{tema}.md`. Es el caso más común.

```markdown
---
title: "Título del tema"
type: nota
project: mi-app
status: en-curso
updated: 2026-08-03
tags: [#decision, #web]
related: ["_Mi-App MOC", "entidad-relacionada"]
---

# Título del tema

Una o dos frases de qué es esto y en qué momento del proyecto apareció.

## Decisiones (y por qué)

1. **Qué se decidió**: la razón concreta. Si se descartó una alternativa, cuál y por qué.
   Sin el porqué, la decisión se revierte sola en dos meses.

## Estado actual

Qué está hecho, qué está en curso, qué está bloqueado y por quién.

## Gotchas y aprendizajes

El error que costó encontrar, con síntoma y causa raíz. Es la sección que más vale releer.

## Próximos pasos

1. Tarea concreta, con responsable si aplica.

## Relaciones

- [[_Mi-App MOC]]
- [[entidad-tech-usada]]
```

## 2 · MOC de proyecto

`01-Proyectos/_{Proyecto} MOC.md`. Es el índice del proyecto: estado y links. Los detalles **no**
van acá: van en notas linkeadas.

```markdown
---
title: "Mi App: MOC"
type: moc
project: mi-app
status: activo
updated: 2026-08-03
tags: [#moc]
---

# Mi App

> **Estado:** una línea con el estado real y la fecha.

## Qué es

Dos o tres líneas. Para quién, qué resuelve, dónde vive.

## Notas

- [[nota-1]]: qué contiene
- [[nota-2]]: qué contiene

## Stack y entidades

- [[postgres]] · [[nextjs]] · [[claude-api]]

## Próximos pasos

- [ ] Tarea
```

## 3 · Entidad

`02-Entidades/{clientes|personas|tech}/{nombre}.md`. Nodo compartido: lo que es cierto del cliente
o de la tecnología **independientemente del proyecto**.

```markdown
---
title: "Nombre de la entidad"
type: entidad
status: activo
updated: 2026-08-03
tags: [#cliente]
related: ["_Mi-App MOC"]
---

# Nombre

## Quién es o qué es

## Datos duros

Contacto real, URLs, IDs, ubicación. Nunca credenciales.

## Preferencias y restricciones

Lo que pidió de forma expresa, lo que no quiere, cómo le gusta trabajar.

## Proyectos donde aparece

- [[_Mi-App MOC]]
```

## 4 · Sistema o playbook

`30-Sistemas/{sistema}/{nombre}.md`. Un proceso que se repite entre proyectos: runbooks,
playbooks, convenciones.

La misma estructura que una nota de proyecto, con `type: nota` y sin `project`, más una sección
**Cómo se corre** con los pasos exactos.

---

## Reglas para todas las notas

- **Un tema por nota.** Si el título necesita una "y", probablemente son dos notas.
- **Actualizar antes que crear.** Si el tema ya tiene nota, se amplía con la fecha nueva.
- **Fechas absolutas.** `3-ago-2026`, nunca "ayer" ni "la semana pasada".
- **Rutas completas.** `~/proyectos/mi-app/src/...`: la nota se lee meses después, sin contexto.
- **Backlinks obligatorios.** Toda nota nueva se linkea desde su MOC y desde las entidades que
  menciona; si no, queda huérfana en el grafo.
- **Cero secretos.** El nombre del servicio y dónde vive la credencial, nunca el valor.
