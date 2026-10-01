# memoria-obsidian

Memoria persistente para Claude Code en un vault de Obsidian. Cada sesión arranca leyendo un
índice y el mapa del proyecto activo; al cerrar algo que vale la pena, una skill guarda las
decisiones, los errores con su causa y el estado de cada proyecto en notas conectadas.

> **Esta skill se actualiza.** La última versión y las novedades están en
> [taller.viscel.com.ar/recursos/memoria-obsidian](https://taller.viscel.com.ar/recursos/memoria-obsidian):
> si dejás tu mail, te aviso cuando salga una nueva.

## Instalar

```bash
claude plugin marketplace add Viscel/viscel-skills
claude plugin install memoria-obsidian@viscel-skills
```

## Usar

| Comando | Qué hace |
|---|---|
| `/memoria-obsidian:iniciar` | Arma el vault (te pregunta dónde) y te propone el bloque para tu `CLAUDE.md`. Se corre una vez |
| `/memoria-obsidian:guardar` | Guarda lo importante de la sesión. También se dispara con "guardá esto en la memoria" |

El vault es una carpeta de archivos Markdown: lo podés abrir en Obsidian para ver el grafo, leerlo,
corregirlo y versionarlo con git. Obsidian es opcional.

## Actualizar

```bash
claude plugin marketplace update viscel-skills
claude plugin update memoria-obsidian@viscel-skills
```

Después reiniciá Claude Code. Qué cambió en cada versión: [CHANGELOG.md](CHANGELOG.md).

## Licencia

MIT © 2026 Viscel Labs. Hecha por Mati Nuñez: es la memoria que usa Viscel Labs todos los días.
