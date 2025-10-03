/**
 * Text Item Utilities
 * Handles text item processing and grouping
 */

import { 
  splitIntoSentencesAdvanced, 
  groupTextItemsIntoSentencesAdvanced, 
  ProcessedSentence 
} from './sentenceProcessor'

export interface TextItem {
  text: string
  pageNumber: number
  leftPercent: number
  topPercent: number
  widthPercent: number
  heightPercent: number
}

export interface Sentence {
  text: string
  textItems: TextItem[]
  pageNumber: number
}

/**
 * Groups text items into sentences using advanced word-level matching
 * @param textItems - Array of text items in chronological order
 * @param sentences - Array of sentence texts
 * @returns Array of sentence objects with their text items
 */
export function groupTextItemsIntoSentences(textItems: TextItem[], sentences: string[]): Sentence[] {
  // Convert string sentences to processed sentences
  const processedSentences = sentences.map(text => ({
    text,
    originalText: text,
    wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
    hasEndingPunctuation: /[.!?]$/.test(text)
  }))
  
  // Use advanced grouping
  const result = groupTextItemsIntoSentencesAdvanced(textItems, processedSentences)
  
  return result.map(item => ({
    text: item.text,
    textItems: item.textItems,
    pageNumber: item.pageNumber
  }))
}

/**
 * Splits text into sentences using advanced splitting that preserves punctuation
 * @param text - Full text to split
 * @returns Array of sentences
 */
export function splitIntoSentences(text: string): string[] {
  const processedSentences = splitIntoSentencesAdvanced(text)
  return processedSentences.map(s => s.text)
}

/**
 * Creates a text item with percentage-based coordinates
 * @param item - PDF.js text item
 * @param pageNumber - Page number
 * @param viewport - Page viewport
 * @returns TextItem with percentage coordinates
 */
export function createTextItem(item: any, pageNumber: number, viewport: any): TextItem {
  const transform = item.transform || [1, 0, 0, 1, 0, 0]
  const x = transform[4] || 0
  const y = transform[5] || 0
  const width = item.width || 0
  const height = item.height || 0
  
  return {
    text: item.str,
    pageNumber,
    leftPercent: (x / viewport.width) * 100,
    topPercent: ((viewport.height - y - height) / viewport.height) * 100,
    widthPercent: (width / viewport.width) * 100,
    heightPercent: (height / viewport.height) * 100
  }
}
