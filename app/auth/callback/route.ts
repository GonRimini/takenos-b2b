import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const next = requestUrl.searchParams.get("next")

  // Si hay un código, necesitamos pasarlo al cliente para que lo maneje
  if (code) {
    // Determinar la URL de destino basándose en el tipo de flujo
    let destination = '/dashboard'
    
    // Verificar si es un flujo de recuperación de contraseña
    if (type === 'recovery' || next?.includes('reset-password')) {
      destination = '/auth/reset-password'
    } else if (next) {
      destination = next
    }
    
    // Redirigir al destino con el código como parámetro para que el cliente lo procese
    return NextResponse.redirect(
      `${requestUrl.origin}${destination}?code=${code}`
    )
  }

  // Si no hay código, redirigir al login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}
