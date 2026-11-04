"""Fallback client when the hackathon's claude_env is not available (standalone checkout).

Reads ANTHROPIC_API_KEY from the environment or from a .env file next to this folder or in the
repository root. Never prints the key.
"""
import os
import pathlib
from types import SimpleNamespace

import anthropic
from dotenv import dotenv_values

HERE = pathlib.Path(__file__).resolve().parent


def connect():
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    for env_file in (HERE / ".env", HERE.parent / ".env"):
        if not key and env_file.is_file():
            key = (dotenv_values(env_file, encoding="utf-8-sig").get("ANTHROPIC_API_KEY") or "").strip()
    if not key:
        raise SystemExit("Set ANTHROPIC_API_KEY (environment or .env) before running.")
    return SimpleNamespace(client=anthropic.Anthropic(api_key=key), model="claude-sonnet-5",
                           fast_model="claude-haiku-4-5")
