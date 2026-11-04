# Wichtel GmbH & Co. KG – RFP Desk

A fun take on the specialist swarm: an RFP desk whose clients are fable creatures (Santa Claus, the
Easter Bunny, ...). Upload an RFP, watch 20 agent runs work on it live, get a finished proposal.

## Run

```bash
pip install anthropic python-dotenv      # or: uv run ...
python -X utf8 server.py                 # http://127.0.0.1:8765 (PORT env overrides)
```

The API key comes from the hackathon's `claude_env.connect()` when present, otherwise from
`ANTHROPIC_API_KEY` (environment or `.env` in this folder or the repo root).

## How it works

| Phase | Agents | Model | Parallel |
|---|---|---|---|
| 1. Intake + specialists | Head Elf Alvar (intake) + 10 specialists (Rudolph, The Tooth Fairy, The Norns, The Dragon, Abraxas the Raven, The Unicorn, Grimm the Troll, Pumuckel the Kobold, The Sandman, Rubezahl the Giant) | Haiku | 11 |
| 2. Chapter editing | 6 editors write one chapter each | Sonnet | 6 |
| 3. Review | Knecht Ruprecht, Krampus, Mother Holle | Haiku | 3 |

- `swarm.py` – pipeline; emits events (`agent_start`, `delta`, `agent_done`, `handoff`, `phase`, `final`, `done`).
- `server.py` – stdlib HTTP server, `POST /api/run` streams the events as `text/event-stream`.
- `static/index.html` – the bid floor as a top-down game map on one scaled canvas (no scroll bars): every agent is a character with its own workstation; idle characters wander, walk to their desk when they get a task and curse when work piles up. Elf couriers enter through the doors, pick up and deliver parcels on every hand-off. Claude, the overseer, patrols the floor and cracks the whip so nearby elves hurry. Click a character to see its short role, status and latest text. KPIs, radio log, final proposal as Markdown download or print-to-PDF.
- `samples/rfp-santa.md` – sample RFP (Santa Claus).

Measured on the sample RFP: about 35 s, 20 agent runs, about 16–18k output tokens.

## Decisions (POC)

- Messages API with threads instead of Managed Agents: token-level streaming for the animation and full
  control over parallelism. Managed Agents access was checked and works if needed later.
- No rewrite loop after the critics; their verdicts are appended as an internal quality annex.
- Only the pricing specialist may state prices, so chapters written in parallel stay consistent.
- Stdlib server, no extra web framework; output as Markdown/PDF (print), no docx.
- All UI text and agent output are in English.
