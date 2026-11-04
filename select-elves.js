#!/usr/bin/env node
// Wählt Wichtel aus dem Pool nach Fähigkeit.
//
// Verfahren (greedy Set-Cover mit Mehrfachbedarf):
//   1. Je RFP-Aspekt wird ein Bedarf (Anzahl Wichtel) geführt.
//   2. Wiederholt wird der Wichtel gewählt, der die meisten offenen Bedarfe
//      bedient. Bei Gleichstand gewinnt der Spezialist (weniger Fähigkeiten),
//      danach die Pool-Reihenfolge. So bleibt die Auswahl deterministisch.
//   3. Ein Wichtel zählt je Aspekt höchstens einmal.
//
// CLI:  node select-elves.js [Aspekt,Aspekt,...] [--per N] [--budget N] [--pool datei]
// Ohne Aspekte werden alle Aspekte aus dem Pool angefragt.
const fs = require("fs");
const path = require("path");

function select(pool, bedarf, budget = Infinity) {
  const open = new Map(Object.entries(bedarf).filter(([, n]) => n > 0));
  const gewaehlt = [];
  const genommen = new Set();

  while (open.size && gewaehlt.length < budget) {
    let best = null;
    let bestScore = 0;
    for (let i = 0; i < pool.length; i++) {
      if (genommen.has(i)) continue;
      const f = pool[i].faehigkeiten;
      const score = f.filter((x) => open.has(x)).length;
      if (score === 0) continue;
      if (
        score > bestScore ||
        (score === bestScore && f.length < pool[best].faehigkeiten.length)
      ) {
        best = i;
        bestScore = score;
      }
    }
    if (best === null) break; // Pool kann den Rest nicht bedienen

    genommen.add(best);
    const w = pool[best];
    const bedient = w.faehigkeiten.filter((x) => open.has(x));
    gewaehlt.push({ wichtel: w, bedient });
    for (const x of bedient) {
      const rest = open.get(x) - 1;
      if (rest <= 0) open.delete(x);
      else open.set(x, rest);
    }
  }

  return {
    gewaehlt,
    unerfuellt: Object.fromEntries(open), // Aspekt -> fehlende Anzahl
  };
}

module.exports = { select };

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = (name, dflt) => {
    const i = args.indexOf(name);
    if (i === -1) return dflt;
    return args.splice(i, 2)[1];
  };
  const per = Number(opt("--per", 1));
  const budgetArg = opt("--budget", null);
  const budget = budgetArg === null ? Infinity : Number(budgetArg);
  const poolFile = opt("--pool", path.join(__dirname, "elves.json"));

  const d = JSON.parse(fs.readFileSync(poolFile, "utf8"));
  const aspekte = args[0] ? args[0].split(",").map((s) => s.trim()) : d.rfp_aspekte;
  const unbekannt = aspekte.filter((a) => !d.rfp_aspekte.includes(a));
  if (unbekannt.length) {
    console.error(`FEHLER: Aspekt nicht im Katalog: ${unbekannt.join(", ")}`);
    process.exit(1);
  }

  const bedarf = Object.fromEntries(aspekte.map((a) => [a, per]));
  const { gewaehlt, unerfuellt } = select(d.wichtel, bedarf, budget);

  for (const { wichtel: w, bedient } of gewaehlt) {
    console.log(`${w.name} (${w.rolle}) -> ${bedient.join(", ")}`);
  }
  console.log(`\n${gewaehlt.length} Wichtel gewählt (Bedarf: ${per} je Aspekt)`);
  if (Object.keys(unerfuellt).length) {
    console.error(
      "UNERFÜLLT: " +
        Object.entries(unerfuellt).map(([a, n]) => `${a} (${n} fehlen)`).join(", ")
    );
    process.exit(2);
  }
}
