# Guía de extracción: qué guardar y qué no

El vault no es un registro de conversaciones. Es lo que el usuario necesitaría releer dentro de
tres meses para retomar sin preguntar nada. Ése es el filtro.

## El criterio de una sola pregunta

> **¿Esto se puede volver a sacar leyendo el código, el repo o el historial de git?**

Si la respuesta es sí, **no va al vault**. Va lo que sólo quedó en la conversación: el porqué de
una decisión, las alternativas descartadas, el error que costó tres horas encontrar, la restricción
del cliente que no está escrita en ningún lado.

## Qué guardar, por categoría

### Decisiones técnicas
Guardar **siempre** la decisión, las alternativas que se evaluaron y la razón. Una decisión sin el
porqué se revierte a los dos meses, porque nadie recuerda qué problema resolvía.

- ✅ "Se eligió un servicio de video con streaming adaptativo y no un mp4 en el bucket: el mp4 crudo se traba en celulares con 3G"
- ❌ "Se usó el servicio de video"

### Bugs resueltos
Sólo los **que costaron**: los que costó encontrar, los que tenían una causa que no se adivina,
los que se van a repetir. Guardar síntoma, causa raíz y arreglo.

- ✅ "En JS el `.` no matchea `\r`: en archivos CRLF la última línea del frontmatter rompe cualquier regex `^clave:(.*)$`"
- ❌ "Faltaba un punto y coma"

### Proyectos
Cambios de estado, decisiones de alcance, bloqueos, fechas comprometidas. El estado va en el MOC
del proyecto, no en una nota nueva.

### Clientes y personas
Preferencias, restricciones, forma de trabajar, datos de contacto reales. Va a
`02-Entidades/clientes/` o `personas/`, porque se comparte entre proyectos.

- ✅ "La dueña de la panadería no quiere que la dirección del local aparezca en la web: atiende sólo con reserva"

### Workflows y automatizaciones
Los pasos concretos, los nodos, los IDs, las credenciales **por nombre**. Un workflow descrito a
medias no sirve para reconstruirlo.

### Skills de Claude Code
Dónde viven, para qué sirven y, sobre todo, las decisiones de diseño que se tomaron al hacerlas.

### Lo que el usuario corrige
Cuando corrige algo o confirma un enfoque, **eso es permanente**. Guardar la frase textual y qué
implica. Es lo que evita repetir el mismo error en la próxima sesión.

- ✅ "El usuario: 'los efectos tienen que notarse, si no se ven no sirven'. Cada proyecto tiene que superar al anterior"

## Qué NO guardar

- Preguntas informativas sin decisión ni resultado
- Lo que ya está en el repo, en el código o en el `CLAUDE.md`
- Resúmenes de lo que se hizo sin el razonamiento detrás
- Cosas que sólo importan dentro de esta conversación
- Secretos de cualquier tipo: keys, tokens, contraseñas, contenido de un `.env`.
  Se guarda el **nombre** del servicio y dónde vive la credencial, nunca el valor

## Cómo clasificar

Cuando dudes entre proyecto y entidad:

- **Proyecto** si sólo aplica a ese trabajo: `01-Proyectos/{proyecto}/`
- **Entidad** si se comparte entre proyectos (una tecnología, un cliente, una persona):
  `02-Entidades/{tipo}/`
- **Sistema** si es un proceso que se repite (un playbook, un runbook): `30-Sistemas/`

Ante la duda, entidad: es más fácil linkear desde varios proyectos que partir una nota después.

## Granularidad

Una nota por **tema**, no por sesión. Si en una conversación se avanzó en tres frentes del mismo
proyecto, casi siempre es una sola nota actualizada, no tres nuevas. Si el mismo tema vuelve en
otra sesión, se amplía la nota que existe con la fecha nueva, no se crea una v2.
