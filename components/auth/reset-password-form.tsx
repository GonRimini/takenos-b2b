"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase-client"

const resetPasswordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [hasValidToken, setHasValidToken] = useState<boolean | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    // Verificar si hay una sesión de recuperación válida
    const checkToken = async () => {
      // Primero verificar si hay un código en la URL (viene del callback)
      const code = searchParams.get('code')
      
      if (code) {
        // Intercambiar el código por una sesión
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (data.session && !error) {
          setHasValidToken(true)
          // Limpiar el código de la URL
          window.history.replaceState({}, '', '/auth/reset-password')
          return
        } else {
          console.error('Error al intercambiar código:', error)
          setHasValidToken(false)
          return
        }
      }

      // Si no hay código, intentar obtener la sesión actual
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (session && !error) {
        // Si hay una sesión activa, permitir el cambio de contraseña
        setHasValidToken(true)
        return
      }

      // Si no hay sesión, verificar si hay un hash de recuperación válido (método legacy)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')

      if (type === 'recovery' && accessToken) {
        // Establecer la sesión con el access token del hash
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        })
        
        if (!sessionError) {
          setHasValidToken(true)
          // Limpiar el hash de la URL
          window.history.replaceState({}, '', '/auth/reset-password')
        } else {
          setHasValidToken(false)
        }
      } else {
        setHasValidToken(false)
      }
    }

    checkToken()
  }, [searchParams])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      })
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setIsSuccess(true)
        toast({
          title: "¡Contraseña actualizada!",
          description: "Tu contraseña ha sido cambiada correctamente",
        })
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Si aún está verificando el token
  if (hasValidToken === null) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Loader2 className="h-16 w-16 text-gray-400 mx-auto animate-spin" />
            <p className="text-gray-600">Verificando enlace...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Si el token no es válido
  if (hasValidToken === false) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h3 className="text-xl font-semibold">Enlace inválido o expirado</h3>
            <p className="text-gray-600">
              Este enlace de recuperación no es válido o ha expirado. 
              Por favor, solicita un nuevo enlace de recuperación.
            </p>
            <Button onClick={() => router.push("/forgot-password")} className="w-full">
              Solicitar nuevo enlace
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Si ya se cambió la contraseña exitosamente
  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold">¡Contraseña actualizada!</h3>
            <p className="text-gray-600">
              Tu contraseña ha sido cambiada correctamente. 
              Serás redirigido al inicio de sesión...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Formulario para establecer nueva contraseña
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Nueva Contraseña</CardTitle>
        <CardDescription className="text-center">
          Ingresa tu nueva contraseña
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                {...register("password")}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <Alert variant="destructive">
                <AlertDescription>{errors.password.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repite tu contraseña"
                {...register("confirmPassword")}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <Alert variant="destructive">
                <AlertDescription>{errors.confirmPassword.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cambiar Contraseña
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}