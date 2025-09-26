"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth"
import { getCompanyData, findCompanyByEmail } from "@/lib/google-sheets"

const COMPANY_NAME_KEY = "takenos_company_name"
const COMPANY_NAME_EMAIL_KEY = "takenos_company_name_email"

export function useCompanyName() {
  const { user } = useAuth()
  const [companyName, setCompanyName] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Función para guardar en localStorage
  const saveCompanyNameToStorage = (name: string, email: string) => {
    try {
      localStorage.setItem(COMPANY_NAME_KEY, name)
      localStorage.setItem(COMPANY_NAME_EMAIL_KEY, email)
    } catch (error) {
      console.warn("Error saving company name to localStorage:", error)
    }
  }

  // Función para obtener de localStorage
  const getCompanyNameFromStorage = (email: string): string | null => {
    try {
      const storedEmail = localStorage.getItem(COMPANY_NAME_EMAIL_KEY)
      const storedName = localStorage.getItem(COMPANY_NAME_KEY)
      
      // Solo devolver el nombre si es para el mismo email
      if (storedEmail === email && storedName) {
        return storedName
      }
    } catch (error) {
      console.warn("Error reading company name from localStorage:", error)
    }
    return null
  }

  // Función para cargar el nombre de la empresa desde Google Sheets
  const loadCompanyName = async (email: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // Primero intentar obtener de localStorage
      const cachedName = getCompanyNameFromStorage(email)
      if (cachedName) {
        console.log("🏢 Using cached company name:", cachedName)
        setCompanyName(cachedName)
        setLoading(false)
        return cachedName
      }

      // Si no está en cache, obtener de Google Sheets
      console.log("🏢 Loading company data from Google Sheets for:", email)
      const rows = await getCompanyData()
      const companyRow = findCompanyByEmail(rows, email)
      
      if (companyRow && companyRow[1]) {
        const name = String(companyRow[1]).trim()
        setCompanyName(name)
        saveCompanyNameToStorage(name, email)
        console.log("🏢 Company name loaded and cached:", name)
        return name
      } else {
        console.log("🏢 No company found for email, using email as fallback")
        setCompanyName(email)
        return email
      }
    } catch (err: any) {
      console.error("Error loading company name:", err)
      setError(err?.message || "Error cargando nombre de empresa")
      setCompanyName(email) // Fallback to email
      return email
    } finally {
      setLoading(false)
    }
  }

  // Función para limpiar el cache (útil para testing o cambios de usuario)
  const clearCompanyNameCache = () => {
    try {
      localStorage.removeItem(COMPANY_NAME_KEY)
      localStorage.removeItem(COMPANY_NAME_EMAIL_KEY)
      setCompanyName("")
    } catch (error) {
      console.warn("Error clearing company name cache:", error)
    }
  }

  // Efecto para cargar el nombre cuando cambia el usuario
  useEffect(() => {
    if (user?.email) {
      loadCompanyName(user.email)
    } else {
      setCompanyName("")
      setError(null)
    }
  }, [user?.email])

  return {
    companyName,
    loading,
    error,
    refreshCompanyName: () => user?.email ? loadCompanyName(user.email) : Promise.resolve(""),
    clearCompanyNameCache
  }
}
