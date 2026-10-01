# viscel-skills

Skills gratis del [Taller de Viscel](https://taller.viscel.com.ar), publicadas como plugins de
Claude Code. Salen de los sistemas que usa Viscel Labs en producción y se actualizan: cuando sale
una versión nueva, la ficha del Taller lo dice y, si dejaste tu mail, te llega el aviso.

## Sumar el marketplace

```bash
claude plugin marketplace add Viscel/viscel-skills
```

## Plugins

| Plugin | Qué hace | Ficha |
|---|---|---|
| `memoria-obsidian` | Memoria persistente para Claude Code en un vault de Obsidian | [taller.viscel.com.ar/recursos/memoria-obsidian](https://taller.viscel.com.ar/recursos/memoria-obsidian) |

```bash
claude plugin install memoria-obsidian@viscel-skills
```

## Cómo se publica

- Cada plugin tiene su `CHANGELOG.md`; la versión de `plugin.json` es la primera entrada.
- Un release es un tag `{plugin}--v{versión}` (el formato de `claude plugin tag`). El workflow arma
  los zips (la skill para subir a claude.ai y el vault de arranque) y los adjunta al release.
- Antes de cada publicación corre un control de saneamiento contra una lista de bloqueo que **no**
  vive en este repo: si encuentra un dato que no tiene que estar acá, el CI falla y no se publica.

## Licencia

MIT © 2026 Viscel Labs. Ver [LICENSE](LICENSE).
