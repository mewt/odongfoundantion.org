import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const en = JSON.parse(fs.readFileSync("content/en.json", "utf8"));
const id = JSON.parse(fs.readFileSync("content/id.json", "utf8"));
assert.deepEqual(Object.keys(en).sort(), Object.keys(id).sort(), "Languages must have matching content keys");
for (const dict of [en, id]) {
  assert(!JSON.stringify(dict).match(/162[,.]500[,.]000|65%|250[,.]000[,.]000/), "Remove stale fundraising numbers");
  for (const page of ["home", "about", "programs", "contact", "blog"]) {
    assert(dict["meta." + page + ".title"] && dict["meta." + page + ".desc"], "Missing page metadata");
  }
}
const source = fs.readFileSync("content/site.ts", "utf8");
for (const match of source.matchAll(/"(\/img\/[^"]+)"/g)) {
  assert(fs.existsSync(path.join("public", match[1])), "Missing asset: " + match[1]);
}
console.log("Content checks passed: bilingual keys, page metadata, local images, and no stale fundraising totals.");
