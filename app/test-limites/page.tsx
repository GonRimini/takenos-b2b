"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth"
import { supabase } from "@/lib/supabase-client"
import { getLimitesByEmail } from "@/lib/limites"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TestLimitesPage() {
  const { user } = useAuth()
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const testResults: any = {}

    // Test 1: Usuario autenticado
    testResults.user = user ? {
      email: user.email,
      id: user.id,
      authenticated: true
    } : {
      authenticated: false,
      error: "No hay usuario autenticado"
    }

    // Test 2: Conexión a Supabase
    try {
      const { data, error } = await supabase.from('limites').select('*').limit(1)
      testResults.supabaseConnection = {
        success: !error,
        error: error?.message || null,
        data: data
      }
    } catch (e: any) {
      testResults.supabaseConnection = {
        success: false,
        error: e.message
      }
    }

    // Test 3: Consulta directa con email del usuario
    if (user?.email) {
      try {
        const { data, error } = await supabase
          .from('limites')
          .select('*')
          .eq('email', user.email.toLowerCase().trim())
        
        testResults.directQuery = {
          success: !error,
          error: error?.message || null,
          data: data,
          count: data?.length || 0
        }
      } catch (e: any) {
        testResults.directQuery = {
          success: false,
          error: e.message
        }
      }

      // Test 4: Usar la función getLimitesByEmail
      try {
        const limites = await getLimitesByEmail(user.email)
        testResults.functionQuery = {
          success: limites !== null,
          data: limites
        }
      } catch (e: any) {
        testResults.functionQuery = {
          success: false,
          error: e.message
        }
      }
    }

    // Test 5: Ver todos los registros (para debugging)
    try {
      const { data, error } = await supabase.from('limites').select('email')
      testResults.allEmails = {
        success: !error,
        error: error?.message || null,
        emails: data?.map(d => d.email) || []
      }
    } catch (e: any) {
      testResults.allEmails = {
        success: false,
        error: e.message
      }
    }

    setResults(testResults)
    setLoading(false)
  }

  useEffect(() => {
    if (user) {
      runTests()
    }
  }, [user])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Diagnóstico de Límites</h1>
        <p className="text-muted-foreground">
          Esta página muestra información de diagnóstico para la tabla de límites
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Usuario Autenticado</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto">
              {JSON.stringify(results.user, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conexión a Supabase</CardTitle>
            <CardDescription>Test de conexión básica a la tabla limites</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto">
              {JSON.stringify(results.supabaseConnection, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consulta Directa (por email)</CardTitle>
            <CardDescription>Busca límites usando el email del usuario autenticado</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto">
              {JSON.stringify(results.directQuery, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Función getLimitesByEmail()</CardTitle>
            <CardDescription>Prueba la función personalizada</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto">
              {JSON.stringify(results.functionQuery, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emails en la tabla</CardTitle>
            <CardDescription>Lista de todos los emails registrados (para verificar)</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto">
              {JSON.stringify(results.allEmails, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Button onClick={runTests} disabled={loading}>
          {loading ? "Ejecutando tests..." : "Re-ejecutar tests"}
        </Button>
      </div>
    </div>
  )
}

