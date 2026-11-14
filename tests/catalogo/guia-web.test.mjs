// La guía web habla solo de un proyecto de ejemplo (Spring PetClinic Modulith): ni Camunda ni Vaadin, de momento.
// Los módulos camunda y vaadin siguen en el catálogo; aquí solo se vigila lo que se publica en la web.
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROHIBIDO = /camunda|bpmn|\bdmn\b|zeebe|vaadin|\bfeel\b|\bworkers?\b|\bjobs?\b/i;

function archivos(dir, ext) {
  return readdirSync(dir).flatMap((n) => {
    const r = join(dir, n);
    return statSync(r).isDirectory() ? archivos(r, ext) : ext.some((e) => n.endsWith(e)) ? [r] : [];
  });
}

test("la guía web no menciona Camunda ni Vaadin", () => {
  const revisar = [
    ...archivos(join(RAIZ, "docs/guia"), [".md"]),
    ...archivos(join(RAIZ, "docs/guia/assets/diagramas"), [".svg"]),
    join(RAIZ, "mkdocs.yml"),
  ];
  const hallazgos = [];
  for (const f of revisar) {
    readFileSync(f, "utf8").split("\n").forEach((l, i) => {
      const m = PROHIBIDO.exec(l);
      if (m) hallazgos.push(`${relative(RAIZ, f)}:${i + 1} «${m[0]}»`);
    });
  }
  assert.deepEqual(hallazgos, [], `menciones fuera de lugar en la guía web:\n${hallazgos.join("\n")}`);
});
