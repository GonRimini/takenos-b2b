import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Missing userId" }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE!
  const endpoint = `${url}/rest/v1/payout_accounts_active?user_id=eq.${encodeURIComponent(
    userId
  )}&order=is_default.desc,created_at.desc&select=id,category,method,nickname,last4,beneficiary_bank,wallet_network,local_bank,details`

  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!res.ok) {
    const txt = await res.text()
    return NextResponse.json({ ok: false, error: txt }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json({ ok: true, data })
}
