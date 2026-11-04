---
name: wichtel-design-rules
description: Urteilsregeln für Wichtel-Agenten (Rollen und Fähigkeiten) im North-Pole-Logistics-RFP-Szenario. Verwenden, wenn Wichtel in elves.json definiert, geändert oder zugeordnet werden.
---

# Wichtel-Designregeln

Die **prüfbaren Regeln** werden nicht hier, sondern maschinell durchgesetzt:

- `elves.schema.json`: 1 bis 3 Fähigkeiten, keine Duplikate, Pflichtfelder
- `validate-elves.js`: nur Katalog-Fähigkeiten, jeder RFP-Aspekt abgedeckt

Nach jeder Änderung an `elves.json` ausführen und Verstöße beheben:

```bash
node validate-elves.js
```

Der Fähigkeitskatalog steht nur in `elves.json` (`rfp_aspekte`).

## Urteilsregeln (nicht automatisch prüfbar)

1. **Spezialisierung vor Allrounder.** Mehr Fähigkeiten bedeuten nicht mehr Qualität. Drei Fähigkeiten nur, wenn die Kombination fachlich zusammenpasst.
2. **Rolle und Fähigkeiten passen zusammen.** Die Fähigkeiten folgen aus der Rolle, nicht umgekehrt.
3. **Überlappung bewusst einsetzen.** Mehrere Wichtel mit derselben Fähigkeit sind gewollt, wenn sie zwei Sichtweisen auf einen Aspekt liefern (z. B. Risiko aus Routen- und Flottensicht).
