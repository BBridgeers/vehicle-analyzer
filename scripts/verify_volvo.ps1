$Url = "https://dallas.craigslist.org/dal/cto/d/dallas-2016-volvo-s60-clean/7915591126.html"
$Headers = @{
    "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

Write-Host "Fetching $Url ..."

try {
    $Response = Invoke-WebRequest -Uri $Url -Headers $Headers -UseBasicParsing
    Write-Host "Status Code: $($Response.StatusCode)"
    Write-Host "Content Length: $($Response.Content.Length)"
    
    # Simple regex extraction to mimic Cheerio logic for verification
    if ($Response.Content -match 'odometer:</span>\s*<span class="valu">([^<]+)<') {
        Write-Host "Odometer Found: $($Matches[1])"
    } elseif ($Response.Content -match 'odometer:</span>\s*<span class="valu">\s*<a[^>]+>([^<]+)<') {
        Write-Host "Odometer (Linked) Found: $($Matches[1])"
    } else {
        Write-Host "Odometer NOT Found via Regex"
    }

} catch {
    Write-Host "Request Failed: $_"
}
