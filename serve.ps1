$port = 5173
$distDir = Join-Path $PSScriptRoot 'dist'
$address = [System.Net.IPAddress]::Loopback

if (-not (Test-Path $distDir)) {
    Write-Host "ERROR: dist/ folder not found. Run 'npm run build' first." -ForegroundColor Red
    Read-Host 'Press Enter to exit'
    exit 1
}

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'application/javascript'
    '.css'  = 'text/css'
    '.wasm' = 'application/wasm'
    '.png'  = 'image/png'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.json' = 'application/json'
    '.map'  = 'application/json'
}

function Serve-Request($stream, $distDir, $mimeTypes) {
    try {
        $buffer = New-Object byte[] 4096
        $requestBytes = New-Object System.Collections.Generic.List[byte]
        $stream.ReadTimeout = 1000
        
        while ($stream.DataAvailable) {
            $read = $stream.Read($buffer, 0, $buffer.Length)
            for ($i = 0; $i -lt $read; $i++) { $requestBytes.Add($buffer[$i]) }
        }
        
        if ($requestBytes.Count -eq 0) { return }
        
        $requestText = [System.Text.Encoding]::UTF8.GetString($requestBytes.ToArray())
        $lines = $requestText -split "`r`n"
        if ($lines.Count -eq 0) { return }
        
        $firstLine = $lines[0] -split ' '
        if ($firstLine.Count -lt 2) { return }
        
        $method = $firstLine[0]
        $rawPath = $firstLine[1]
        
        if ($method -ne 'GET' -and $method -ne 'HEAD') {
            $resp = "HTTP/1.1 405 Method Not Allowed`r`nContent-Length: 0`r`nConnection: close`r`n`r`n"
            $stream.Write([System.Text.Encoding]::UTF8.GetBytes($resp), 0, $resp.Length)
            $stream.Flush()
            return
        }
        
        $path = ($rawPath -split '\?')[0]
        if ($path -eq '/') { $path = '/index.html' }
        
        $filePath = Join-Path $distDir $path.TrimStart('/')
        $filePath = [System.IO.Path]::GetFullPath($filePath)
        
        if (-not $filePath.StartsWith($distDir, [StringComparison]::OrdinalIgnoreCase)) {
            $filePath = Join-Path $distDir 'index.html'
        }
        
        if (-not (Test-Path $filePath -PathType Leaf)) {
            $filePath = Join-Path $distDir 'index.html'
        }
        
        $ext = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
        $contentType = $mimeTypes[$ext]
        if (-not $contentType) { $contentType = 'application/octet-stream' }
        
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        
        $resp = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`nCache-Control: no-cache`r`n`r`n"
        $respBytes = [System.Text.Encoding]::UTF8.GetBytes($resp)
        $stream.Write($respBytes, 0, $respBytes.Length)
        $stream.Write($bytes, 0, $bytes.Length)
        $stream.Flush()
    } catch {
        try {
            $err = "HTTP/1.1 500 Internal Server Error`r`nContent-Length: 0`r`nConnection: close`r`n`r`n"
            $stream.Write([System.Text.Encoding]::UTF8.GetBytes($err), 0, $err.Length)
            $stream.Flush()
        } catch {}
    }
}

$listener = New-Object System.Net.Sockets.TcpListener($address, $port)

try {
    $listener.Start()
    $url = "http://localhost:$port"
    Write-Host ""
    Write-Host "  ================================" -ForegroundColor Cyan
    Write-Host "  HK Invoice Manager" -ForegroundColor Green
    Write-Host "  Server running at $url" -ForegroundColor White
    Write-Host "  Press Ctrl+C to stop" -ForegroundColor Gray
    Write-Host "  ================================" -ForegroundColor Cyan
    Write-Host ""
    
    Start-Process $url
    
    $acceptPending = $false
    $asyncResult = $null
    
    while ($true) {
        if (-not $acceptPending) {
            try {
                $asyncResult = $listener.BeginAcceptTcpClient($null, $null)
                $acceptPending = $true
            } catch {
                Start-Sleep -Milliseconds 100
                continue
            }
        }
        
        if ($asyncResult -and $asyncResult.IsCompleted) {
            try {
                $client = $listener.EndAcceptTcpClient($asyncResult)
                $acceptPending = $false
                
                $stream = $null
                try {
                    $stream = $client.GetStream()
                    Serve-Request $stream $distDir $mimeTypes
                } finally {
                    if ($stream) { $stream.Close() }
                    $client.Close()
                }
            } catch {
                $acceptPending = $false
                Start-Sleep -Milliseconds 50
            }
        } else {
            Start-Sleep -Milliseconds 50
        }
    }
} finally {
    if ($asyncResult) {
        try { $listener.EndAcceptTcpClient($asyncResult) } catch {}
    }
    $listener.Stop()
    Write-Host "Server stopped." -ForegroundColor Gray
}
