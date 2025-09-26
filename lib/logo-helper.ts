// Helper para convertir el logo de Takenos a base64 para usar en PDFs

export const getLogoBase64 = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto del canvas'))
        return
      }
      
      // Ajustar el tamaño del canvas al de la imagen
      canvas.width = img.width
      canvas.height = img.height
      
      // Dibujar la imagen en el canvas
      ctx.drawImage(img, 0, 0)
      
      // Convertir a base64
      const base64 = canvas.toDataURL('image/png')
      resolve(base64)
    }
    
    img.onerror = () => {
      reject(new Error('No se pudo cargar el logo'))
    }
    
    // Cargar el logo desde la carpeta public
    // Usar el logo transparente de Takenos
    img.src = '/logo-takenos-transparent.png'
  })
}

// Función que devuelve base64 del logo o null si falla
export const getLogoBase64Safe = async (): Promise<string | null> => {
  try {
    return await getLogoBase64()
  } catch (error) {
    console.warn('No se pudo cargar el logo para el PDF:', error)
    return null
  }
}
