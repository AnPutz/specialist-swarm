#!/usr/bin/env node
// Erzeugt einen Wichtel-Pool mit Fabelnamen, die zur Hauptfähigkeit passen.
//
// Name = Vorname + Beiname, Beiname = Fähigkeits-Stamm + Fabeltier
//   z. B. "Rudi Routenfuchs" (Routenplanung), "Reineke Siegeleule" (Vertrag und SLA)
// 100 Vornamen x 8 Fähigkeiten x 14 Tiere = 11200 eindeutige Kombinationen (> 9999).
//
// Die handgepflegten Wichtel aus elves.json kommen zuerst in den Pool,
// der Rest wird deterministisch (--seed) aufgefüllt.
//
// CLI: node generate-elves.js [--count N] [--seed S] [--out datei] [--base datei]
const fs = require("fs");
const path = require("path");

const MAX_POOL = 9999;
const MAX_SKILLS = 3;

const VORNAMEN = [
  "Rudi", "Reineke", "Isegrim", "Bruno", "Lampe", "Grimbart", "Tibert", "Hinze", "Nobel", "Pinte",
  "Henning", "Chanticleer", "Wuschel", "Knuspel", "Pimpel", "Tüftel", "Krümel", "Plätzchen", "Mandel", "Anis",
  "Nelke", "Kardamom", "Honig", "Lebkuch", "Zimt", "Vanille", "Marzipan", "Muskat", "Ingwer", "Sternchen",
  "Flocke", "Tannen", "Zapfen", "Zweig", "Mistel", "Stechpalm", "Schneeball", "Eiszapfen", "Frostine", "Glitzer",
  "Funkel", "Kerzchen", "Lichtl", "Strohstern", "Nuss", "Haselnuss", "Walnuss", "Buchecker", "Eichel", "Kastanie",
  "Brummel", "Kullerchen", "Purzel", "Plumps", "Zottel", "Struppi", "Bommel", "Pünktchen", "Tripp", "Trapp",
  "Klaus", "Nikolaus", "Ruprecht", "Hubert", "Albrecht", "Balduin", "Ferdinand", "Gundolf", "Hilbert", "Ignaz",
  "Jockel", "Kasimir", "Leopold", "Melchior", "Nepomuk", "Oswald", "Quirin", "Rochus", "Sigmund", "Tilman",
  "Urban", "Valentin", "Wendelin", "Xaver", "Zacharias", "Fine", "Gretel", "Hanne", "Isolde", "Jolanda",
  "Kunigunde", "Lieselotte", "Mathilde", "Notburga", "Ottilie", "Pauline", "Rosamunde", "Sidonie", "Theodora", "Walburga",
];

const TIERE = [
  "fuchs", "rabe", "hase", "igel", "wolf", "bär", "eule", "dachs", "hirsch", "esel", "hahn", "krähe", "storch", "frosch",
];

// Fähigkeit -> Stamm für den Beinamen und passende Rolle
const FAEHIGKEITEN = {
  "Routenplanung": { stamm: "Routen", rolle: "Logistik-Planer" },
  "Arbeitsrecht": { stamm: "Paragraphen", rolle: "Rechtswichtel" },
  "Flottentechnik": { stamm: "Schrauben", rolle: "Flotten-Ingenieur" },
  "Kalkulation": { stamm: "Taler", rolle: "Finanzwichtel" },
  "Risiko und Ausfall": { stamm: "Notfall", rolle: "Risiko-Wichtel" },
  "Vertrag und SLA": { stamm: "Siegel", rolle: "Vertragswichtel" },
  "Angebotstext": { stamm: "Feder", rolle: "Bid-Autor" },
  "Wettbewerbsanalyse": { stamm: "Späher", rolle: "Marktbeobachter" },
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function generate(base, count, seed) {
  const rnd = mulberry32(seed);
  const skills = Object.keys(FAEHIGKEITEN);
  const wichtel = base.wichtel.slice();
  const namen = new Set(wichtel.map((w) => w.name));

  // Alle Kombinationen erzeugen und deterministisch mischen (Fisher-Yates).
  const combos = [];
  for (const v of VORNAMEN)
    for (const s of skills)
      for (const t of TIERE) combos.push([v, s, t]);
  for (let i = combos.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [combos[i], combos[j]] = [combos[j], combos[i]];
  }

  for (const [v, haupt, tier] of combos) {
    if (wichtel.length >= count) break;
    const name = `${v} ${FAEHIGKEITEN[haupt].stamm}${tier}`;
    if (namen.has(name)) continue;
    namen.add(name);

    // Hauptfähigkeit + 0 bis 2 weitere; Spezialisten sind häufiger (60/30/10).
    const r = rnd();
    const extra = r < 0.6 ? 0 : r < 0.9 ? 1 : MAX_SKILLS - 1;
    const f = [haupt];
    while (f.length < 1 + extra) {
      const s = skills[Math.floor(rnd() * skills.length)];
      if (!f.includes(s)) f.push(s);
    }
    wichtel.push({ name, rolle: FAEHIGKEITEN[haupt].rolle, faehigkeiten: f });
  }
  return { rfp_aspekte: base.rfp_aspekte, wichtel };
}

module.exports = { generate };

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = (n, d) => {
    const i = args.indexOf(n);
    return i === -1 ? d : args[i + 1];
  };
  const count = Number(opt("--count", 200));
  const seed = Number(opt("--seed", 2024));
  const out = opt("--out", path.join(__dirname, "elves.pool.json"));
  const base = JSON.parse(
    fs.readFileSync(opt("--base", path.join(__dirname, "elves.json")), "utf8")
  );

  if (!Number.isInteger(count) || count < 1 || count > MAX_POOL) {
    console.error(`FEHLER: --count muss zwischen 1 und ${MAX_POOL} liegen`);
    process.exit(1);
  }
  const pool = generate(base, count, seed);
  if (pool.wichtel.length < count) {
    console.error(`FEHLER: nur ${pool.wichtel.length} eindeutige Namen möglich`);
    process.exit(1);
  }
  fs.writeFileSync(out, JSON.stringify(pool, null, 2) + "\n");
  console.log(`${pool.wichtel.length} Wichtel nach ${out} geschrieben (seed ${seed})`);
}
