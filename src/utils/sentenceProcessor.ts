/**
 * Advanced Sentence Processing Utilities
 * Handles complex sentence splitting and text normalization
 */

export interface ProcessedSentence {
  text: string
  originalText: string
  wordCount: number
  hasEndingPunctuation: boolean
}

/**
 * Advanced sentence splitting that preserves punctuation and handles edge cases
 */
export function splitIntoSentencesAdvanced(text: string): ProcessedSentence[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  // Normalize whitespace first
  const normalizedText = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()

  // Split on sentence endings while preserving punctuation
  const parts = normalizedText.split(/([.!?]+)/)
  const sentences: ProcessedSentence[] = []
  
  let currentSentence = ''
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim()
    
    if (!part) continue
    
    // Check if this part is punctuation
    if (/^[.!?]+$/.test(part)) {
      currentSentence += part
      
      // Only create sentence if we have content
      if (currentSentence.trim().length > 0) {
        const processed = processSentence(currentSentence.trim())
        if (processed.wordCount > 0) {
          sentences.push(processed)
        }
        currentSentence = ''
      }
    } else {
      // This is text content
      currentSentence += part
    }
  }
  
  // Handle any remaining text without ending punctuation
  if (currentSentence.trim().length > 0) {
    const processed = processSentence(currentSentence.trim())
    if (processed.wordCount > 0) {
      sentences.push(processed)
    }
  }
  
  return sentences
}

/**
 * Process individual sentence for normalization and metadata
 */
function processSentence(sentence: string): ProcessedSentence {
  const originalText = sentence
  const normalizedText = sentence
    .replace(/\s+/g, ' ')
    .trim()
  
  const words = normalizedText.split(/\s+/).filter(word => word.length > 0)
  const hasEndingPunctuation = /[.!?]$/.test(normalizedText)
  
  return {
    text: normalizedText,
    originalText,
    wordCount: words.length,
    hasEndingPunctuation
  }
}

/**
 * Find the best match between a sentence and text items using word-level matching
 */
export function findBestTextItemMatch(
  sentence: ProcessedSentence,
  textItems: Array<{ text: string; pageNumber: number }>,
  startIndex: number = 0
): { matchedItems: Array<{ text: string; pageNumber: number }>, endIndex: number } {
  const sentenceWords = sentence.text.toLowerCase().split(/\s+/)
  const matchedItems: Array<{ text: string; pageNumber: number }> = []
  let currentWordIndex = 0
  let textItemIndex = startIndex
  
  // Try to match words sequentially
  while (textItemIndex < textItems.length && currentWordIndex < sentenceWords.length) {
    const textItem = textItems[textItemIndex]
    const itemWords = textItem.text.toLowerCase().split(/\s+/)
    
    // Check if any word in this text item matches the current sentence word
    let foundMatch = false
    for (const itemWord of itemWords) {
      if (itemWord === sentenceWords[currentWordIndex]) {
        matchedItems.push(textItem)
        currentWordIndex++
        foundMatch = true
        break
      }
    }
    
    if (!foundMatch) {
      // If we've already matched some words, this might be the end
      if (matchedItems.length > 0) {
        break
      }
    }
    
    textItemIndex++
  }
  
  return {
    matchedItems,
    endIndex: textItemIndex
  }
}

/**
 * Improved text item grouping that uses word-level matching
 */
export function groupTextItemsIntoSentencesAdvanced(
  textItems: Array<{ text: string; pageNumber: number; leftPercent: number; topPercent: number; widthPercent: number; heightPercent: number }>,
  sentences: ProcessedSentence[]
): Array<{
  text: string
  textItems: Array<{ text: string; pageNumber: number; leftPercent: number; topPercent: number; widthPercent: number; heightPercent: number }>
  pageNumber: number
}> {
  const result: Array<{
    text: string
    textItems: Array<{ text: string; pageNumber: number; leftPercent: number; topPercent: number; widthPercent: number; heightPercent: number }>
    pageNumber: number
  }> = []
  
  let textItemIndex = 0
  
  for (const sentence of sentences) {
    const { matchedItems, endIndex } = findBestTextItemMatch(sentence, textItems, textItemIndex)
    
    if (matchedItems.length > 0) {
      result.push({
        text: sentence.text,
        textItems: matchedItems,
        pageNumber: matchedItems[0].pageNumber
      })
      textItemIndex = endIndex
    } else {
      // Fallback: take items sequentially based on word count
      const fallbackItems = []
      let wordsCollected = 0
      const targetWords = sentence.wordCount
      
      while (textItemIndex < textItems.length && wordsCollected < targetWords + 2) {
        const item = textItems[textItemIndex]
        fallbackItems.push(item)
        
        const itemWords = item.text.split(/\s+/).filter(w => w.length > 0)
        wordsCollected += itemWords.length
        textItemIndex++
        
        if (wordsCollected >= targetWords) {
          break
        }
      }
      
      if (fallbackItems.length > 0) {
        result.push({
          text: sentence.text,
          textItems: fallbackItems,
          pageNumber: fallbackItems[0].pageNumber
        })
      }
    }
  }
  
  return result
}

/**
 * Validate sentence-text item alignment
 */
export function validateSentenceAlignment(
  sentence: ProcessedSentence,
  textItems: Array<{ text: string }>
): { isValid: boolean; confidence: number; issues: string[] } {
  const issues: string[] = []
  let confidence = 1.0
  
  // Check word count alignment
  const sentenceWords = sentence.text.split(/\s+/)
  const textItemWords = textItems.flatMap(item => item.text.split(/\s+/)).filter(w => w.length > 0)
  
  const wordCountDiff = Math.abs(sentenceWords.length - textItemWords.length)
  if (wordCountDiff > 2) {
    issues.push(`Word count mismatch: sentence has ${sentenceWords.length} words, text items have ${textItemWords.length}`)
    confidence -= 0.3
  }
  
  // Check for major text differences
  const sentenceText = sentence.text.toLowerCase().replace(/[^\w\s]/g, '')
  const textItemText = textItems.map(item => item.text.toLowerCase().replace(/[^\w\s]/g, '')).join(' ')
  
  if (!sentenceText.includes(textItemText.substring(0, Math.min(20, textItemText.length)))) {
    issues.push('Text content doesn\'t match between sentence and text items')
    confidence -= 0.5
  }
  
  return {
    isValid: confidence > 0.5,
    confidence,
    issues
  }
}
