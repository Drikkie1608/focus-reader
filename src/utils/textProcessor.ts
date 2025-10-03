/**
 * Single Source of Truth Text Processing
 * Groups PDF text items into sentences chronologically
 */

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
 * Groups text items chronologically into sentences based on punctuation
 * This is the single source of truth for sentence boundaries
 */
export function groupTextItemsIntoSentences(textItems: TextItem[]): Sentence[] {
  if (textItems.length === 0) {
    return []
  }

  const sentences: Sentence[] = []
  let currentSentenceItems: TextItem[] = []
  let currentSentenceText = ''

  for (const item of textItems) {
    const itemText = item.text.trim()
    if (!itemText) continue

    // Add to current sentence
    currentSentenceItems.push(item)
    currentSentenceText += (currentSentenceText ? ' ' : '') + itemText

    // Check if we have a complete sentence
    const sentenceEnding = findCompleteSentenceEnding(currentSentenceText)
    
    if (sentenceEnding) {
      const sentenceText = currentSentenceText.substring(0, sentenceEnding.end).trim()
      
      if (sentenceText.length > 0) {
        // Find which text items belong to this sentence
        const sentenceItems = findTextItemsForSentence(sentenceText, currentSentenceItems)
        
        sentences.push({
          text: sentenceText,
          textItems: sentenceItems,
          pageNumber: sentenceItems[0].pageNumber
        })
        
        // Remove used text items and continue with remaining text
        const remainingText = currentSentenceText.substring(sentenceEnding.end).trim()
        const remainingItems = currentSentenceItems.slice(sentenceItems.length)
        
        currentSentenceItems = remainingItems
        currentSentenceText = remainingText
      }
    }
  }

  // Handle any remaining text without sentence ending
  if (currentSentenceItems.length > 0 && currentSentenceText.trim()) {
    sentences.push({
      text: currentSentenceText.trim(),
      textItems: [...currentSentenceItems],
      pageNumber: currentSentenceItems[0].pageNumber
    })
  }

  return sentences
}

/**
 * Finds complete sentence endings - looks for periods followed by space and capital letter
 */
function findCompleteSentenceEnding(text: string): { end: number; type: string } | null {
  // Look for the pattern: period + space + capital letter
  const match = text.match(/\.\s+[A-Z]/)
  
  if (match && match.index !== undefined) {
    const periodIndex = match.index
    // Check if it's not an abbreviation
    if (!isAbbreviation(text, periodIndex)) {
      return { end: periodIndex + 1, type: '.' } // End after the period
    }
  }
  
  // Also check for sentence endings at the very end
  const endMatch = text.match(/[.!?]$/)
  if (endMatch && endMatch.index !== undefined) {
    const punctIndex = endMatch.index
    if (!isAbbreviation(text, punctIndex)) {
      return { end: punctIndex + 1, type: endMatch[0] }
    }
  }
  
  return null
}

/**
 * Checks if a period is likely an abbreviation rather than sentence ending
 */
function isAbbreviation(text: string, periodIndex: number): boolean {
  const beforePeriod = text.substring(Math.max(0, periodIndex - 10), periodIndex)
  const afterPeriod = text.substring(periodIndex + 1, periodIndex + 3)
  
  // Common abbreviations
  const abbreviations = [
    'Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.', 'Inc.', 'Ltd.', 'Corp.', 'Co.',
    'U.S.', 'U.K.', 'etc.', 'vs.', 'i.e.', 'e.g.', 'a.m.', 'p.m.',
    'Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.',
    'Sep.', 'Oct.', 'Nov.', 'Dec.'
  ]
  
  // Check if the text before the period matches common abbreviations
  for (const abbr of abbreviations) {
    if (beforePeriod.endsWith(abbr.slice(0, -1))) {
      return true
    }
  }
  
  // Check if it's followed by a lowercase letter (likely abbreviation)
  if (afterPeriod.match(/^[a-z]/)) {
    return true
  }
  
  // Check if it's a single letter followed by period (initials)
  if (beforePeriod.match(/[A-Z]\.$/)) {
    return true
  }
  
  return false
}

/**
 * Finds which text items belong to a sentence based on text length
 */
function findTextItemsForSentence(sentenceText: string, textItems: TextItem[]): TextItem[] {
  let currentLength = 0
  const targetLength = sentenceText.length
  
  for (let i = 0; i < textItems.length; i++) {
    const item = textItems[i]
    const itemText = item.text.trim()
    
    // Add space if not first item
    if (i > 0) currentLength += 1
    
    currentLength += itemText.length
    
    // If we've reached or exceeded the target length, include this item
    if (currentLength >= targetLength) {
      return textItems.slice(0, i + 1)
    }
  }
  
  // Fallback: return all items if we can't match exactly
  return textItems
}

/**
 * Creates a text item with percentage-based coordinates
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

/**
 * Validates that sentences are properly formed
 */
export function validateSentences(sentences: Sentence[]): { isValid: boolean; issues: string[] } {
  const issues: string[] = []

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]
    
    if (!sentence.text || sentence.text.trim().length === 0) {
      issues.push(`Sentence ${i} has empty text`)
    }
    
    if (!sentence.textItems || sentence.textItems.length === 0) {
      issues.push(`Sentence ${i} has no text items`)
    }
    
    if (sentence.textItems && sentence.textItems.length > 0) {
      const combinedText = sentence.textItems.map(item => item.text).join(' ').trim()
      if (combinedText !== sentence.text) {
        issues.push(`Sentence ${i} text mismatch: "${sentence.text}" vs "${combinedText}"`)
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}
