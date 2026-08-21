$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$services = @(
  @{ Name = "eureka-server"; Path = "eureka-server\eureka-server"; DelaySeconds = 12 },
  @{ Name = "salon-user-service"; Path = "user service\user-service"; DelaySeconds = 4 },
  @{ Name = "salon-salon-service"; Path = "salon service\salon-service"; DelaySeconds = 4 },
  @{ Name = "salon-category-service"; Path = "category\category"; DelaySeconds = 4 },
  @{ Name = "salon-service-offering"; Path = "service-offering\service-offering"; DelaySeconds = 4 },
  @{ Name = "salon-booking-service"; Path = "booking\booking"; DelaySeconds = 4 },
  @{ Name = "salon-payment-service"; Path = "payment\payment"; DelaySeconds = 4 },
  @{ Name = "gateway-server"; Path = "gateway-server\gateway-server"; DelaySeconds = 0 }
)

foreach ($svc in $services) {
  $fullPath = Join-Path $root $svc.Path

  if (-not (Test-Path $fullPath)) {
    Write-Host "Skipping $($svc.Name): path not found -> $fullPath" -ForegroundColor Yellow
    continue
  }

  Write-Host "Starting $($svc.Name) from $fullPath" -ForegroundColor Cyan

  Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location -LiteralPath '$fullPath'; .\mvnw.cmd spring-boot:run"
  )

  if ($svc.DelaySeconds -gt 0) {
    Start-Sleep -Seconds $svc.DelaySeconds
  }
}

Write-Host "All service start commands launched." -ForegroundColor Green
Write-Host "Gateway routes from application.yaml are now covered by running services." -ForegroundColor Green
