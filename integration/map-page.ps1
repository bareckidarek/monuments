$ErrorActionPreference = 'Stop'

$BaseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { 'http://localhost:3000' }
$Session = "map-page-$PID"
$ArtifactDir = if ($env:ARTIFACT_DIR) { $env:ARTIFACT_DIR } else { ".ai/qa/artifacts_map-page-$PID" }
$Browser = (Get-Command agent-browser -ErrorAction SilentlyContinue).Source
if (-not $Browser -and $env:BROWSER_COMMAND) { $Browser = $env:BROWSER_COMMAND }
if (-not $Browser) { throw 'agent-browser is required; run om-prepare-test-env first' }

New-Item -ItemType Directory -Force -Path $ArtifactDir | Out-Null
try {
  & $Browser --session $Session open "$BaseUrl/map" --json | Out-File "$ArtifactDir/open.json"
  Start-Sleep -Seconds 1
  & $Browser --session $Session snapshot -i --json | Out-File "$ArtifactDir/snapshot.json"
  & $Browser --session $Session errors --json | Out-File "$ArtifactDir/errors.json"
  & $Browser --session $Session screenshot --full "$ArtifactDir/map.png" --json | Out-File "$ArtifactDir/screenshot.json"
  $Errors = Get-Content "$ArtifactDir/errors.json" -Raw
  if ($Errors.Contains('"errors":[{')) { throw 'Map page reported browser errors' }
  $Snapshot = Get-Content "$ArtifactDir/snapshot.json" -Raw
  foreach ($Expected in @('Monuments', 'Map', 'Search', 'Brama Brandenburska', 'Zamek na Wawelu', 'Leaflet')) {
    if (-not $Snapshot.Contains($Expected)) { throw "Map page did not render expected content: $Expected" }
  }
  Write-Output "PASS map page: $BaseUrl/map"
  Write-Output "Artifacts: $ArtifactDir"
} finally {
  & $Browser --session $Session close --json *> $null
}
