# Servidor HTTP Local para Jardines del Cerro IV
$port = 3000
$path = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host " Torre Residencial Jardines del Cerro IV - Mao, Valverde " -ForegroundColor Yellow
    Write-Host " Servidor Web Local Iniciado con Exito                     " -ForegroundColor Green
    Write-Host " URL: http://localhost:$port/                             " -ForegroundColor White
    Write-Host " Presiona Ctrl+C en esta ventana para detener el servidor " -ForegroundColor DarkGray
    Write-Host "==========================================================" -ForegroundColor Cyan
    
    # Abrir navegador automaticamente
    Start-Process "http://localhost:$port/"

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/" -or [string]::IsNullOrEmpty($localPath)) {
            $localPath = "/index.html"
        }

        $filePath = Join-Path $path ($localPath.TrimStart('/').Replace('/', '\'))

        if (Test-Path $filePath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            
            $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
            switch ($extension) {
                ".html" { $response.ContentType = "text/html; charset=utf-8" }
                ".css"  { $response.ContentType = "text/css; charset=utf-8" }
                ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
                ".json" { $response.ContentType = "application/json; charset=utf-8" }
                ".png"  { $response.ContentType = "image/png" }
                ".jpg"  { $response.ContentType = "image/jpeg" }
                ".jpeg" { $response.ContentType = "image/jpeg" }
                ".svg"  { $response.ContentType = "image/svg+xml" }
                ".ico"   { $response.ContentType = "image/x-icon" }
                ".webp"  { $response.ContentType = "image/webp" }
                ".woff2" { $response.ContentType = "font/woff2" }
                ".woff"  { $response.ContentType = "font/woff" }
                ".ttf"   { $response.ContentType = "font/ttf" }
                default { $response.ContentType = "application/octet-stream" }
            }

            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
            $errContent = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 Not Found</h1><p>Archivo no encontrado: $localPath</p>")
            $response.ContentType = "text/html; charset=utf-8"
            $response.ContentLength64 = $errContent.Length
            $response.OutputStream.Write($errContent, 0, $errContent.Length)
        }
        $response.Close()
    }
} catch {
    Write-Host "Error en el servidor: $_" -ForegroundColor Red
} finally {
    $listener.Stop()
}
