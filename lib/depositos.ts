import { supabase } from "./supabase-client"

// =====================================================
// TIPOS DE DATOS
// =====================================================

export interface DepositoACH {
  id: string
  email: string
  routing_number: string
  account_number: string
  beneficiary_name: string
  receiver_bank: string
  account_type: string
  beneficiary_address: string
  beneficiary_bank_address: string
}

export interface DepositoSWIFT {
  id: string
  email: string
  swift_bic_code: string
  account_number: string
  beneficiary_name: string
  receiver_bank: string
  account_type: string
  beneficiary_address: string
  beneficiary_bank_address: string
}

export interface DepositoCrypto {
  id: string
  email: string
  title: string
  deposit_address: string
  network: string
  created_at?: string
}

export interface DepositoLocal {
  id: string
  email: string
  beneficiario: string
  banco: string
  nro_de_cuenta: string
  identificacion: string
  cbu: string
  alias: string
  created_at?: string
}

// =====================================================
// FUNCIONES DE CONSULTA
// =====================================================

/**
 * Obtiene los datos de depósito ACH de un usuario desde Supabase
 */
export async function getDepositoACH(email: string): Promise<DepositoACH | null> {
  try {
    console.log('🔍 [ACH] Buscando para:', email)
    
    const { data, error } = await supabase
      .from('ach_accounts')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error) {
      console.log('⚠️ [ACH] Error:', error.code, error.message)
      return null
    }

    if (!data) {
      console.log('ℹ️ [ACH] No hay datos para:', email)
      return null
    }

    console.log('✅ [ACH] Encontrado exitosamente')
    return data as DepositoACH
  } catch (e: any) {
    console.log('❌ [ACH] Excepción:', e?.message)
    return null
  }
}

/**
 * Obtiene los datos de depósito SWIFT de un usuario desde Supabase
 */
export async function getDepositoSWIFT(email: string): Promise<DepositoSWIFT | null> {
  try {
    console.log('🔍 [SWIFT] Buscando para:', email)
    
    const { data, error } = await supabase
      .from('swift_accounts')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error) {
      console.log('⚠️ [SWIFT] Error:', error.code, error.message)
      return null
    }

    if (!data) {
      console.log('ℹ️ [SWIFT] No hay datos para:', email)
      return null
    }

    console.log('✅ [SWIFT] Encontrado exitosamente')
    return data as DepositoSWIFT
  } catch (e: any) {
    console.log('❌ [SWIFT] Excepción:', e?.message)
    return null
  }
}

/**
 * Obtiene todos los datos de depósito Crypto de un usuario desde Supabase
 * Un usuario puede tener múltiples wallets crypto
 */
export async function getDepositosCrypto(email: string): Promise<DepositoCrypto[]> {
  try {
    console.log('🔍 [Crypto] Buscando para:', email)
    
    const { data, error } = await supabase
      .from('crypto_wallets')
      .select('*')
      .eq('email', email.toLowerCase().trim())

    if (error) {
      console.log('⚠️ [Crypto] Error:', error.code, error.message)
      return []
    }

    if (!data || data.length === 0) {
      console.log('ℹ️ [Crypto] No hay datos para:', email)
      return []
    }

    console.log('✅ [Crypto] Encontrados', data.length, 'wallets')
    return data as DepositoCrypto[]
  } catch (e: any) {
    console.log('❌ [Crypto] Excepción:', e?.message)
    return []
  }
}

/**
 * Obtiene los datos de depósito en Moneda Local de un usuario desde Supabase
 */
export async function getDepositoLocal(email: string): Promise<DepositoLocal | null> {
  try {
    console.log('🔍 [Local] Buscando para:', email)
    
    const { data, error } = await supabase
      .from('local')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error) {
      console.log('⚠️ [Local] Error:', error.code, error.message)
      return null
    }

    if (!data) {
      console.log('ℹ️ [Local] No hay datos para:', email)
      return null
    }

    console.log('✅ [Local] Encontrado exitosamente')
    return data as DepositoLocal
  } catch (e: any) {
    console.log('❌ [Local] Excepción:', e?.message)
    return null
  }
}

