#!/usr/bin/env bash
#
# Lane-boundary guard — Repo_Lane_Boundary.md enforcement.
#
# Fails if any commit authored by the Lovable / gpt-engineer bot modified a
# CC-lane (gated) path. The bot owns content/presentation and commits
# direct-to-main; it must never touch the engine, the state registry, the
# state calculator routes, or the PDF/worksheet renderer (those are CC's gated,
# PR-reviewed, oracle-matched lane).
#
# Usage:
#   scripts/lane-guard.sh <git-range>   # e.g. abc123..def456  (used by CI)
#   scripts/lane-guard.sh --selftest    # verify the path matcher
#
# CC commits touching gated paths are allowed — only the bot author is policed.
set -euo pipefail

# Author identity of the Lovable / gpt-engineer bot (matches name or email).
BOT_RE='gpt-engineer-app\[bot\]'

# A path is in CC's gated lane (bot may not touch) if it is:
#   - the engine / math:            src/lib/calc/**
#   - the worksheet / PDF renderer: src/lib/pdf/**
#   - the state registry:           src/lib/states.ts
#   - a state calculator route:     src/routes/<2-letter>.tsx
# Content subpages (src/routes/<st>_.about.tsx, *_.how-it-works*.tsx),
# the homepage, styling, and codegen (routeTree.gen.ts) are NOT gated.
is_gated() {
  case "$1" in
    src/lib/calc/*) return 0 ;;
    src/lib/pdf/*) return 0 ;;
    src/lib/states.ts) return 0 ;;
  esac
  # Bare state calculator route, e.g. la.tsx / wa.tsx — but NOT la_.about.tsx.
  if [[ "$1" =~ ^src/routes/[a-z]{2}\.tsx$ ]]; then
    return 0
  fi
  return 1
}

selftest() {
  local fail=0
  check() { # check <expect gated:0|1> <path>
    if is_gated "$2"; then local got=0; else local got=1; fi
    if [ "$got" != "$1" ]; then
      echo "SELFTEST FAIL: $2 expected gated=$1 got=$got"
      fail=1
    fi
  }
  # gated
  check 0 src/lib/calc/core/income-shares.ts
  check 0 src/lib/calc/states/fl/spec.ts
  check 0 src/lib/states.ts
  check 0 src/lib/pdf/acroform-fill.ts
  check 0 src/routes/la.tsx
  check 0 src/routes/wa.tsx
  # allowed
  check 1 src/routes/la_.about.tsx
  check 1 src/routes/tn_.how-it-works.income.tsx
  check 1 src/routes/index.tsx
  check 1 src/routes/about.tsx
  check 1 src/routeTree.gen.ts
  check 1 src/components/home/state-list.tsx
  check 1 README.md
  [ "$fail" = 0 ] && echo "SELFTEST OK" || { echo "SELFTEST had failures"; exit 1; }
}

if [ "${1:-}" = "--selftest" ]; then
  selftest
  exit 0
fi

RANGE="${1:?usage: lane-guard.sh <git-range> | --selftest}"

# Bot-authored, non-merge commits in range (|| true: empty match is not an error).
bot_shas="$(git log --no-merges --format='%H|%an|%ae' "$RANGE" \
  | grep -Ei "$BOT_RE" | cut -d'|' -f1 || true)"

violations=0
for sha in $bot_shas; do
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    if is_gated "$f"; then
      echo "::error::Lane violation — bot commit ${sha:0:9} modified gated path: $f"
      violations=$((violations + 1))
    fi
  done < <(git diff-tree --no-commit-id --name-only -r "$sha")
done

if [ "$violations" -gt 0 ]; then
  echo ""
  echo "FAIL: $violations CC-lane path(s) modified by gpt-engineer-app[bot]."
  echo "The bot owns content/presentation only. Engine, state registry, state"
  echo "calculator routes, and the PDF renderer are CC's gated lane (PR + oracle)."
  echo "See CSG/04_Agent_Pipeline/Repo_Lane_Boundary.md."
  exit 1
fi
echo "OK: no gpt-engineer-app[bot] commits touched CC-lane paths in $RANGE."
