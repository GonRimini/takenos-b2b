export async function getSheetData() {
  return getSheetDataByGid(400616177)
}

export async function getSheetDataByGid(gid: number | string) {
  const url = `https://docs.google.com/spreadsheets/d/10u2riMk6ndwEY1EDY1pTUB0YcpSOqdSxgnjqAjl1s4I/gviz/tq?tqx=out:json&gid=${gid}`
  const res = await fetch(url)
  const text = await res.text()
  const json = JSON.parse(text.substring(47, text.length - 2))
  const rows = json.table.rows.map((r: any) => r.c.map((c: any) => (c ? c.v : "")))
  return rows as any[][]
}

export function findRowByEmail(rows: any[][], email: string) {
  const target = email?.toLowerCase().trim()
  if (!target) return null
  return rows.find(r => (String(r[1] || "").toLowerCase().trim()) === target) || null
}
