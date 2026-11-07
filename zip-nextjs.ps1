# zip-nextjs.ps1
# Nen du an Next.js thanh zip gon de gui cho AI.
# Bo qua: node_modules, .next, .git, file khoa, file nhi phan (anh, font, video), .env (bi mat), file log, file qua lon.
#
# Cach dung (dat trong thu muc du an):
#   powershell -ExecutionPolicy Bypass -File .\zip-nextjs.ps1

param(
    [string]$ProjectPath = (Get-Location).Path,
    [string]$OutputZip = "",
    [int]$MaxFileMB = 1
)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = (Resolve-Path -LiteralPath $ProjectPath).Path
$projectName = Split-Path $root -Leaf

if (-not $OutputZip) {
    $OutputZip = Join-Path (Split-Path $root -Parent) "$projectName-for-ai.zip"
}
if (Test-Path -LiteralPath $OutputZip) {
    Remove-Item -LiteralPath $OutputZip -Force
}

# Thu muc bo qua (theo ten, o moi cap)
$excludeDirs = @(
    'node_modules', '.git', '.next', 'out', 'build', 'dist', 'coverage',
    '.turbo', '.vercel', '.cache', '.idea', '.vscode', '.swc',
    'storybook-static', 'playwright-report', 'test-results', 'tmp', 'logs'
)

# File bo qua (theo mau ten)
$excludeNamePatterns = @(
    '.env', '.env.*',
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'bun.lock',
    '*.log', 'npm-debug.log*', 'yarn-error.log*', 'pnpm-debug.log*',
    '*.tsbuildinfo', '*.map',
    '*.pem', '*.key', '*.p12', '*.pfx', '*.keystore', '*.jks',
    '.DS_Store', 'Thumbs.db', 'desktop.ini'
)

# Duoi file nhi phan: AI khong doc duoc noi dung, bo de nhe
$excludeExts = @(
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.bmp', '.tiff', '.ico', '.heic',
    '.mp4', '.mov', '.webm', '.avi', '.mp3', '.wav', '.ogg', '.m4a',
    '.woff', '.woff2', '.ttf', '.otf', '.eot',
    '.pdf', '.zip', '.rar', '.7z', '.tar', '.gz', '.exe', '.dll', '.so', '.dylib', '.bin',
    '.psd', '.ai', '.sketch', '.fig', '.glb', '.gltf'
)

# File ngoai le duoc giu lai du khop mau tren
$keepNames = @('.env.example', '.env.sample', '.env.template')

$maxBytes = $MaxFileMB * 1MB
$included = New-Object System.Collections.Generic.List[System.IO.FileInfo]
$skippedLarge = New-Object System.Collections.Generic.List[string]

function Test-IncludeFile([System.IO.FileInfo]$file) {
    if ($keepNames -contains $file.Name) { return $true }

    foreach ($pattern in $excludeNamePatterns) {
        if ($file.Name -like $pattern) { return $false }
    }

    if ($excludeExts -contains $file.Extension.ToLower()) { return $false }

    if ($file.Length -gt $maxBytes) {
        $script:skippedLarge.Add(("{0} ({1:N1} MB)" -f $file.FullName.Substring($root.Length + 1), ($file.Length / 1MB)))
        return $false
    }
    return $true
}

function Get-ProjectFiles([string]$dir) {
    foreach ($item in Get-ChildItem -LiteralPath $dir -Force) {
        if ($item.PSIsContainer) {
            if ($excludeDirs -notcontains $item.Name) {
                Get-ProjectFiles $item.FullName
            }
        }
        else {
            if (Test-IncludeFile $item) {
                $script:included.Add($item)
            }
        }
    }
}

Write-Host "Dang quet: $root" -ForegroundColor Cyan
Get-ProjectFiles $root

if ($included.Count -eq 0) {
    Write-Host "Khong co file nao de nen. Kiem tra lai duong dan." -ForegroundColor Red
    exit 1
}

$zip = [System.IO.Compression.ZipFile]::Open($OutputZip, 'Create')
try {
    foreach ($file in $included) {
        $rel = $file.FullName.Substring($root.Length + 1) -replace '\\', '/'
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $zip, $file.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal
        ) | Out-Null
    }
}
finally {
    $zip.Dispose()
}

$totalMB = ($included | Measure-Object -Property Length -Sum).Sum / 1MB
$zipMB = (Get-Item -LiteralPath $OutputZip).Length / 1MB

Write-Host ""
Write-Host "Xong!" -ForegroundColor Green
Write-Host ("So file da nen : {0}" -f $included.Count)
Write-Host ("Dung luong goc : {0:N2} MB" -f $totalMB)
Write-Host ("File zip       : {0} ({1:N2} MB)" -f $OutputZip, $zipMB)

if ($skippedLarge.Count -gt 0) {
    Write-Host ""
    Write-Host "Da bo qua vi qua lon (> $MaxFileMB MB):" -ForegroundColor Yellow
    $skippedLarge | ForEach-Object { Write-Host "  - $_" }
}