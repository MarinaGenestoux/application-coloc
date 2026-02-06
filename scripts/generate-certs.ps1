# Script de generation de certificats TLS auto-signes pour le developpement
# Pour la production, utilisez Let's Encrypt (certbot) ou un autre CA de confiance

$ErrorActionPreference = "Stop"

$CertsDir = ".\certs"
$DaysValid = 365

# Creer le repertoire des certificats
New-Item -ItemType Directory -Force -Path $CertsDir | Out-Null

Write-Host "🔐 Generation des certificats TLS auto-signes..." -ForegroundColor Cyan
Write-Host "⚠️  Ces certificats sont pour le DEVELOPPEMENT uniquement !" -ForegroundColor Yellow
Write-Host ""

# Verifier si OpenSSL est installe
try {
    $opensslVersion = & openssl version 2>&1
    Write-Host "✅ OpenSSL trouve : $opensslVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ OpenSSL n'est pas installe ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Installation recommandee :" -ForegroundColor Yellow
    Write-Host "  1. Via Chocolatey : choco install openssl" -ForegroundColor White
    Write-Host "  2. Via winget : winget install ShiningLight.OpenSSL" -ForegroundColor White
    Write-Host "  3. Telecharger depuis : https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor White
    exit 1
}

Write-Host ""

# 1. Generer la cle privee du serveur (RSA 4096 bits)
Write-Host "📝 Etape 1/3 : Generation de la cle privee..." -ForegroundColor Cyan
& openssl genrsa -out "$CertsDir\server-key.pem" 4096

# 2. Creer une demande de signature de certificat (CSR)
Write-Host "📝 Etape 2/3 : Creation de la demande de certificat..." -ForegroundColor Cyan
& openssl req -new `
  -key "$CertsDir\server-key.pem" `
  -out "$CertsDir\server-csr.pem" `
  -subj "/C=FR/ST=France/L=Paris/O=ColocApp/OU=Development/CN=localhost/emailAddress=dev@colocapp.local"

# 3. Creer le fichier de configuration pour les extensions SAN
$sanConfig = @"
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = FR
ST = France
L = Paris
O = ColocApp
OU = Development
CN = localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = 0.0.0.0
"@

$sanConfigPath = "$CertsDir\san.cnf"
$sanConfig | Out-File -FilePath $sanConfigPath -Encoding ASCII

# 3. Generer le certificat auto-signe (valide 365 jours)
Write-Host "📝 Etape 3/3 : Generation du certificat auto-signe..." -ForegroundColor Cyan
& openssl x509 -req `
  -in "$CertsDir\server-csr.pem" `
  -signkey "$CertsDir\server-key.pem" `
  -out "$CertsDir\server-cert.pem" `
  -days $DaysValid `
  -extensions v3_req `
  -extfile $sanConfigPath

# Nettoyer les fichiers temporaires
Remove-Item "$CertsDir\server-csr.pem" -ErrorAction SilentlyContinue
Remove-Item $sanConfigPath -ErrorAction SilentlyContinue

# Afficher les informations du certificat
Write-Host ""
Write-Host "✅ Certificats generes avec succes !" -ForegroundColor Green
Write-Host ""
Write-Host "📂 Fichiers crees :" -ForegroundColor Cyan
Write-Host "  - $CertsDir\server-key.pem  (cle privee - NE PAS PARTAGER)" -ForegroundColor White
Write-Host "  - $CertsDir\server-cert.pem (certificat public)" -ForegroundColor White
Write-Host ""
Write-Host "📋 Informations du certificat :" -ForegroundColor Cyan
& openssl x509 -in "$CertsDir\server-cert.pem" -noout -subject -issuer -dates
Write-Host ""
Write-Host "⚠️  IMPORTANT pour le developpement :" -ForegroundColor Yellow
Write-Host "  - Les navigateurs afficheront un avertissement de securite (normal pour les certificats auto-signes)"
Write-Host "  - Dans Chrome/Edge : cliquez sur 'Avance' puis 'Continuer vers localhost (dangereux)'"
Write-Host "  - Dans Firefox : ajoutez une exception de securite"
Write-Host ""
Write-Host "🚀 Pour la PRODUCTION, utilisez Let's Encrypt :" -ForegroundColor Green
Write-Host "  sudo certbot certonly --standalone -d votredomaine.com"
Write-Host ""
