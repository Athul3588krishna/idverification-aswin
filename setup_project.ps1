# ExamShield Automated Setup Script (PowerShell)
# Run in PowerShell: .\setup_project.ps1

Write-Host "🚀 ExamShield - Starting Project Setup & Verification..." -ForegroundColor Green

$ProjectRoot = Get-Location
Write-Host "📂 Base Directory: $ProjectRoot"

# 1. SERVER SETUP
Write-Host "`n📦 Checking Backend (Server)..." -ForegroundColor Yellow
if (-not (Test-Path "server")) {
    New-Item -ItemType Directory -Path "server" | Out-Null
    Write-Host "Created server directory." -ForegroundColor Cyan
}

Set-Location "$ProjectRoot\server"

if (-not (Test-Path "package.json")) {
    Write-Host "Initializing npm in server..." -ForegroundColor Cyan
    npm init -y
}

Write-Host "⚡ Installing/Verifying Server Dependencies..." -ForegroundColor Cyan
npm install express mongoose dotenv cors bcryptjs jsonwebtoken multer tesseract.js socket.io nodemailer morgan express-async-handler
npm install --save-dev nodemon

$serverDirs = @("config", "controllers", "models", "routes", "middleware", "utils", "uploads")
foreach ($dir in $serverDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }
}

if (-not (Test-Path ".env")) {
    Write-Host "Creating default server .env file..." -ForegroundColor Cyan
@"
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/examshield
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
UPLOAD_PATH=./uploads
"@ | Out-File -FilePath ".env" -Encoding utf8
}

# 2. CLIENT SETUP
Set-Location $ProjectRoot
Write-Host "`n🎨 Checking Frontend (Client)..." -ForegroundColor Yellow
if (-not (Test-Path "client")) {
    Write-Host "Creating Vite React application in client..." -ForegroundColor Cyan
    npm create vite@latest client -- --template react
}

Set-Location "$ProjectRoot\client"

Write-Host "⚡ Installing/Verifying Client Dependencies..." -ForegroundColor Cyan
npm install react-router-dom axios bootstrap react-bootstrap react-icons react-toastify socket.io-client

if (-not (Test-Path ".env")) {
    Write-Host "Creating default client .env file..." -ForegroundColor Cyan
@"
VITE_API_BASE_URL=http://localhost:5001/api
"@ | Out-File -FilePath ".env" -Encoding utf8
}

Set-Location $ProjectRoot
Write-Host "`n✅ ExamShield Project Setup & Dependencies Verification Completed Successfully!" -ForegroundColor Green
Write-Host "💡 To start development:" -ForegroundColor White
Write-Host "   Backend:  cd server && npm run dev" -ForegroundColor Gray
Write-Host "   Frontend: cd client && npm run dev" -ForegroundColor Gray
