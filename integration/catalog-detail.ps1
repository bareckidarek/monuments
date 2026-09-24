$ErrorActionPreference = 'Stop'

$BaseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { 'http://localhost:3000' }
$Slug = if ($env:CATALOG_DETAIL_SLUG) { $env:CATALOG_DETAIL_SLUG } else { 'zamek-na-wawelu' }
$Locale = if ($env:CATALOG_DETAIL_LOCALE) { $env:CATALOG_DETAIL_LOCALE } else { 'pl' }
$Session = "catalog-detail-$PID"
$ArtifactDir = if ($env:ARTIFACT_DIR) { $env:ARTIFACT_DIR } else { ".ai/qa/artifacts_catalog-detail-$PID" }
$Browser = (Get-Command agent-browser -ErrorAction SilentlyContinue).Source
if (-not $Browser -and $env:BROWSER_COMMAND) { $Browser = $env:BROWSER_COMMAND }
if (-not $Browser) { throw 'agent-browser is required; run om-prepare-test-env first' }

New-Item -ItemType Directory -Force -Path $ArtifactDir | Out-Null
$Url = "$BaseUrl/catalog/$Slug?locale=$Locale"
try {
  & $Browser --session $Session open $Url --json | Out-File "$ArtifactDir/open.json"
  Start-Sleep -Seconds 1
  & $Browser --session $Session snapshot -i --json | Out-File "$ArtifactDir/snapshot.json"
  & $Browser --session $Session screenshot --full "$ArtifactDir/detail.png" --json | Out-File "$ArtifactDir/screenshot.json"
  $Snapshot = Get-Content "$ArtifactDir/snapshot.json" -Raw
  if ($Snapshot.Contains('Catalog unavailable')) { throw "Catalog detail rendered the error state for $Url" }
  if (-not $Snapshot.Contains('Zamek na Wawelu')) { throw "Catalog detail did not render the expected monument heading for $Url" }
  if (-not $Snapshot.Contains('Wróć do katalogu')) { throw "Catalog detail did not render the observed Polish catalog breadcrumb for $Url" }
  Write-Output "PASS catalog detail: $Url"
  Write-Output "Artifacts: $ArtifactDir"
} finally {
  & $Browser --session $Session close --json *> $null
}
