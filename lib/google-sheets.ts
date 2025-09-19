export async function getSheetData() {
  return getSheetDataByGid(400616177)
}

export async function getSheetDataByGid(gid: number | string) {
  const url = `https://docs.google.com/spreadsheets/d/10u2riMk6ndwEY1EDY1pTUB0YcpSOqdSxgnjqAjl1s4I/gviz/tq?tqx=out:json&gid=${gid}`
  const res = await fetch(url)
  const text = await res.text()
  const json = JSON.parse(text.substring(47, text.length - 2))
  const rows = json.table.rows.map((r: any) => r.c.map((c: any) => (c ? c.v : "")))
  
  // Debug: log sheet structure
  console.log(`📊 Google Sheet data loaded for GID ${gid}:`)
  console.log('Total rows:', rows.length)
  if (rows.length > 0) {
    console.log('Header row (row 0):', rows[0])
    if (rows.length > 1) {
      console.log('Sample data row (row 1):', rows[1])
    }
  }
  
  return rows as any[][]
}

export function findRowByEmail(rows: any[][], email: string) {
  const target = email?.toLowerCase().trim()
  if (!target) return null
  
  const match = rows.find(r => (String(r[1] || "").toLowerCase().trim()) === target) || null
  
  // Debug: log the found row to see the data structure
  if (match) {
    console.log('🔍 Google Sheet row found for', email, ':', match)
    console.log('🔍 Row indices:')
    match.forEach((val, idx) => {
      console.log(`  [${idx}]: "${val}"`)
    })
  } else {
    console.log('❌ No match found for email:', email)
    console.log('Available emails in sheet:', rows.slice(0, 5).map(r => r[1])) // Show first 5 emails for reference
  }
  
  return match
}

export function findAllRowsByEmail(rows: any[][], email: string) {
  const target = email?.toLowerCase().trim()
  if (!target) return []
  
  const matches = rows.filter(r => (String(r[1] || "").toLowerCase().trim()) === target)
  
  // Debug: log all found rows
  if (matches.length > 0) {
    console.log(`🔍 Found ${matches.length} crypto wallets for ${email}:`)
    matches.forEach((match, idx) => {
      console.log(`  Wallet ${idx + 1}:`, match)
    })
  } else {
    console.log('❌ No crypto wallets found for email:', email)
  }
  
  return matches
}
