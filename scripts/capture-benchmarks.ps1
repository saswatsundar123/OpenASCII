param([switch]$All,[switch]$Particles,[switch]$Colors,[switch]$Lines,[switch]$Styles,[switch]$Aspects,[switch]$Generated,[switch]$Temporal)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $projectRoot 'examples\benchmarks\milestone-2'
$vite = Join-Path $projectRoot 'packages\app\node_modules\.bin\vite.cmd'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$appPort = 4173
$debugPort = 9227
$commandId = 0

function Send-CdpMessage {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Socket,
    [string]$Method,
    [hashtable]$Params = @{}
  )
  $script:commandId++
  $id = $script:commandId
  $payload = @{ id = $id; method = $Method; params = $Params } | ConvertTo-Json -Compress -Depth 12
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
  $segment = [System.ArraySegment[byte]]::new($bytes)
  $Socket.SendAsync($segment,[System.Net.WebSockets.WebSocketMessageType]::Text,$true,[System.Threading.CancellationToken]::None).GetAwaiter().GetResult()

  while ($true) {
    $stream = [System.IO.MemoryStream]::new()
    do {
      $buffer = New-Object byte[] 65536
      $receiveSegment = [System.ArraySegment[byte]]::new($buffer)
      $received = $Socket.ReceiveAsync($receiveSegment,[System.Threading.CancellationToken]::None).GetAwaiter().GetResult()
      $stream.Write($buffer,0,$received.Count)
    } while (-not $received.EndOfMessage)
    $message = [System.Text.Encoding]::UTF8.GetString($stream.ToArray()) | ConvertFrom-Json
    if ($message.id -eq $id) {
      if ($message.error) { throw "CDP $Method failed: $($message.error.message)" }
      return $message.result
    }
  }
}

function Wait-ForEndpoint {
  param([string]$Uri,[int]$Attempts=100)
  for ($attempt=0; $attempt -lt $Attempts; $attempt++) {
    try { return Invoke-RestMethod -Uri $Uri -TimeoutSec 2 } catch { Start-Sleep -Milliseconds 150 }
  }
  throw "Timed out waiting for $Uri"
}

function Wait-CanvasReady {
  param([System.Net.WebSockets.ClientWebSocket]$Socket)
  $ready = $false
  for ($attempt=0; $attempt -lt 300; $attempt++) {
    $evaluation = Send-CdpMessage $Socket 'Runtime.evaluate' @{ expression = "document.querySelector('#ascii-canvas')?.dataset.renderReady === '1'"; returnByValue = $true }
    if ($evaluation.result.value -eq $true) { $ready = $true; break }
    Start-Sleep -Milliseconds 200
  }
  if (-not $ready) { throw 'Canvas render did not become ready.' }
  Send-CdpMessage $Socket 'Runtime.evaluate' @{ expression = 'new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))'; awaitPromise = $true } | Out-Null
}

function Save-CdpScreenshot {
  param([System.Net.WebSockets.ClientWebSocket]$Socket,[string]$Destination)
  $capture = Send-CdpMessage $Socket 'Page.captureScreenshot' @{ format = 'png'; fromSurface = $true; captureBeyondViewport = $false }
  [System.IO.File]::WriteAllBytes($Destination,[Convert]::FromBase64String($capture.data))
}

function Step-ParticleField {
  param([System.Net.WebSockets.ClientWebSocket]$Socket,[int]$Frames,[int]$StartFrame)
  $expression = "(()=>{const e=document.querySelector('#ascii-canvas').__openAsciiEngine;for(let i=0;i<$Frames;i++)e.physics.update(1/60,e.pointer,e.config,e.frame,($StartFrame+i)*1000/60);e.draw(($StartFrame+$Frames)*1000/60,1/240);return true})()"
  Send-CdpMessage $Socket 'Runtime.evaluate' @{ expression = $expression; returnByValue = $true } | Out-Null
}

function Capture-Benchmark {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Socket,
    [string]$Url,
    [string]$Destination
  )
  Send-CdpMessage $Socket 'Page.navigate' @{ url = $Url } | Out-Null
  Wait-CanvasReady $Socket
  Save-CdpScreenshot $Socket $Destination
}

$systems = if ($Styles) {
  @(
    @{ System = 6; Name = '40-style-classic-ascii.png' },
    @{ System = 0; Name = '41-style-braille.png' },
    @{ System = 4; Name = '42-style-halftone.png' },
    @{ System = 9; Name = '43-style-dot-cross.png' },
    @{ System = 2; Name = '44-style-line.png' },
    @{ System = 7; Name = '45-style-particles.png' },
    @{ System = 1; Name = '46-style-claude-code.png' },
    @{ System = 5; Name = '47-style-retro-art.png' },
    @{ System = 3; Name = '48-style-terminal.png' }
  )
} elseif ($Lines) {
  @(
    @{ Seed = 12; Line = 'flow'; Direction = 0; Name = '30-line-flow-horizontal.png' },
    @{ Seed = 12; Line = 'scan'; Direction = 90; Weight = 1.65; Length = .9; Name = '31-line-scan-vertical.png' },
    @{ Seed = 4; Line = 'scan'; Direction = 48; Name = '32-line-scan-amber.png' },
    @{ Seed = 12; Line = 'contour'; Direction = 0; Name = '33-line-contour-ice.png' }
  )
} elseif ($Colors) {
  @(
    @{ Color = 'grayscale'; Name = '20-color-grayscale.png' },
    @{ Color = 'full-color'; Name = '21-color-sampled.png' },
    @{ Color = 'matrix-green'; Name = '22-color-matrix.png' },
    @{ Color = 'amber-monitor'; Name = '23-color-amber.png' },
    @{ Color = 'cyanotype'; Name = '24-color-cyan.png' },
    @{ Color = 'phosphor'; Name = '25-color-phosphor.png' },
    @{ Color = 'palette-gradient'; Name = '26-color-palette.png' },
    @{ Color = 'custom'; Name = '27-color-custom.png' }
  )
} elseif ($All) {
  @(
    @{ Seed = 1;  Name = '01-full-color-pixel.png' },
    @{ Seed = 2;  Name = '02-editorial-ascii.png' },
    @{ Seed = 4;  Name = '03-warm-duotone-lines.png' },
    @{ Seed = 6;  Name = '04-silver-halftone.png' },
    @{ Seed = 7;  Name = '05-cyan-braille.png' },
    @{ Seed = 8;  Name = '06-amber-mosaic.png' },
    @{ Seed = 12; Name = '07-contour-wire.png' },
    @{ Seed = 18; Name = '08-binary-phosphor.png' },
    @{ Seed = 30; Name = '09-electric-particles.png' }
  )
} else {
  @(@{ Seed = $null; Name = '00-baseline.png' })
}

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
$profile = Join-Path 'C:\tmp' ("openascii-cdp-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())
$server = Start-Process -FilePath $vite -ArgumentList '--host','127.0.0.1','--port',"$appPort" -WorkingDirectory (Join-Path $projectRoot 'packages\app') -PassThru -WindowStyle Hidden
$browser = $null
$socket = $null

try {
  Wait-ForEndpoint "http://127.0.0.1:$appPort" | Out-Null
  $browser = Start-Process -FilePath $chrome -ArgumentList '--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage','--remote-allow-origins=*',"--remote-debugging-port=$debugPort","--user-data-dir=$profile",'--window-size=1200,1200','about:blank' -PassThru -WindowStyle Hidden
  $targets = Wait-ForEndpoint "http://127.0.0.1:$debugPort/json/list"
  $target = $targets | Where-Object { $_.type -eq 'page' } | Select-Object -First 1
  if (-not $target) { throw 'Chrome did not expose a page target.' }
  $socket = [System.Net.WebSockets.ClientWebSocket]::new()
  $socket.ConnectAsync([Uri]$target.webSocketDebuggerUrl,[System.Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null
  Send-CdpMessage $socket 'Page.enable' | Out-Null
  Send-CdpMessage $socket 'Runtime.enable' | Out-Null
  Send-CdpMessage $socket 'Emulation.setDeviceMetricsOverride' @{ width = 1200; height = 1200; deviceScaleFactor = 1; mobile = $false } | Out-Null

  if ($Temporal) {
    $temporalDir = Join-Path $outputDir 'step-8'
    New-Item -ItemType Directory -Path $temporalDir -Force | Out-Null
    Get-ChildItem -LiteralPath $temporalDir -Filter '*.png' -File | Remove-Item -Force
    $temporalCases = @(
      @{ Name = '01-glow.png'; Config = @{ fxPreset='none'; fxStrength=0; glowStrength=.28; temporalPersistence=0; phosphorDecay=0; ghostStrength=0; ghostFrames=0; ghostSpacing=3; noiseOpacity=0 } },
      @{ Name = '02-crt-decay.png'; Config = @{ fxPreset='crt'; fxStrength=.2; glowStrength=.18; temporalPersistence=.12; phosphorDecay=.82; ghostStrength=.08; ghostFrames=1; ghostSpacing=3; noiseOpacity=0 } },
      @{ Name = '03-beam-sweep.png'; Config = @{ fxPreset='beam-sweep'; fxStrength=.22; glowStrength=.16; temporalPersistence=0; phosphorDecay=0; ghostStrength=0; ghostFrames=0; ghostSpacing=3; noiseOpacity=0 } },
      @{ Name = '04-animated-noise.png'; Config = @{ fxPreset='noise-field'; fxStrength=.18; glowStrength=.16; temporalPersistence=.08; phosphorDecay=0; ghostStrength=.06; ghostFrames=1; ghostSpacing=3; noiseOpacity=.1 } },
      @{ Name = '05-ghost-frames.png'; Config = @{ fxPreset='noise-field'; fxStrength=.12; glowStrength=.14; temporalPersistence=.1; phosphorDecay=0; ghostStrength=.2; ghostFrames=3; ghostSpacing=2; noiseOpacity=.03 } },
      @{ Name = '06-glitch.png'; Config = @{ fxPreset='glitch'; fxStrength=.18; glowStrength=.12; temporalPersistence=0; phosphorDecay=0; ghostStrength=.08; ghostFrames=2; ghostSpacing=3; noiseOpacity=.03 } },
      @{ Name = '07-persistence.png'; Config = @{ fxPreset='none'; fxStrength=0; glowStrength=.14; temporalPersistence=.32; phosphorDecay=0; ghostStrength=0; ghostFrames=0; ghostSpacing=3; noiseOpacity=0 } }
    )
    foreach ($case in $temporalCases) {
      Send-CdpMessage $socket 'Page.navigate' @{ url = "http://127.0.0.1:$appPort/?benchmark=1&clean=1&capture=1&preset=6" } | Out-Null
      Wait-CanvasReady $socket
      $json = $case.Config | ConvertTo-Json -Compress
      $expression = "(()=>{const canvas=document.querySelector('#ascii-canvas'),engine=canvas.__openAsciiEngine;engine.stop();engine.setConfig($json);for(let i=0;i<48;i++)engine.draw(i*1000/60,1/60);const r=canvas.getBoundingClientRect();return {width:r.width,height:r.height,ready:canvas.dataset.renderReady,fx:engine.config.fxPreset,temporal:!!engine.temporal}})()"
      $evaluation = Send-CdpMessage $socket 'Runtime.evaluate' @{ expression = $expression; returnByValue = $true }
      $result = $evaluation.result.value
      if ($result.ready -ne '1' -or -not $result.temporal) { throw "Temporal case $($case.Name) did not initialize the shared compositor." }
      if ($result.width -le 0 -or $result.height -le 0 -or [Math]::Abs(($result.width / $result.height) - 1) -gt .01) { throw "Temporal case $($case.Name) did not render a square canvas." }
      $destination = Join-Path $temporalDir $case.Name
      Save-CdpScreenshot $socket $destination
      Get-Item -LiteralPath $destination | Select-Object Name,Length,LastWriteTime
    }
  } elseif ($Aspects) {
    Send-CdpMessage $socket 'Page.navigate' @{ url = "http://127.0.0.1:$appPort/" } | Out-Null
    Wait-CanvasReady $socket
    $aspectCases = @(
      @{ Label = '16:9'; Ratio = 16 / 9; Name = '50-aspect-16x9.png' },
      @{ Label = '4:3'; Ratio = 4 / 3; Name = '51-aspect-4x3.png' },
      @{ Label = '1:1'; Ratio = 1; Name = '52-aspect-1x1.png' },
      @{ Label = '3:4'; Ratio = 3 / 4; Name = '53-aspect-3x4.png' },
      @{ Label = '9:16'; Ratio = 9 / 16; Name = '54-aspect-9x16.png' }
    )
    foreach ($case in $aspectCases) {
      $label = $case.Label
      $click = "(()=>{const b=[...document.querySelectorAll('.ratio-picker button')].find(x=>x.textContent==='$label');if(!b)throw new Error('Missing ratio button $label');b.click();return true})()"
      Send-CdpMessage $socket 'Runtime.evaluate' @{ expression = $click; returnByValue = $true } | Out-Null
      Send-CdpMessage $socket 'Runtime.evaluate' @{ expression = 'new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))'; awaitPromise = $true } | Out-Null
      $measurement = Send-CdpMessage $socket 'Runtime.evaluate' @{ expression = "(()=>{const r=document.querySelector('.canvas-grid').getBoundingClientRect();return {width:r.width,height:r.height,ratio:r.width/r.height}})()"; returnByValue = $true }
      $actual = [double]$measurement.result.value.ratio
      if ([Math]::Abs($actual - [double]$case.Ratio) -gt .01) { throw "Aspect $label resolved to $actual instead of $($case.Ratio)" }
      $destination = Join-Path $outputDir $case.Name
      Save-CdpScreenshot $socket $destination
      [pscustomobject]@{ Name = $case.Name; Width = [Math]::Round($measurement.result.value.width,1); Height = [Math]::Round($measurement.result.value.height,1); Ratio = [Math]::Round($actual,4) }
    }
  } elseif ($Generated) {
    $generatedDir = Join-Path $outputDir 'step-7'
    New-Item -ItemType Directory -Path $generatedDir -Force | Out-Null
    Get-ChildItem -LiteralPath $generatedDir -Filter '*.png' -File | Remove-Item -Force
    $coveragePath = Join-Path $generatedDir 'coverage.json'
    if (Test-Path -LiteralPath $coveragePath) { Remove-Item -LiteralPath $coveragePath -Force }
    $history = @()
    $coverage = @()
    $previous = $null
    for ($seed = 1; $seed -le 42; $seed++) {
      $query = "?benchmark=1&clean=1&capture=1&preset=$seed"
      foreach ($signature in $history) {
        $query += '&history=' + [Uri]::EscapeDataString($signature)
      }
      Send-CdpMessage $socket 'Page.navigate' @{ url = "http://127.0.0.1:$appPort/$query" } | Out-Null
      Wait-CanvasReady $socket
      $evaluation = Send-CdpMessage $socket 'Runtime.evaluate' @{
        expression = "(()=>{const canvas=document.querySelector('#ascii-canvas'),engine=canvas.__openAsciiEngine,c=engine.config,r=canvas.getBoundingClientRect();return {width:r.width,height:r.height,archetype:c.archetype,archetypeLabel:c.archetypeLabel,artStyle:c.artStyle,secondaryStyle:c.secondaryStyle,toneProfile:c.toneProfile,densityProfile:c.densityProfile,paletteFamily:c.paletteFamily,fxPreset:c.fxPreset,contrast:c.contrast,gamma:c.gamma,densityScale:c.densityScale,characterSpacing:c.characterSpacing,glowStrength:c.glowStrength,fxStrength:c.fxStrength,clickSensitivity:c.clickSensitivity}})()"
        returnByValue = $true
      }
      $config = $evaluation.result.value
      if (-not $config.archetype) { throw "Seed $seed did not resolve an archetype." }
      if ($config.width -le 0 -or $config.height -le 0 -or [Math]::Abs(($config.width / $config.height) - 1) -gt .01) { throw "Seed $seed did not render a square benchmark canvas." }
      if ($config.contrast -lt 1.25 -or $config.contrast -gt 2.1) { throw "Seed $seed failed contrast validation." }
      if ($config.gamma -lt .76 -or $config.gamma -gt 1.12) { throw "Seed $seed failed gamma validation." }
      if ($config.densityScale -lt .92 -or $config.densityScale -gt 1.3) { throw "Seed $seed failed density validation." }
      if ($config.characterSpacing -lt .82 -or $config.characterSpacing -gt 1.16) { throw "Seed $seed failed spacing validation." }
      if ($config.glowStrength -lt .04 -or $config.glowStrength -gt .34) { throw "Seed $seed failed glow validation." }
      if ($config.fxStrength -lt 0 -or $config.fxStrength -gt .34) { throw "Seed $seed failed effect validation." }
      if ($config.clickSensitivity -lt .9 -or $config.clickSensitivity -gt 1.5) { throw "Seed $seed failed interaction validation." }
      if ($previous) {
        if ($config.artStyle -eq $previous.artStyle) { throw "Seed $seed repeated renderer $($config.artStyle)." }
        if ($config.toneProfile -eq $previous.toneProfile -and $config.densityProfile -eq $previous.densityProfile) { throw "Seed $seed repeated tonal topology." }
        if ($config.paletteFamily -eq $previous.paletteFamily) { throw "Seed $seed repeated palette $($config.paletteFamily)." }
      }
      $signature = "$($config.archetype)/$($config.artStyle)/$($config.secondaryStyle)/$($config.toneProfile)/$($config.densityProfile)/$($config.paletteFamily)/$($config.fxPreset)"
      if ($history -contains $signature) { throw "Seed $seed repeated a recent structural signature." }
      $name = '{0:D2}-seed-{1:D2}-{2}.png' -f $seed,$seed,$config.archetype
      Save-CdpScreenshot $socket (Join-Path $generatedDir $name)
      $coverage += [pscustomobject]@{
        seed = $seed
        archetype = $config.archetype
        renderer = $config.artStyle
        secondaryRenderer = $config.secondaryStyle
        toneProfile = $config.toneProfile
        densityProfile = $config.densityProfile
        paletteFamily = $config.paletteFamily
        effect = $config.fxPreset
      }
      $history = @($history + $signature | Select-Object -Last 6)
      $previous = $config
      [pscustomobject]@{ Seed = $seed; Archetype = $config.archetype; Renderer = $config.artStyle; Palette = $config.paletteFamily }
      $archetypeCount = @($coverage.archetype | Sort-Object -Unique).Count
      if ($seed -ge 24 -and $archetypeCount -eq 14) { break }
    }
    $archetypeCount = @($coverage.archetype | Sort-Object -Unique).Count
    if ($coverage.Count -lt 24) { throw "Generated gallery captured only $($coverage.Count) of 24 required frames." }
    if ($archetypeCount -ne 14) { throw "Generated gallery covered $archetypeCount of 14 archetypes." }
    $coverage | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $coveragePath -Encoding utf8
  } elseif ($Particles) {
    Send-CdpMessage $socket 'Page.navigate' @{ url = "http://127.0.0.1:$appPort/?benchmark=1&clean=1&capture=1&preset=30" } | Out-Null
    Wait-CanvasReady $socket
    $rest = Join-Path $outputDir '10-particles-rest.png'
    $pressed = Join-Path $outputDir '11-particles-pressed.png'
    $recovery = Join-Path $outputDir '12-particles-recovery.png'
    $settled = Join-Path $outputDir '13-particles-settled.png'
    Save-CdpScreenshot $socket $rest
    Send-CdpMessage $socket 'Input.dispatchMouseEvent' @{ type = 'mousePressed'; x = 600; y = 600; button = 'left'; buttons = 1; clickCount = 1 } | Out-Null
    Step-ParticleField $socket 19 0
    Save-CdpScreenshot $socket $pressed
    Send-CdpMessage $socket 'Input.dispatchMouseEvent' @{ type = 'mouseReleased'; x = 600; y = 600; button = 'left'; buttons = 0; clickCount = 1 } | Out-Null
    Step-ParticleField $socket 54 19
    Save-CdpScreenshot $socket $recovery
    Step-ParticleField $socket 108 73
    Save-CdpScreenshot $socket $settled
    Get-Item -LiteralPath $rest,$pressed,$recovery,$settled | Select-Object Name,Length,LastWriteTime
  } else {
    foreach ($system in $systems) {
      $query = '?benchmark=1&clean=1&capture=1'
      if ($null -ne $system.Seed) { $query += "&preset=$($system.Seed)" }
      if ($null -ne $system.System) { $query += "&system=$($system.System)" }
      if ($system.Color) { $query += "&preset=30&color=$($system.Color)" }
      if ($system.Line) { $query += "&line=$($system.Line)&lineDirection=$($system.Direction)" }
      if ($system.Weight) { $query += "&lineWeight=$($system.Weight)" }
      if ($system.Length) { $query += "&lineLength=$($system.Length)" }
      $destination = Join-Path $outputDir $system.Name
      Capture-Benchmark $socket "http://127.0.0.1:$appPort/$query" $destination
      Get-Item -LiteralPath $destination | Select-Object Name,Length,LastWriteTime
    }
  }
}
finally {
  if ($socket) { $socket.Dispose() }
  if ($browser -and -not $browser.HasExited) { Stop-Process -Id $browser.Id -Force -ErrorAction SilentlyContinue }
  if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue }
}
