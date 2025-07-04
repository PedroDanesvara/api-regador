# Script PowerShell para criar novo device ESP32
# Uso: .\criar-device.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$DeviceId,
    
    [Parameter(Mandatory=$true)]
    [string]$Name,
    
    [Parameter(Mandatory=$true)]
    [string]$Location,
    
    [Parameter(Mandatory=$false)]
    [string]$Description = ""
)

# URL da API
$apiUrl = "http://localhost:3000/api/devices"

# Preparar dados do device
$deviceData = @{
    device_id = $DeviceId
    name = $Name
    location = $Location
    description = $Description
} | ConvertTo-Json

# Headers
$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "🚀 Criando novo device ESP32..." -ForegroundColor Green
Write-Host "ID: $DeviceId" -ForegroundColor Yellow
Write-Host "Nome: $Name" -ForegroundColor Yellow
Write-Host "Localização: $Location" -ForegroundColor Yellow
if ($Description) {
    Write-Host "Descrição: $Description" -ForegroundColor Yellow
}
Write-Host ""

try {
    # Fazer requisição POST
    $response = Invoke-WebRequest -Uri $apiUrl -Method POST -Headers $headers -Body $deviceData
    
    if ($response.StatusCode -eq 201) {
        $result = $response.Content | ConvertFrom-Json
        
        Write-Host "✅ Device criado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Detalhes do device:" -ForegroundColor Cyan
        Write-Host "   ID: $($result.data.device_id)" -ForegroundColor White
        Write-Host "   Nome: $($result.data.name)" -ForegroundColor White
        Write-Host "   Localização: $($result.data.location)" -ForegroundColor White
        Write-Host "   Descrição: $($result.data.description)" -ForegroundColor White
        Write-Host "   Criado em: $($result.data.created_at)" -ForegroundColor White
        Write-Host ""
        Write-Host "🔗 Para verificar o device:" -ForegroundColor Cyan
        Write-Host "   GET $apiUrl/$DeviceId" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Erro ao criar device:" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        $errorContent = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorContent)
        $errorJson = $reader.ReadToEnd() | ConvertFrom-Json
        
        Write-Host "   Status: $statusCode" -ForegroundColor Red
        Write-Host "   Erro: $($errorJson.error)" -ForegroundColor Red
        if ($errorJson.detail) {
            Write-Host "   Detalhes: $($errorJson.detail)" -ForegroundColor Red
        }
    } else {
        Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "💡 Dica: Use o comando abaixo para listar todos os devices:" -ForegroundColor Cyan
Write-Host "   Invoke-WebRequest -Uri '$apiUrl' -Method GET" -ForegroundColor Gray 