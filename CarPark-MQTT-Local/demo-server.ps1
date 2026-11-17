$ErrorActionPreference = 'Stop'
$page = [IO.File]::ReadAllBytes((Join-Path $PSScriptRoot 'VER_DEMO.html'))
$server = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
$server.Start()
$port = $server.LocalEndpoint.Port
Write-Host 'CarPark: demo visual. Deja esta ventana abierta.'
Start-Process ('http://localhost:' + $port + '/?demo=1')
try {
 while ($true) {
  $client = $server.AcceptTcpClient()
  try {
   $client.ReceiveTimeout = 3000
   $stream = $client.GetStream()
   $buffer = New-Object byte[] 8192
   $read = $stream.Read($buffer, 0, $buffer.Length)
   $request = [Text.Encoding]::ASCII.GetString($buffer, 0, $read)
   $isPage = $request -match '^GET /(?:\?demo=1)? HTTP/'
   $isImage = $request -match '^GET /CarPark-FUNCIONA/assets/rotulo-carpark.webp HTTP/'
   if ($isPage -or $isImage) {
    $body = $page
    $mime = 'text/html; charset=utf-8'
    if ($isImage) {
     $body = [IO.File]::ReadAllBytes((Join-Path $PSScriptRoot '../CarPark-FUNCIONA/assets/rotulo-carpark.webp'))
     $mime = 'image/webp'
    }
    $header = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
    $bytes = [Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Write($body, 0, $body.Length)
   } else {
    $bytes = [Text.Encoding]::ASCII.GetBytes("HTTP/1.1 404 Not Found`r`nContent-Length: 0`r`nConnection: close`r`n`r`n")
    $stream.Write($bytes, 0, $bytes.Length)
   }
  } catch { } finally { $client.Close() }
 }
} finally { $server.Stop() }
