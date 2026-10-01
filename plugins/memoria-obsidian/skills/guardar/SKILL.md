---
name: guardar
description: Guarda el contexto de la conversación en tu vault de Obsidian como notas .md conectadas con wikilinks, para que la próxima sesión arranque sabiendo lo que pasó. Usala al cerrar una sesión donde se construyó algo, se tomó una decisión, se resolvió un bug que costó encontrar o se creó una skill. Se dispara con "guardá esto", "guardalo en la memoria", "actualizá el vault", "guardá en obsidian", "actualizá la memoria", "guardá el contexto". Si todavía no hay vault, primero va /memoria-obsidian:iniciar.
---

# Memoria en Obsidian: guardar

Sos la memoria permanente del usuario. Analizás la conversación, te quedás con lo que importa y
lo guardás en su vault como notas `.md` con estructura y wikilinks, para que en la próxima sesión
no tenga que explicar nada de nuevo.

## Dónde está el vault

La ruta está en el `CLAUDE.md` del usuario (normalmente `~/.claude/CLAUDE.md`), en el bloque
`## Memoria en Obsidian`, en la línea `Vault: <ruta>`. El punto de entrada es `<ruta>/INDEX.md`.

- Si no encontrás el bloque, no inventes una ruta: decile que corra `/memoria-obsidian:iniciar`.
- Si no tenés acceso al disco (por ejemplo en claude.ai), armá las notas igual y entregáselas como
  archivos, con la ruta donde va cada una dentro del vault, para que las copie él.

## Estructura del vault (respetarla)

| Carpeta | Qué va |
|---|---|
| `01-Proyectos/` | Un `_{Proyecto} MOC.md` por proyecto y las notas de cada proyecto en su carpeta |
| `02-Entidades/` | `clientes/`, `personas/`, `tech/`: nodos que se comparten entre proyectos |
| `03-Templates/` | `context-note.md`, la plantilla de nota |
| `30-Sistemas/` | Procesos que se usan en más de un proyecto (playbooks, runbooks) |
| `04-Archivo/` | Lo que dejó de estar vigente |

El **MOC** (mapa de contenido) de cada proyecto es su índice: estado, decisiones y links a todas
sus notas. Una nota nueva siempre se linkea desde su MOC, o queda huérfana.

---

## Cuándo activar

**Siempre que:**
- Se construyó algo: un workflow, una app, una skill, un script, una web
- Se tomó una decisión técnica o de negocio con un porqué
- Se resolvió un bug que costó encontrar
- Se definió arquitectura, stack o proceso
- Apareció un cliente, un proyecto o una herramienta nueva
- Se creó o se cambió una skill
- El usuario dice "guardá", "vault", "obsidian" o "memoria"

**No activar para:** preguntas informativas sin resultado, charlas teóricas sin decisiones, o
cosas que ya están guardadas y no cambiaron.

---

## Proceso

### 1 · Leer el índice

Leé `INDEX.md`: tiene los proyectos activos, las decisiones permanentes y las entidades. Desde ahí
seguí al MOC del proyecto que toca.

### 2 · Buscar antes de crear

Encontrá qué notas ya cubren el tema y **leelas antes de tocarlas**. La regla del vault es
actualizar antes que crear: si ya hay una nota del tema, se amplía, no se duplica.

### 3 · Extraer

Recorré la conversación completa y quedate con lo que entra en estas categorías. El criterio
detallado, con ejemplos de qué sí y qué no, está en `references/extraction-guide.md`.

| Categoría | Qué buscar |
|---|---|
| **Proyectos** | Proyecto nuevo, cambio de estado, función nueva, decisión de alcance |
| **Workflows** | Flujos, scripts, sistemas con pasos concretos |
| **Decisiones técnicas** | Elección de stack, patrón o herramienta, con el porqué |
| **Bugs resueltos** | Síntoma, causa raíz y arreglo, sobre todo si costó encontrarlo |
| **Skills** | Skills creadas o cambiadas, dónde viven y para qué sirven |
| **Personas y empresas** | Clientes, contactos, relaciones de trabajo |
| **Servicios** | Qué servicio se conectó y para qué. Nunca el secreto: sólo el nombre |
| **Tareas cerradas** | Lo que estaba pendiente y se terminó |

### 4 · Planificar

Antes de escribir, decidí qué se actualiza, qué se crea, qué secciones cambian y qué wikilinks se
agregan. La mayoría de las veces lo nuevo entra en una nota de proyecto que ya existe.

### 5 · Escribir

Los formatos exactos por tipo de nota están en `references/file-templates.md`.

- Frontmatter completo: `title`, `type`, `project`, `status`, `updated`, `tags`, `related`
- `[[wikilinks]]` para nombrar otras notas: con eso se arma el grafo
- En el idioma del vault
- Específico: datos concretos, rutas, números, nombres. Nada de resúmenes vagos
- Se conserva lo que ya estaba: se agregan o se cambian secciones, no se reescribe de cero
- Fechas absolutas (`3-ago-2026`), nunca "ayer" ni "la semana pasada"
- **Nunca** API keys, tokens ni contraseñas: sólo el nombre del servicio y dónde vive la credencial

### 6 · Backlinks

Si creaste una nota, agregá el `[[wikilink]]` desde el MOC del proyecto y desde cada entidad que
menciona. Una nota sin backlinks no la encuentra nadie.

### 7 · Actualizar el índice

Tocá `INDEX.md` sólo cuando cambia el estado de un proyecto, aparece uno nuevo o se suma una
decisión permanente. El índice es corto a propósito: se lee al principio de cada sesión.

### 8 · Reportar

Terminá con un resumen de lo que hiciste:

```
Vault actualizado: 3-ago-2026

Actualizados:
  01-Proyectos/_Mi-App MOC.md: estado del login

Creados:
  01-Proyectos/mi-app/decision-sesion.md: por qué sesión propia y no un proveedor

Conexiones nuevas:
  [[decision-sesion]] con [[_Mi-App MOC]]
```

---

## Referencias

- `references/extraction-guide.md`: qué cuenta como importante y cómo clasificarlo
- `references/file-templates.md`: los formatos de cada tipo de nota
