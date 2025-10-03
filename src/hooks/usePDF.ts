import { useState, useCallback } from 'react'
import { extractTextWithPositions } from '../utils/pdfExtractionUtils'
import { Sentence } from '../utils/textProcessor'

interface UsePDFReturn {
  extractTextWithPositions: (file: File) => Promise<{ sentences: Sentence[] }>
  isLoading: boolean
}

export const usePDF = (): UsePDFReturn => {
  const [isLoading, setIsLoading] = useState(false)

  const extractText = useCallback(async (file: File): Promise<{ sentences: Sentence[] }> => {
    setIsLoading(true)
    
    try {
      const result = await extractTextWithPositions(file)
      return { sentences: result.sentences }
    } catch (error) {
      console.error('Error extracting text with positions:', error)
      throw new Error('Failed to extract text with positions')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    extractTextWithPositions: extractText,
    isLoading
  }
}
