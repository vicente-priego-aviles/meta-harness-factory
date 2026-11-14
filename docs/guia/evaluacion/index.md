# Evaluación

¿Trabaja mejor el agente con **[meta-harness-factory](../ayuda/glosario.md#meta-harness)** que sin él? Para responderlo se pide lo mismo dos veces sobre Spring PetClinic Modulith: una con el [harness](../ayuda/glosario.md#harness) instalado y otra sin él, y se compara qué entrega cada uno, cuánto cuesta y qué se le escapa. Aquí están los resultados **tal como salieron**, también lo que salió mal.

## Resumen
| Caso | [Carril](../ayuda/glosario.md#carril) con harness | Con harness | Sin harness | Conclusión |
|---|---|---|---|---|
| [C10·2 · Línea temporal de visitas](c10-linea-temporal-visitas.md) | [FTD](../ayuda/glosario.md#ftd) | 0,65 USD · tests primero, revisión, commit | 0,35 USD · sin tests ni commit | **Gana el harness**: su revisor encontró un error 500 que la otra versión deja dentro |
| [C16·1 · Gráfico de tipos de mascota](c16-grafico-tipos-mascota.md) | [ASDD](../ayuda/glosario.md#asdd) | ≈ 2,0 USD · [spec](../ayuda/glosario.md#spec), plan, revisión y verificación | 0,50 USD · sin proceso | **Pierde el harness**: pregunta en vez de suponer, pero entrega el gráfico mal pintado |

Lo que enseñan los dos juntos:

- **El harness hace que el agente se comporte como un equipo disciplinado**: elige carril, calcula el [riesgo](../ayuda/glosario.md#riesgo) antes de tocar nada, escribe tests, pide una revisión de [contexto limpio](../ayuda/glosario.md#revisor-de-contexto-limpio) y deja escrito lo que no comprobó.
- **Eso cuesta más**: entre 2 y 4 veces lo de un agente sin proceso. Compensa cuando la revisión encuentra algo (C10·2); no compensa si lo que falla es justo lo que nadie comprobó (C16·1).
- **El proceso no sustituye a mirar el resultado**: en C16·1, 74 tests en verde y una verificación aprobada convivían con un gráfico roto. La comprobación visual quedó como «no ejecutada» y era la que fallaba.

## Cómo se mide
- **Proyecto**: [Spring PetClinic Modulith](https://github.com/spring-petclinic/spring-petclinic-modulith), en un [repositorio de pruebas](https://github.com/vicente-priego-aviles/meta-harness-petclinic) con una issue, una rama y una [PR](../ayuda/glosario.md#pr) por caso.
- **Con harness**: desde `main`, con el harness instalado, y el pedido «Empieza la tarea #N».
- **Sin harness**: un clon desechable del commit original, con el texto de la issue como pedido.
- **Agente**: Claude Code en modo no interactivo (`claude -p`) con Sonnet 5.5; los [subagentes](../ayuda/glosario.md#subagente) usan su propio modelo. Mismos permisos en los dos: ediciones aceptadas y comandos de `git`, `gh` y Maven, sin poder integrar PR.
- **Coste**: el que informa Claude Code, a tarifas de la API. Cuando el agente se para a preguntar, se continúa la misma sesión con respuestas fijadas de antemano, iguales a lo que decidió la versión sin harness.

> [!warning] Límites de estas medidas
> Son dos casos y una ejecución de cada uno: sirven para ver **cómo** se comporta el harness, no para dar porcentajes. En modo no interactivo nadie aprueba permisos, y eso afectó a un subagente en C16·1. Las [skills](../ayuda/glosario.md#skill) globales del usuario cargaban en las dos versiones.

## Qué se ha cambiado gracias a esto
Cada caso destapó fallos del harness, que se corrigieron con su test antes del siguiente:

- permiso para los scripts `tarea` y `traza` en `settings.json`;
- en GitHub, las etiquetas de estado se crean solas la primera vez;
- el FTD marca la tarea «en curso» al empezar y la revisión deja siempre su registro;
- el [modo traza](../ayuda/glosario.md#modo-traza) muestra los permisos pedidos y denegados (🔐);
- los registros de sesión quedan fuera de git.

Pendiente, a partir de C16·1: que el agente sepa cuándo un proyecto versiona la CSS compilada, que el subagente `desarrollador` tenga permiso para ejecutar los tests en modo no interactivo, y una comprobación visual en el cierre de los cambios de interfaz.
