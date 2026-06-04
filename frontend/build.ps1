# Build script for Condominio frontend
Write-Host "🏗️  Installing dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host "🔨 Building project..." -ForegroundColor Cyan

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful! Output in ./dist" -ForegroundColor Green
Write-Host "🚀 Run 'npm run dev' to start development server" -ForegroundColor Cyan
