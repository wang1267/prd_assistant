param(
  [string]$Source = (Join-Path $PSScriptRoot '..\proto-req'),
  [string]$Output = (Join-Path $PSScriptRoot '..\prototype')
)

$files = @(
  'prd.html',
  'js\prd-config.js', 'js\util.js', 'js\store.js', 'js\auth.js', 'js\ai-skill.js',
  'js\ai.js', 'js\editor.js', 'js\proto.js', 'js\visual-editor.js', 'js\links.js',
  'js\settings.js', 'js\prd-adapter.js', 'js\app.js',
  'js\vendor\moveable.min.js', 'js\vendor\MOVEABLE-LICENSE.txt',
  'styles\app.css', 'styles\visual-editor.css', 'styles\prd-workspace.css'
)

foreach ($relativePath in $files) {
  $from = Join-Path $Source $relativePath
  if (!(Test-Path -LiteralPath $from -PathType Leaf)) {
    throw "缺少原型运行文件：$from"
  }
  $to = Join-Path $Output $relativePath
  $parent = Split-Path -Parent $to
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
  Copy-Item -LiteralPath $from -Destination $to -Force
}

Write-Host "原型静态运行包已同步至 $Output"
