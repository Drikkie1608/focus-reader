/**
 * Text Item to Sentence Mapping Utilities
 * Handles finding which sentence contains a clicked text item
 */

import { TextItemWithHover } from './hoverHighlighting'
import { Sentence } from './textProcessor'

/**
 * Finds which sentence contains the clicked text item
 */
export function findSentenceContainingTextItem(
  clickedTextItem: TextItemWithHover,
  sentences: Sentence[]
): { sentence: Sentence; sentenceIndex: number } | null {
  
  for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex++) {
    const sentence = sentences[sentenceIndex]
    
    // Check if the clicked text item is in this sentence's text items
    const textItemInSentence = sentence.textItems.find(item => 
      item.text === clickedTextItem.text &&
      item.pageNumber === clickedTextItem.pageNumber &&
      Math.abs(item.leftPercent - clickedTextItem.leftPercent) < 0.1 &&
      Math.abs(item.topPercent - clickedTextItem.topPercent) < 0.1
    )
    
    if (textItemInSentence) {
      return { sentence, sentenceIndex }
    }
  }
  
  return null
}

/**
 * Finds the position of a text item within a sentence
 */
export function findTextItemPositionInSentence(
  clickedTextItem: TextItemWithHover,
  sentence: Sentence
): { position: number; totalItems: number } | null {
  
  const itemIndex = sentence.textItems.findIndex(item => 
    item.text === clickedTextItem.text &&
    item.pageNumber === clickedTextItem.pageNumber &&
    Math.abs(item.leftPercent - clickedTextItem.leftPercent) < 0.1 &&
    Math.abs(item.topPercent - clickedTextItem.topPercent) < 0.1
  )
  
  if (itemIndex === -1) return null
  
  return {
    position: itemIndex,
    totalItems: sentence.textItems.length
  }
}

/**
 * Creates a modified sentence that starts from the clicked text item
 */
export function createSentenceFromTextItem(
  clickedTextItem: TextItemWithHover,
  originalSentence: Sentence
): Sentence | null {
  
  const itemPosition = findTextItemPositionInSentence(clickedTextItem, originalSentence)
  if (!itemPosition) return null
  
  // Create a new sentence starting from the clicked text item
  const remainingTextItems = originalSentence.textItems.slice(itemPosition.position)
  
  if (remainingTextItems.length === 0) return null
  
  // Reconstruct the text from the remaining text items
  const remainingText = remainingTextItems.map(item => item.text).join(' ').trim()
  
  return {
    text: remainingText,
    textItems: remainingTextItems,
    pageNumber: remainingTextItems[0].pageNumber
  }
}
