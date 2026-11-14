// Comprueba que el catálogo respeta el presupuesto de contexto (ADR-0007) y sus convenciones.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CAT = join(RAIZ, "catalog");
const MAX_DESC_SKILL = 300;
const MAX_DESC_AGENTE = 200;

function fm(texto) {
  const m = /^---\n([\s\S]*?)\n---/.exec(texto);
  const out = {};
  for (const l of (m?.[1] || "").split("\n")) {
    const kv = /^([\w-]+):\s*(.*)$/.exec(l);
    if (kv) out[kv[1]] = kv[2];
  }
  return out;
}

const skills = readdirSync(join(CAT, "skills")).filter((d) => existsSync(join(CAT, "skills", d, "SKILL.md")));
const agentes = readdirSync(join(CAT, "agents")).filter((f) => f.endsWith(".md"));

describe("skills", () => {
  for (const s of skills) {
    test(s, () => {
      const meta = fm(readFileSync(join(CAT, "skills", s, "SKILL.md"), "utf8"));
      assert.equal(meta.name, s, "name = nombre de carpeta");
      assert.ok(meta.description, "tiene description");
      assert.ok(meta.description.length <= MAX_DESC_SKILL, `description ${meta.description.length} > ${MAX_DESC_SKILL}`);
    });
  }
});

describe("agentes", () => {
  for (const a of agentes) {
    test(a, () => {
      const meta = fm(readFileSync(join(CAT, "agents", a), "utf8"));
      assert.equal(`${meta.name}.md`, a);
      assert.ok(meta.description && meta.description.length <= MAX_DESC_AGENTE, `description ≤ ${MAX_DESC_AGENTE}`);
      assert.match(meta.model || "", /^(haiku|sonnet|opus)$/, "modelo explícito");
      if (a.startsWith("revisor-") || a === "verificador-hallazgos.md" || a === "explorador.md") {
        assert.doesNotMatch(meta.tools, /Edit|Write|Bash/, "los revisores son de solo lectura");
      }
    });
  }
});

describe("presupuesto siempre activo", () => {
  test("orientación ≤ 1 KB", () => {
    assert.ok(statSync(join(CAT, "always-on/orientacion.md")).size <= 1024);
  });
  test("plantilla CLAUDE.md ≤ 120 líneas", () => {
    assert.ok(readFileSync(join(CAT, "templates/CLAUDE.md"), "utf8").split("\n").length <= 120);
  });
  test("skills automáticas ≤ 12 en un proyecto con todos los módulos (con cada variante)", () => {
    const { modulos } = JSON.parse(readFileSync(join(RAIZ, "manifests/modules.json"), "utf8"));
    const auto = (s) => !/disable-model-invocation:\s*true/.test(readFileSync(join(CAT, "skills", s, "SKILL.md"), "utf8"));
    const variantes = [null, ...new Set(Object.values(modulos).flatMap((m) => Object.keys(m.variantes || {})))];
    for (const v of variantes) {
      const total = new Set(Object.values(modulos).flatMap((m) => (v && m.variantes?.[v] ? m.variantes[v] : m).skills || []).filter(auto));
      assert.ok(total.size <= 12, `${total.size} skills automáticas (variante ${v || "por defecto"})`);
    }
  });
});

describe("plantillas", () => {
  test("settings.json y mh.json son JSON válido y los hooks existen", () => {
    const settings = JSON.parse(readFileSync(join(CAT, "templates/settings.json"), "utf8"));
    JSON.parse(readFileSync(join(CAT, "templates/mh.json"), "utf8"));
    const cmds = JSON.stringify(settings.hooks).match(/\.mh\/hooks\/[\w-]+\.mjs/g);
    for (const c of cmds) assert.ok(existsSync(join(CAT, "hooks", c.replace(".mh/hooks/", ""))), c);
  });
  test("glosarios de la factoría y de la web sincronizados con docs/glosario.md", () => {
    const terminos = (t) => [...t.matchAll(/^### (.+)$/gm)].map((m) => m[1]);
    const docs = terminos(readFileSync(join(RAIZ, "docs/glosario.md"), "utf8"));
    const plantilla = terminos(readFileSync(join(CAT, "templates/brain/wiki/factoria/glosario.md"), "utf8"));
    assert.deepEqual(plantilla, docs);
    // La web omite los términos marcados <!-- solo-factoria --> (Camunda, de momento)
    const fuente = readFileSync(join(RAIZ, "docs/glosario.md"), "utf8");
    const soloFactoria = [...fuente.matchAll(/^### (.+)\n<!-- solo-factoria -->$/gm)].map((m) => m[1]);
    const web = terminos(readFileSync(join(RAIZ, "docs/guia/ayuda/glosario.md"), "utf8"));
    assert.deepEqual(web, docs.filter((t) => !soloFactoria.includes(t)), "glosario de la guía web desactualizado: python3 -I tools/generar-glosario-factoria.py");
  });
});

describe("manifiesto de módulos", () => {
  const { modulos } = JSON.parse(readFileSync(join(RAIZ, "manifests/modules.json"), "utf8"));
  const usados = { skills: new Set(), agentes: new Set(), reglas: new Set() };
  test("todo lo que cita existe", () => {
    const conVariantes = Object.entries(modulos).flatMap(([id, m]) => [[id, m], ...Object.entries(m.variantes || {}).map(([v, x]) => [`${id}/${v}`, x])]);
    for (const [id, m] of conVariantes) {
      for (const s of m.skills || []) { assert.ok(existsSync(join(CAT, "skills", s, "SKILL.md")), `${id}: skill ${s}`); usados.skills.add(s); }
      for (const a of m.agentes || []) { assert.ok(existsSync(join(CAT, "agents", `${a}.md`)), `${id}: agente ${a}`); usados.agentes.add(a); }
      for (const r of m.reglas || []) { assert.ok(existsSync(join(CAT, "rules", `${r}.md`)), `${id}: regla ${r}`); usados.reglas.add(r); }
      for (const v of m.vendor || []) assert.ok(existsSync(join(CAT, "vendor", v)), `${id}: vendor ${v}`);
      for (const h of m.hooks || []) assert.ok(existsSync(join(CAT, "hooks", `${h}.mjs`)), `${id}: hook ${h}`);
      for (const r of m.requiere || []) assert.ok(modulos[r], `${id} requiere ${r}`);
    }
  });
  test("todo el catálogo pertenece a algún módulo", () => {
    for (const s of skills) assert.ok(usados.skills.has(s), `skill ${s} sin módulo`);
    for (const a of agentes) assert.ok(usados.agentes.has(a.replace(".md", "")), `agente ${a} sin módulo`);
    for (const r of readdirSync(join(CAT, "rules"))) assert.ok(usados.reglas.has(r.replace(".md", "")), `regla ${r} sin módulo`);
  });
  test("las reglas llevan paths (nada siempre activo)", () => {
    for (const r of readdirSync(join(CAT, "rules"))) assert.match(readFileSync(join(CAT, "rules", r), "utf8"), /^---\npaths:/, r);
  });
});

describe("permisos de la plantilla", () => {
  const allow = JSON.parse(readFileSync(join(CAT, "templates", "settings.json"), "utf8")).permissions.allow;
  for (const f of readdirSync(join(CAT, "scripts")).filter((x) => x.endsWith(".mjs"))) {
    test(`permite ${f}`, () => assert.ok(allow.includes(`Bash(node .mh/scripts/${f} *)`), `falta el permiso de ${f} en settings.json`));
  }
});

describe("skill ftd", () => {
  const ftd = readFileSync(join(CAT, "skills", "ftd", "SKILL.md"), "utf8");
  test("marca la tarea en curso al crear la rama", () => assert.match(ftd, /estado <id> enCurso/));
  test("la revisión deja su registro", () => assert.match(ftd, /brain\/factory\/revisiones\//));
});
