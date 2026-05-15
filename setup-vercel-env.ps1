
# ============================================================
#  Setup Vercel Environment Variables - LeadsUni
# ============================================================

$envVars = @{
    "NEXT_PUBLIC_FIREBASE_API_KEY"             = "AIzaSyCHYmEaetKgLMx-nVILg08s3HoMoxXVEag"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"         = "leadsuni-81534.firebaseapp.com"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"          = "leadsuni-81534"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"      = "leadsuni-81534.firebasestorage.app"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" = "622188331665"
    "NEXT_PUBLIC_FIREBASE_APP_ID"              = "1:622188331665:web:89f9b112b2f0c0c969b530"
    "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"      = "G-PJHN822ED9"
    "FIREBASE_PROJECT_ID"                      = "leadsuni-81534"
    "FIREBASE_CLIENT_EMAIL"                    = "firebase-adminsdk-fbsvc@leadsuni-81534.iam.gserviceaccount.com"
    "FIREBASE_PRIVATE_KEY"                     = "-----BEGIN PRIVATE KEY-----`nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCYkyheeC/Escl+`nxGZBKnl43v9vOpC5iDbir0nIeMD2EWozfzrnH34E2vN5L8WtHAbPN0Ug2uGZ39aq`nBBXGeAMYWbCDRjyhhMqtdjkkHAaQjF2dQgv6YGtV4f4WMg++V9drc7SnLZkZTc3Z`nCrH5MSeUmDo8CejJTvsCZxW6pnUdMDXichUXN2jCT5QJor5p9Cr32aHH4VpK5wwg`n50AsrZoUU8Tiu3Z7XeYJrAMUejDdcgSXLRSuY0cUpT/HAH1M6O8tOC3h35DrK/Mi`n/SsX+w57aSibAnpIUzKvxj/ZNhOKyXNv4xarJT0wv22NErzmmSBVsbYyaOSamZ0K`nLPMU2bSDAgMBAAECggEAKsP4qT4T2ZShr1Qae0KOCMisnT8zqKVbCP/r9PKP14j7`nFRMg7f6AQpkibIHs7QAxkmxiBnsDiC9bCo2Zkuc5qt4c4TbTMMy5SJSeIJZwapzF`ncpo8JEJZY5m0MAF5MzeI7Jfid4eK5bJOs/rQ9tGF0Bs5G3IFm0N1jO9bAlW89uCJ`nNSvMfalTCWX087nmfITGdxUltNO3ut/qmLGvSQuL2Hipc8F1fxmazGnG+s7h4D/Z`n1ErLSFq9GDwv4+1mIrx890o17ai6kWRZVDfjh6/yiCBk0H3RvfOlYfkIeeV2IMnV`nb7Q83Deq/JxeIfqgxoHX6HekKOcOxEYsPaEmehR5aQKBgQDIBX2m7klum4xcqN42`ntgQWgN79cP6HV3FurLXVTldqo4zDLh5+ioM3ZmKlPsgtdPh5Xm+l3j7MoYBcf1Xg`ntIcpnuG0yh4RObR0IlhdVXr1kOvj9efsMt7wCh0Lgh50R4AOSzHtLBEV8vDtIoo9`nq1sAtassh9vHnYfj+EL/gCDkuwKBgQDDRlxZkd1HZXfkv4AtZA1cKUbKv23X3oLp`nGQTUPIpV/Nes5CvmrFJjWsMH057s2cIvVOkA0CDVsKlJUZziO3YBEQHwtytR2waI`nmoREMCSv5i1YXb3pRzUuQcLI8wK+1Om4Z3/eepAiIw0glFS92DmGmhaKqXtpdyol`nVCWcUtNW2QKBgD9wjmPNm/i62Q/id2g+3pkMkq0rk271qwKBQMLAsDUgXlrhW8ai`nw+9kR9FFUlQoj05fR2YCUUSxzHaJ5ID6gQwQWmHu4Q5xkOxsoD4qCG+uYULSEZb2`no4Lakk++G06iBtmBu/oPSfP+M6/ijpn0qU5WUE41YN209w61BProdoZVAoGAOWSu`ns+y5OsjJ6kOWqsCjZJkFI4YMBMxzcYtW7gI1Lny37yrI9G1lcao1dFFwfnCqMDsm`nmISTgfsAZnpEQAH19u5Gwbc0VkSnsPKpOVllDwX6AeTbcnrpWIUfeOxjvC7b2sUg`nwgUH4+CldRPjrECm97bGNU8G5MKPcpU+0KlPUFECgYA0DtPuDey84KJL4k0hnsJT`nZwbnj+Y4TXVDiBK8Sg/so5Ul4YKStCBbbXdZgSOIXSQcrPcOUurgLbHTmL0nOk3H`nMR3UCowdBJ4cjloHGy/8SLqdrPi+Joa30Pgii1cAjW70F8B+M+VkB0/azB8R2t0Z`n+Xg1/eQb5uuxvqY0aiXB5A==`n-----END PRIVATE KEY-----`n"
}

Write-Host "Adicionando variaveis de ambiente no Vercel..." -ForegroundColor Cyan

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "  -> $key" -ForegroundColor Yellow
    $value | vercel env add $key production --force 2>&1 | Out-Null
    $value | vercel env add $key preview   --force 2>&1 | Out-Null
    $value | vercel env add $key development --force 2>&1 | Out-Null
}

Write-Host ""
Write-Host "Todas as variaveis foram adicionadas!" -ForegroundColor Green
Write-Host "Iniciando redeploy..." -ForegroundColor Cyan

vercel --prod

Write-Host "Deploy concluido!" -ForegroundColor Green
