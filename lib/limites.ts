import { supabase } from "./supabase-client"

export interface LimitesData {
  id: string
  email: string
  limite: number
  consumido: number
  restante: number
}

/**
 * Obtiene los datos de límites de un usuario desde Supabase
 * @param email Email del usuario
 * @returns Datos de límites o null si no se encuentra
 */
export async function getLimitesByEmail(email: string): Promise<LimitesData | null> {
  try {
    console.log('🔍 [Límites] Buscando para:', email)
    
    const { data, error } = await supabase
      .from('limites')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error) {
      console.log('⚠️ [Límites] Error en consulta:', {
        message: error.message,
        code: error.code,
        hint: error.hint
      })
      
      // Si es un error de "no rows", intentar sin .single()
      if (error.code === 'PGRST116') {
        console.log('⚠️ [Límites] No se encontró con .single(), intentando sin él...')
        const { data: dataAlt, error: errorAlt } = await supabase
          .from('limites')
          .select('*')
          .eq('email', email.toLowerCase().trim())
        
        if (errorAlt) {
          console.log('❌ [Límites] Error en consulta alternativa:', errorAlt.message)
          return null
        }
        
        if (!dataAlt || dataAlt.length === 0) {
          console.log('ℹ️ [Límites] No se encontraron registros para:', email)
          return null
        }
        
        const record = dataAlt[0]
        console.log('✅ [Límites] Encontrado (consulta alternativa):', {
          email: record.email,
          limite: record.limite,
          consumido: record.consumido,
          restante: record.restante
        })
        
        return {
          id: record.id,
          email: record.email,
          limite: parseFloat(record.limite) || 0,
          consumido: parseFloat(record.consumido) || 0,
          restante: parseFloat(record.restante) || 0
        }
      }
      
      console.log('ℹ️ [Límites] Retornando null por error no manejado')
      return null
    }

    if (!data) {
      console.log('ℹ️ [Límites] No hay datos para:', email)
      return null
    }

    console.log('✅ [Límites] Encontrado exitosamente:', {
      email: data.email,
      limite: data.limite,
      consumido: data.consumido,
      restante: data.restante
    })

    return {
      id: data.id,
      email: data.email,
      limite: parseFloat(data.limite) || 0,
      consumido: parseFloat(data.consumido) || 0,
      restante: parseFloat(data.restante) || 0
    }
  } catch (e: any) {
    console.log('❌ [Límites] Excepción capturada:', {
      message: e?.message || 'Unknown error',
      name: e?.name
    })
    return null
  }
}

