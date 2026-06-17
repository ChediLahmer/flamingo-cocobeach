# Start all Flamingo Coco Beach services
$root = $PSScriptRoot

# Backend API (port 3000)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run dev"

# Client frontend (port 5173)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\client'; npm run dev"

# Admin frontend (port 5174)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\admin'; npm run dev"

Write-Host "Started: Backend :3000 | Client :5173 | Admin :5174" -ForegroundColor Green
