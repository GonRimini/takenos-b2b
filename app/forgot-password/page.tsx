"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo-takenos.avif" alt="Takenos" width={120} height={40} className="h-10 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Recuperar Contraseña</h1>
          <p className="text-gray-600">Te enviaremos un enlace para resetear tu contraseña</p>
        </div>
        
        <ForgotPasswordForm />
        
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/login")}
            className="text-sm hover:text-violet-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio de sesión
          </Button>
        </div>
      </div>
    </div>
  )
}