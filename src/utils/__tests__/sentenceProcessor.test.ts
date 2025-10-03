/**
 * Tests for Advanced Sentence Processing Utilities
 */

import { 
  splitIntoSentencesAdvanced, 
  findBestTextItemMatch, 
  groupTextItemsIntoSentencesAdvanced,
  validateSentenceAlignment,
  ProcessedSentence 
} from '../sentenceProcessor'

describe('Advanced Sentence Processing', () => {
  describe('splitIntoSentencesAdvanced', () => {
    it('should split text into sentences while preserving punctuation', () => {
      const text = 'Hello world. This is a test! Another sentence?'
      const result = splitIntoSentencesAdvanced(text)
      
      expect(result).toHaveLength(3)
      expect(result[0].text).toBe('Hello world.')
      expect(result[1].text).toBe('This is a test!')
      expect(result[2].text).toBe('Another sentence?')
    })

    it('should handle text without ending punctuation', () => {
      const text = 'Hello world This is a test'
      const result = splitIntoSentencesAdvanced(text)
      
      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('Hello world This is a test')
      expect(result[0].hasEndingPunctuation).toBe(false)
    })

    it('should handle empty text', () => {
      const result = splitIntoSentencesAdvanced('')
      expect(result).toEqual([])
    })

    it('should handle text with only whitespace', () => {
      const result = splitIntoSentencesAdvanced('   \n\n   ')
      expect(result).toEqual([])
    })

    it('should normalize whitespace', () => {
      const text = 'Hello    world.\n\nThis   is   a   test.'
      const result = splitIntoSentencesAdvanced(text)
      
      expect(result).toHaveLength(2)
      expect(result[0].text).toBe('Hello world.')
      expect(result[1].text).toBe('This is a test.')
    })

    it('should handle complex punctuation', () => {
      const text = 'Dr. Smith said "Hello!" and then... What happened?'
      const result = splitIntoSentencesAdvanced(text)
      
      expect(result).toHaveLength(4)
      expect(result[0].text).toBe('Dr.')
      expect(result[1].text).toBe('Smith said "Hello!"')
      expect(result[2].text).toBe('and then...')
      expect(result[3].text).toBe('What happened?')
    })

    it('should calculate word counts correctly', () => {
      const text = 'Hello world. This is a test.'
      const result = splitIntoSentencesAdvanced(text)
      
      expect(result[0].wordCount).toBe(2)
      expect(result[1].wordCount).toBe(4)
    })

    it('should detect ending punctuation correctly', () => {
      const text = 'Hello world. This is a test! Another sentence?'
      const result = splitIntoSentencesAdvanced(text)
      
      expect(result[0].hasEndingPunctuation).toBe(true)
      expect(result[1].hasEndingPunctuation).toBe(true)
      expect(result[2].hasEndingPunctuation).toBe(true)
    })
  })

  describe('findBestTextItemMatch', () => {
    const textItems = [
      { text: 'Hello', pageNumber: 1 },
      { text: 'world', pageNumber: 1 },
      { text: 'This', pageNumber: 1 },
      { text: 'is', pageNumber: 1 },
      { text: 'a', pageNumber: 1 },
      { text: 'test', pageNumber: 1 }
    ]

    it('should find exact word matches', () => {
      const sentence: ProcessedSentence = {
        text: 'Hello world',
        originalText: 'Hello world',
        wordCount: 2,
        hasEndingPunctuation: false
      }

      const result = findBestTextItemMatch(sentence, textItems, 0)
      
      expect(result.matchedItems).toHaveLength(2)
      expect(result.matchedItems[0].text).toBe('Hello')
      expect(result.matchedItems[1].text).toBe('world')
      expect(result.endIndex).toBe(2)
    })

    it('should handle partial matches', () => {
      const sentence: ProcessedSentence = {
        text: 'Hello there',
        originalText: 'Hello there',
        wordCount: 2,
        hasEndingPunctuation: false
      }

      const result = findBestTextItemMatch(sentence, textItems, 0)
      
      expect(result.matchedItems).toHaveLength(1)
      expect(result.matchedItems[0].text).toBe('Hello')
      expect(result.endIndex).toBe(1)
    })

    it('should handle no matches', () => {
      const sentence: ProcessedSentence = {
        text: 'Completely different',
        originalText: 'Completely different',
        wordCount: 2,
        hasEndingPunctuation: false
      }

      const result = findBestTextItemMatch(sentence, textItems, 0)
      
      expect(result.matchedItems).toHaveLength(0)
      expect(result.endIndex).toBe(6) // Should advance through all items
    })

    it('should start from specified index', () => {
      const sentence: ProcessedSentence = {
        text: 'This is',
        originalText: 'This is',
        wordCount: 2,
        hasEndingPunctuation: false
      }

      const result = findBestTextItemMatch(sentence, textItems, 2)
      
      expect(result.matchedItems).toHaveLength(2)
      expect(result.matchedItems[0].text).toBe('This')
      expect(result.matchedItems[1].text).toBe('is')
      expect(result.endIndex).toBe(4)
    })
  })

  describe('groupTextItemsIntoSentencesAdvanced', () => {
    const textItems = [
      { text: 'Hello', pageNumber: 1, leftPercent: 0, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'world', pageNumber: 1, leftPercent: 10, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'This', pageNumber: 1, leftPercent: 20, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'is', pageNumber: 1, leftPercent: 30, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'a', pageNumber: 1, leftPercent: 40, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'test', pageNumber: 1, leftPercent: 50, topPercent: 0, widthPercent: 10, heightPercent: 5 }
    ]

    it('should group text items using word matching', () => {
      const sentences: ProcessedSentence[] = [
        { text: 'Hello world', originalText: 'Hello world', wordCount: 2, hasEndingPunctuation: false },
        { text: 'This is a test', originalText: 'This is a test', wordCount: 4, hasEndingPunctuation: false }
      ]

      const result = groupTextItemsIntoSentencesAdvanced(textItems, sentences)
      
      expect(result).toHaveLength(2)
      expect(result[0].text).toBe('Hello world')
      expect(result[0].textItems).toHaveLength(2)
      expect(result[1].text).toBe('This is a test')
      expect(result[1].textItems).toHaveLength(4)
    })

    it('should handle empty inputs', () => {
      const result = groupTextItemsIntoSentencesAdvanced([], [])
      expect(result).toEqual([])
    })

    it('should fallback to sequential grouping when word matching fails', () => {
      const sentences: ProcessedSentence[] = [
        { text: 'Completely different text', originalText: 'Completely different text', wordCount: 3, hasEndingPunctuation: false }
      ]

      const result = groupTextItemsIntoSentencesAdvanced(textItems, sentences)
      
      expect(result).toHaveLength(1)
      expect(result[0].textItems.length).toBeGreaterThan(0)
    })
  })

  describe('validateSentenceAlignment', () => {
    it('should validate good alignment', () => {
      const sentence: ProcessedSentence = {
        text: 'Hello world',
        originalText: 'Hello world',
        wordCount: 2,
        hasEndingPunctuation: false
      }

      const textItems = [
        { text: 'Hello' },
        { text: 'world' }
      ]

      const result = validateSentenceAlignment(sentence, textItems)
      
      expect(result.isValid).toBe(true)
      expect(result.confidence).toBeGreaterThan(0.5)
      expect(result.issues).toHaveLength(0)
    })

    it('should detect word count mismatches', () => {
      const sentence: ProcessedSentence = {
        text: 'Hello world',
        originalText: 'Hello world',
        wordCount: 2,
        hasEndingPunctuation: false
      }

      const textItems = [
        { text: 'Hello' },
        { text: 'world' },
        { text: 'extra' },
        { text: 'words' }
      ]

      const result = validateSentenceAlignment(sentence, textItems)
      
      expect(result.isValid).toBe(false)
      expect(result.confidence).toBeLessThanOrEqual(0.5)
      expect(result.issues).toContain('Word count mismatch: sentence has 2 words, text items have 4')
    })

    it('should detect text content mismatches', () => {
      const sentence: ProcessedSentence = {
        text: 'Hello world',
        originalText: 'Hello world',
        wordCount: 2,
        hasEndingPunctuation: false
      }

      const textItems = [
        { text: 'Completely' },
        { text: 'different' }
      ]

      const result = validateSentenceAlignment(sentence, textItems)
      
      expect(result.isValid).toBe(false)
      expect(result.confidence).toBeLessThanOrEqual(0.5)
      expect(result.issues).toContain('Text content doesn\'t match between sentence and text items')
    })
  })
})
