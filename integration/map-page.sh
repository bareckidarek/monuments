#!/bin/sh
set -eu

BASE_URL=${BASE_URL:-http://localhost:3000}
SESSION="map-page-$$"
ARTIFACT_DIR=${ARTIFACT_DIR:-".ai/qa/artifacts_map-page-$$"}

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
"$BROWSER" --session "$SESSION" open "$BASE_URL/map" --json >"$ARTIFACT_DIR/open.json"
sleep 1
"$BROWSER" --session "$SESSION" snapshot -i --json >"$ARTIFACT_DIR/snapshot.json"
"$BROWSER" --session "$SESSION" errors --json >"$ARTIFACT_DIR/errors.json"
"$BROWSER" --session "$SESSION" screenshot --full "$ARTIFACT_DIR/map.png" --json >"$ARTIFACT_DIR/screenshot.json"

if grep -Fq '"errors":[{' "$ARTIFACT_DIR/errors.json"; then
  echo "Map page reported browser errors" >&2
  cat "$ARTIFACT_DIR/errors.json" >&2
  exit 1
fi
for expected in "Monuments" "Map" "Search" "Brama Brandenburska" "Zamek na Wawelu" "Leaflet"; do
  if ! grep -Fq "$expected" "$ARTIFACT_DIR/snapshot.json"; then
    echo "Map page did not render expected content: $expected" >&2
    exit 1
  fi
done

echo "PASS map page: $BASE_URL/map"
echo "Artifacts: $ARTIFACT_DIR"
