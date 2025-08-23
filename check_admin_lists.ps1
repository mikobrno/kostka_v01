# Analýza admin_lists pro migraci
# Načte data z Supabase a najde všechny list_type hodnoty

Write-Host "Načítám .env soubor..."

# Načtení .env
$envFile = Join-Path (Get-Location) '.env'
if (-not (Test-Path $envFile)) { 
    Write-Error '.env nenalezen v kořeni projektu'
    exit 1 
}

$env = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') { 
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $env[$key] = $value
    }
}

$SUPABASE_URL = $env['VITE_SUPABASE_URL']
$KEY = $env['VITE_SUPABASE_ANON_KEY']

if (-not $SUPABASE_URL -or -not $KEY) { 
    Write-Error 'VITE_SUPABASE_URL nebo VITE_SUPABASE_ANON_KEY chybí v .env'
    exit 1 
}

Write-Host "Připojuji se k Supabase: $SUPABASE_URL"

# Připravit hlavičky
$headers = @{
    'apikey' = $KEY
    'Authorization' = "Bearer $KEY"
    'Content-Type' = 'application/json'
}

try {
    # Získat všechny řádky z admin_lists
    Write-Host "Načítám admin_lists..."
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/admin_lists?select=*" -Headers $headers -Method GET
    
    Write-Host "Nalezeno $($response.Count) řádků"
    
    # Agregace podle list_type
    $grouped = $response | Group-Object -Property list_type | Sort-Object Name
    
    Write-Host "`n== Přehled všech list_type =="
    foreach ($group in $grouped) {
        Write-Host "$($group.Name) => $($group.Count) řádků"
    }
    
    # Definované povolené hodnoty podle migrace
    $allowed = @('titles','marital_statuses','document_types','banks','institutions','liability_types','povoleni_k_pobytu')
    
    # Najít nevalidní
    $invalid = $grouped | Where-Object { $allowed -notcontains $_.Name }
    
    if ($invalid.Count -eq 0) {
        Write-Host "`n✅ Všechny list_type jsou v povoleném seznamu - migrace může pokračovat!"
    } else {
        Write-Host "`n❌ Nalezeny nevalidní list_type:"
        foreach ($inv in $invalid) {
            Write-Host "  - $($inv.Name) ($($inv.Count) řádků)"
            
            # Uložit detaily nevalidních řádků
            $filename = "admin_lists_$($inv.Name -replace '[^a-zA-Z0-9]', '_').json"
            $inv.Group | ConvertTo-Json -Depth 10 | Out-File $filename -Encoding utf8
            Write-Host "    Detaily uloženy do: $filename"
        }
        
        Write-Host "`nPřed spuštěním migrace je třeba opravit nebo přejmenovat tyto řádky."
    }
    
    # Uložit kompletní dump
    $response | ConvertTo-Json -Depth 10 | Out-File admin_lists_complete.json -Encoding utf8
    Write-Host "`nKompletní dump uložen do: admin_lists_complete.json"
    
    Write-Host "`n== Povolené hodnoty podle migrace =="
    $allowed | ForEach-Object { Write-Host "  - $_" }

} catch {
    Write-Error "Chyba při načítání dat: $($_.Exception.Message)"
    exit 1
}
