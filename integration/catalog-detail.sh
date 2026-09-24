#!/bin/sh
set -eu

BASE_URL=${BASE_URL:-http://localhost:3000}
SLUG=${CATALOG_DETAIL_SLUG:-zamek-na-wawelu}
LOCALE=${CATALOG_DETAIL_LOCALE:-pl}
SESSION="catalog-detail-$$"
ARTIFACT_DIR=${ARTIFACT_DIR:-".ai/qa/artifacts_catalog-detail-$$"}

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
URL="$BASE_URL/catalog/$SLUG?locale=$LOCALE"
"$BROWSER" --session "$SESSION" open "$URL" --json >"$ARTIFACT_DIR/open.json"
sleep 1
"$BROWSER" --session "$SESSION" snapshot -i --json >"$ARTIFACT_DIR/snapshot.json"
"$BROWSER" --session "$SESSION" screenshot --full "$ARTIFACT_DIR/detail.png" --json >"$ARTIFACT_DIR/screenshot.json"

if grep -Fq "Catalog unavailable" "$ARTIFACT_DIR/snapshot.json"; then
  echo "Catalog detail rendered the error state for $URL" >&2
  exit 1
fi
if ! grep -Fq "Zamek na Wawelu" "$ARTIFACT_DIR/snapshot.json"; then
  echo "Catalog detail did not render the expected monument heading for $URL" >&2
  exit 1
fi
if ! grep -Fq "Wróć do katalogu" "$ARTIFACT_DIR/snapshot.json"; then
  echo "Catalog detail did not render the observed Polish catalog breadcrumb for $URL" >&2
  exit 1
fi

echo "PASS catalog detail: $URL"
echo "Artifacts: $ARTIFACT_DIR"
