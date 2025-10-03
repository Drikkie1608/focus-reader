/**
 * PDF Extraction Utilities
 * Handles PDF text extraction with bounding boxes
 */

import * as pdfjsLib from 'pdfjs-dist'
import { TextItem, createTextItem, groupTextItemsIntoSentences, Sentence } from './textProcessor'

export interface PDFExtractionResult {
  sentences: Sentence[]
}

/**
 * Extracts text and bounding boxes from PDF
 * @param file - PDF file
 * @returns Promise with sentences and their text items
 */
export async function extractTextWithPositions(file: File): Promise<PDFExtractionResult> {
  // Set worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
  
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  
  let fullText = ''
  const allTextItems: TextItem[] = []
  
  // Extract text and positions from all pages
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    const viewport = page.getViewport({ scale: 1.0 })
    
    textContent.items.forEach((item: any) => {
      if (item.str && item.str.trim()) {
        const textItem = createTextItem(item, pageNum, viewport)
        allTextItems.push(textItem)
        fullText += item.str + ' '
      }
    })
    
    fullText += '\n'
  }
  
  // Group text items chronologically into sentences
  // This is the single source of truth for sentence boundaries
  const sentences = groupTextItemsIntoSentences(allTextItems)
  
  return { sentences }
}
