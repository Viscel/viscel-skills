---
title: "INDEX"
type: moc
updated: AAAA-MM-DD
tags: [#moc]
---

# INDEX

> Punto de entrada del vault. Cada sesión empieza leyendo este archivo y, si hay un proyecto
> activo, su mapa (MOC) en `01-Proyectos/`.

---

## Proyectos activos

| Proyecto | MOC | Estado |
|---|---|---|

<!-- Una fila por proyecto, por ejemplo:
| Mi app | [[_Mi-App MOC]] | En curso: login listo, falta el pago |
-->

---

## Decisiones permanentes

Las decisiones que valen para todos tus proyectos, con el porqué. Se aplican sin volver a discutirlas.

<!-- Por ejemplo:
- **Postgres sobre MongoDB para datos con relaciones**: las consultas cruzadas son la mitad del producto.
-->

---

## Entidades

- Clientes: `02-Entidades/clientes/`
- Personas: `02-Entidades/personas/`
- Tecnologías: `02-Entidades/tech/`

---

## Estructura del vault

```
01-Proyectos/   un MOC por proyecto y las notas de cada uno
02-Entidades/   clientes, personas y tecnologías que se repiten
03-Templates/   la plantilla de nota
04-Archivo/     lo que dejó de estar vigente
30-Sistemas/    procesos que usás en más de un proyecto
INDEX.md        este archivo
```
