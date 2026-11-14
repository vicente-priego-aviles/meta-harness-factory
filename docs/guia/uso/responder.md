# Responder

Es el [carril](../ayuda/glosario.md#carril) de las **preguntas**: dónde está algo, por qué funciona así, qué pasaría si… El agente busca, lee y contesta, y **no escribe ningún archivo**.

## Cómo se usa
Pregunta con naturalidad. El agente anuncia el carril en una línea y responde:

```text
Tú:      ¿Cómo llega una visita nueva a tener veterinario asignado?
Agente:  Carril: Responder.
         …
```

## Qué aporta meta-harness-factory en una pregunta
Las dos versiones, con y sin [harness](../ayuda/glosario.md#harness), suelen encontrar lo que se pregunta. La diferencia está en lo que el agente **ve alrededor**. Con **[meta-harness-factory](../ayuda/glosario.md#meta-harness)** carga solo cuando lo necesita el contexto del stack (las reglas de Java, de dominio o de migraciones se cargan al leer archivos de su terreno) y consulta el [brain](../ayuda/glosario.md#brain) del proyecto. Por eso la respuesta tiende a señalar también lo que incumple las reglas del proyecto o un fallo cercano, aunque no se haya preguntado por ello.

## Cuánto cuesta
| | Sin meta-harness-factory | Con meta-harness-factory |
|---|---|---|
| Coste | 0,092 USD | 0,131 USD (+42 %) |
| Turnos | 4 | 7 |

<small>Medido en otro proyecto Spring Boot con Sonnet. Las medidas en PetClinic Modulith están en [Evaluación](../evaluacion/index.md).</small>

Una pregunta cuesta algo más con **meta-harness-factory**, porque el agente lee más (las reglas, el brain) y cada turno vuelve a leer todo el contexto. A cambio, la respuesta es más completa. La diferencia en céntimos es pequeña; en la sección de [tokens](../tokens/index.md) está el desglose.

> [!tip] Preguntas más baratas
> - **Sé concreto**: «¿qué hace `VetRoster` si no hay ningún veterinario?» cuesta menos que «explícame los módulos».
> - **Pregunta antes de pedir un cambio**: una respuesta cuesta céntimos; un cambio mal planteado, mucho más.
> - Para exploraciones grandes, el agente recurre al [subagente](../ayuda/glosario.md#subagente) `explorador`, que usa un modelo de lenguaje ([LLM](../ayuda/glosario.md#llm)) pequeño y barato (Haiku) y devuelve un resumen en vez de llenar la conversación de archivos.

## Cuándo una pregunta se convierte en otra cosa
Si en la respuesta aparece un fallo («esto nunca se captura»), el agente lo dice pero **no lo arregla** por su cuenta. Tú decides: «arréglalo» lo convierte en un [FTD](../ayuda/glosario.md#ftd); si hay que decidir cómo arreglarlo, en un [ASDD](../ayuda/glosario.md#asdd).
