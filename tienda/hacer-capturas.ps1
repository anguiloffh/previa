# Arma las imágenes de la ficha de Google Play en esta carpeta (tienda/).
# Necesita el servidor local de Previa en el puerto 5173 (configuración "previa" de .claude/launch.json).
# Uso: powershell -File tienda\hacer-capturas.ps1
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$dir = $PSScriptRoot
$base = "http://localhost:5173/maquetas"
$shots = @('home', 'carta', 'ajustes', 'final', 'niveles')
for ($i = 0; $i -lt $shots.Count; $i++) {
  $out = Join-Path $dir ("captura-{0}.png" -f ($i + 1))
  & $chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=3 --window-size=360,640 `
    --virtual-time-budget=15000 --screenshot="$out" "$base/capturas.html?s=$($shots[$i])" 2>$null | Out-Null
  Write-Output "captura-$($i + 1).png ($($shots[$i]))"
}
& $chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1024,500 `
  --virtual-time-budget=8000 --screenshot="$(Join-Path $dir 'portada-1024x500.png')" "$base/portada.html" 2>$null | Out-Null
Write-Output "portada-1024x500.png"
