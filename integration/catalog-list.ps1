$ErrorActionPreference = 'Stop'

$BaseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { 'http://localhost:3000' }
$Session = "catalog-list-$PID"
$ArtifactDir = if ($env:ARTIFACT_DIR) { $env:ARTIFACT_DIR } else { ".ai/qa/artifacts_catalog-list-$PID" }
$Browser = (Get-Command agent-browser -ErrorAction SilentlyContinue).Source
if (-not $Browser -and $env:BROWSER_COMMAND) { $Browser = $env:BROWSER_COMMAND }
if (-not $Browser) { throw 'agent-browser is required; run om-prepare-test-env first' }

New-Item -ItemType Directory -Force -Path $ArtifactDir | Out-Null
try {
  & $Browser --session $Session open "$BaseUrl/catalog" --json | Out-File "$ArtifactDir/open.json"
  Start-Sleep -Seconds 1
  & $Browser --session $Session snapshot -i --json | Out-File "$ArtifactDir/snapshot.json"
  & $Browser --session $Session screenshot --full "$ArtifactDir/list.png" --json | Out-File "$ArtifactDir/screenshot.json"
  $Snapshot = Get-Content "$ArtifactDir/snapshot.json" -Raw
  if ($Snapshot.Contains('Catalog unavailable')) { throw "Catalog list rendered the error state for $BaseUrl/catalog" }
  foreach ($Expected in @('Katalog zabytków', 'Szukaj', 'Brama Brandenburska', 'Zamek na Wawelu')) {
    if (-not $Snapshot.Contains($Expected)) { throw "Catalog list did not render observed content: $Expected" }
  }
  Write-Output "PASS catalog list: $BaseUrl/catalog"
  Write-Output "Artifacts: $ArtifactDir"
} finally {
  & $Browser --session $Session close --json *> $null
}
