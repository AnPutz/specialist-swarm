#!/usr/bin/env node
// Validiert elves.json gegen die Wichtel-Designregeln (ohne Abhängigkeiten).
// Strukturregeln spiegeln elves.schema.json; Katalog- und Abdeckungsregeln nur hier.
const fs = require("fs");
const path = require("path");

const file = process.argv[2] || path.join(__dirname, "elves.json");
const MAX = 3;
const MAX_POOL = 9999;
const errors = [];
const err = (m) => errors.push(m);

let d;
try {
  d = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (e) {
  console.error(`FEHLER: ${file} nicht lesbar: ${e.message}`);
  process.exit(1);
}

const aspekte = Array.isArray(d.rfp_aspekte) ? d.rfp_aspekte : [];
const wichtel = Array.isArray(d.wichtel) ? d.wichtel : [];
if (!aspekte.length) err("rfp_aspekte fehlt oder ist leer");
if (!wichtel.length) err("wichtel fehlt oder ist leer");
if (wichtel.length > MAX_POOL) err(`${wichtel.length} Wichtel (Pool-Maximum ${MAX_POOL})`);

const covered = new Set();
const names = new Set();
for (const w of wichtel) {
  const n = w.name || "(ohne Name)";
  if (names.has(n)) err(`${n}: Name doppelt vergeben`);
  names.add(n);
  if (!w.rolle) err(`${n}: Rolle fehlt`);
  const f = Array.isArray(w.faehigkeiten) ? w.faehigkeiten : [];
  if (f.length < 1 || f.length > MAX) err(`${n}: ${f.length} Fähigkeiten (erlaubt 1 bis ${MAX})`);
  if (new Set(f).size !== f.length) err(`${n}: doppelte Fähigkeit`);
  for (const x of f) {
    if (!aspekte.includes(x)) err(`${n}: Fähigkeit "${x}" steht nicht im Katalog`);
    covered.add(x);
  }
}
for (const a of aspekte) if (!covered.has(a)) err(`RFP-Aspekt "${a}" ist von keinem Wichtel abgedeckt`);

if (errors.length) {
  console.error(errors.map((e) => `FEHLER: ${e}`).join("\n"));
  process.exit(1);
}
console.log(`OK: ${wichtel.length} Wichtel, ${aspekte.length} Aspekte, alle Regeln erfüllt`);
