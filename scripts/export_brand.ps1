# Normalize approved transparent PNG masters to Home Assistant brand dimensions.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $repoRoot 'docs/branding/source'
$brandRoot = Join-Path $repoRoot 'custom_components/luna_local/brand'
New-Item -ItemType Directory -Force -Path $brandRoot | Out-Null

foreach ($asset in @('icon', 'logo', 'dark_logo')) {
    $source = [System.Drawing.Bitmap]::new((Join-Path $sourceRoot "$asset.png"))
    try {
        foreach ($height in @(256, 512)) {
            $suffix = if ($height -eq 512) { '@2x' } else { '' }
            $width = if ($asset -eq 'icon') { $height } else { [int][Math]::Round($height * $source.Width / $source.Height) }
            $target = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            $graphics = [System.Drawing.Graphics]::FromImage($target)
            try {
                $graphics.Clear([System.Drawing.Color]::Transparent)
                $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $graphics.DrawImage($source, [System.Drawing.Rectangle]::new(0, 0, $width, $height))
                $target.Save((Join-Path $brandRoot "$asset$suffix.png"), [System.Drawing.Imaging.ImageFormat]::Png)
                Write-Output "$asset$suffix.png : $width x $height"
            } finally {
                $graphics.Dispose()
                $target.Dispose()
            }
        }
    } finally { $source.Dispose() }
}
