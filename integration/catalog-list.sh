#!/bin/sh
set -eu

BASE_URL=${BASE_URL:-http://localhost:3000}
SESSION="catalog-list-$$"
ARTIFACT_DIR=${ARTIFACT_DIR:-".ai/qa/artifacts_catalog-list-$$"}

if command -v agent-browser >/dev/null 2>&1; then
  BROWSER=$(command -v agent-browser)
elif [ -n "${BROWSER_COMMAND:-}" ] && [ -x "$BROWSER_COMMAND" ]; then
  BROWSER=$BROWSER_COMMAND
else
  echo "agent-browser is required; run om-prepare-test-env first" >&2
  exit 2
fi

cleanup() {
  "$BROWSER" --session "$SESSION" close --json >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

mkdir -p "$ARTIFACT_DIR"
"$BROWSER" --session "$SESSION" open "$BASE_URL/catalog" --json >"$ARTIFACT_DIR/open.json"
"$BROWSER" --session "$SESSION" snapshot -i --json >"$ARTIFACT_DIR/snapshot.json"
"$BROWSER" --session "$SESSION" screenshot --full "$ARTIFACT_DIR/list.png" --json >"$ARTIFACT_DIR/screenshot.json"

if grep -Fq "Catalog unavailable" "$ARTIFACT_DIR/snapshot.json"; then
  echo "Catalog list rendered the error state for $BASE_URL/catalog" >&2
  exit 1
fi
for expected in "Katalog zabytków" "Szukaj" "Brama Brandenburska" "Zamek na Wawelu"; do
  if ! grep -Fq "$expected" "$ARTIFACT_DIR/snapshot.json"; then
    echo "Catalog list did not render observed content: $expected" >&2
    exit 1
  fi
done

echo "PASS catalog list: $BASE_URL/catalog"
echo "Artifacts: $ARTIFACT_DIR"
