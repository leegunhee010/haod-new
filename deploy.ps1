<#
  하오디자인 멀티센터 배포 스크립트
  로컬 소스 폴더 → haod-new/<센터> 복사 + 센터링크 치환 + commit + push

  사용법:
    .\deploy.ps1 web                # web 센터만 배포
    .\deploy.ps1 web,studio         # 여러 센터 한번에
    .\deploy.ps1 all                # 4개 센터 전체
    .\deploy.ps1 web -NoPush        # commit까지만 (push는 보류)
    .\deploy.ps1 web -Message "히어로 카피 수정"   # 커밋 메시지 지정

  GitHub Pages는 push되면 1~2분 내 자동 재배포됨.
  라이브: https://leegunhee010.github.io/haod-new/
#>
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string[]]$Centers,
  [switch]$NoPush,
  [string]$Message
)

$ErrorActionPreference = 'Stop'
$repo    = $PSScriptRoot                 # ...\haod-new
$srcRoot = Split-Path $repo -Parent      # ...\이건희

# 센터 → 로컬 소스 폴더
$map = [ordered]@{
  design  = 'haodesign-renewal-3'
  web     = 'haodesign-web'
  studio  = 'haodesign-studio'
  voucher = 'haodesign-voucher'
  mkt     = 'haodesign-mkt'
}

# 로컬 localhost 링크 → 배포 상대경로 (순서 중요: 슬래시 포함형 먼저)
$links = @(
  @('http://localhost:5599/', '../design/'),
  @('http://localhost:5599',  '../design/'),
  @('http://localhost:5602/', '../web/'),
  @('http://localhost:5602',  '../web/'),
  @('http://localhost:5603/', '../studio/'),
  @('http://localhost:5603',  '../studio/'),
  @('http://localhost:5601/', '../voucher/'),
  @('http://localhost:5601',  '../voucher/')
)

# 'all' 확장
if ($Centers.Count -eq 1 -and $Centers[0] -eq 'all') {
  $Centers = @($map.Keys)
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$changed = @()

foreach ($c in $Centers) {
  if (-not $map.Contains($c)) { Write-Warning "알 수 없는 센터: $c (건너뜀)"; continue }
  $src = Join-Path $srcRoot $map[$c]
  $dst = Join-Path $repo $c
  if (-not (Test-Path $src)) { Write-Warning "소스 폴더 없음: $src (건너뜀)"; continue }

  Write-Host "▶ $c  ($($map[$c]) → haod-new/$c)" -ForegroundColor Cyan

  # 1) 복사 (/E = 하위폴더 포함, 기존 추가분은 보존 — cp -r 방식)
  robocopy $src $dst /E /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy 실패 (exit $LASTEXITCODE): $c" }

  # 2) 센터링크 치환 (html/js/css)
  $files = Get-ChildItem $dst -Recurse -Include *.html, *.js, *.css -File
  $hit = 0
  foreach ($f in $files) {
    $t = [System.IO.File]::ReadAllText($f.FullName)
    $orig = $t
    foreach ($pair in $links) { $t = $t.Replace($pair[0], $pair[1]) }
    if ($t -ne $orig) {
      [System.IO.File]::WriteAllText($f.FullName, $t, $utf8NoBom)
      $hit++
    }
  }
  Write-Host "  링크 치환: $hit 파일" -ForegroundColor DarkGray
  $changed += $c
}

if ($changed.Count -eq 0) { Write-Host "배포할 센터 없음." -ForegroundColor Yellow; exit }

# 3) commit (배포한 센터 폴더 + 스크립트만 스테이징 — 무관한 변경분 제외)
Set-Location $repo
foreach ($c in $changed) { git add -- $c }
git add -- deploy.ps1
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Write-Host "변경 사항 없음 — 커밋 생략." -ForegroundColor Yellow
  exit
}
if (-not $Message) { $Message = "deploy: $($changed -join ', ') 업데이트" }
git commit -m $Message | Out-Null
Write-Host "✔ commit: $Message" -ForegroundColor Green

# 4) push
if ($NoPush) {
  Write-Host "↻ push 보류 — 올리려면:  git push origin HEAD" -ForegroundColor Yellow
} else {
  git push origin HEAD
  Write-Host "✔ 배포 완료 → https://leegunhee010.github.io/haod-new/ (1~2분 후 반영, Ctrl+Shift+R)" -ForegroundColor Green
}
