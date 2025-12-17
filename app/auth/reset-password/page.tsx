"use client"

import { Suspense } from "react"
import Image from "next/image"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

function ResetPasswordContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo-takenos.avif" alt="Takenos" width={120} height={40} className="h-10 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Contraseña</h1>
          <p className="text-gray-600">Establece tu nueva contraseña</p>
        </div>
        
        <ResetPasswordForm />
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}