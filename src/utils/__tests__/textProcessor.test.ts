/**
 * Tests for Single Source of Truth Text Processing
 */

import { 
  groupTextItemsIntoSentences, 
  createTextItem, 
  validateSentences,
  TextItem,
  Sentence 
} from '../textProcessor'

describe('Single Source of Truth Text Processing', () => {
  describe('groupTextItemsIntoSentences', () => {
    it('should group text items chronologically into sentences', () => {
      const textItems: TextItem[] = [
        { text: 'Hello', pageNumber: 1, leftPercent: 0, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'world.', pageNumber: 1, leftPercent: 10, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'This', pageNumber: 1, leftPercent: 20, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'is', pageNumber: 1, leftPercent: 30, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'a', pageNumber: 1, leftPercent: 40, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'test.', pageNumber: 1, leftPercent: 50, topPercent: 0, widthPercent: 10, heightPercent: 5 }
      ]

      const result = groupTextItemsIntoSentences(textItems)

      expect(result).toHaveLength(2)
      expect(result[0].text).toBe('Hello world.')
      expect(result[0].textItems).toHaveLength(2)
      expect(result[1].text).toBe('This is a test.')
      expect(result[1].textItems).toHaveLength(4)
    })

    it('should handle complex academic text with multiple sentences', () => {
      const textItems: TextItem[] = [
        { text: 'Abstract:', pageNumber: 1, leftPercent: 0, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'With', pageNumber: 1, leftPercent: 10, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'the', pageNumber: 1, leftPercent: 20, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'advances', pageNumber: 1, leftPercent: 30, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'in', pageNumber: 1, leftPercent: 40, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'time-series', pageNumber: 1, leftPercent: 50, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'prediction.', pageNumber: 1, leftPercent: 60, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'Several', pageNumber: 1, leftPercent: 70, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'recent', pageNumber: 1, leftPercent: 80, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'developments', pageNumber: 1, leftPercent: 90, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'have', pageNumber: 1, leftPercent: 0, topPercent: 10, widthPercent: 10, heightPercent: 5 },
        { text: 'shown', pageNumber: 1, leftPercent: 10, topPercent: 10, widthPercent: 10, heightPercent: 5 },
        { text: 'promising', pageNumber: 1, leftPercent: 20, topPercent: 10, widthPercent: 10, heightPercent: 5 },
        { text: 'results.', pageNumber: 1, leftPercent: 30, topPercent: 10, widthPercent: 10, heightPercent: 5 }
      ]

      const result = groupTextItemsIntoSentences(textItems)

      expect(result).toHaveLength(2)
      expect(result[0].text).toBe('Abstract: With the advances in time-series prediction.')
      expect(result[1].text).toBe('Several recent developments have shown promising results.')
    })

    it('should handle abbreviations correctly', () => {
      const textItems: TextItem[] = [
        { text: 'Dr.', pageNumber: 1, leftPercent: 0, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'Smith', pageNumber: 1, leftPercent: 10, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'said', pageNumber: 1, leftPercent: 20, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'hello.', pageNumber: 1, leftPercent: 30, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'The', pageNumber: 1, leftPercent: 40, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'U.S.', pageNumber: 1, leftPercent: 50, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'is', pageNumber: 1, leftPercent: 60, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'great.', pageNumber: 1, leftPercent: 70, topPercent: 0, widthPercent: 10, heightPercent: 5 }
      ]

      const result = groupTextItemsIntoSentences(textItems)

      expect(result).toHaveLength(2)
      expect(result[0].text).toBe('Dr. Smith said hello.')
      expect(result[1].text).toBe('The U.S. is great.')
    })

    it('should handle text without sentence endings', () => {
      const textItems: TextItem[] = [
        { text: 'Hello', pageNumber: 1, leftPercent: 0, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'world', pageNumber: 1, leftPercent: 10, topPercent: 0, widthPercent: 10, heightPercent: 5 }
      ]

      const result = groupTextItemsIntoSentences(textItems)

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('Hello world')
      expect(result[0].textItems).toHaveLength(2)
    })

    it('should handle empty input', () => {
      const result = groupTextItemsIntoSentences([])
      expect(result).toEqual([])
    })

    it('should handle single text item', () => {
      const textItems: TextItem[] = [
        { text: 'Hello.', pageNumber: 1, leftPercent: 0, topPercent: 0, widthPercent: 10, heightPercent: 5 }
      ]

      const result = groupTextItemsIntoSentences(textItems)

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('Hello.')
      expect(result[0].textItems).toHaveLength(1)
    })

    it('should preserve page numbers correctly', () => {
      const textItems: TextItem[] = [
        { text: 'Page', pageNumber: 1, leftPercent: 0, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'one.', pageNumber: 1, leftPercent: 10, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'Page', pageNumber: 2, leftPercent: 0, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'two.', pageNumber: 2, leftPercent: 10, topPercent: 0, widthPercent: 10, heightPercent: 5 }
      ]

      const result = groupTextItemsIntoSentences(textItems)

      expect(result).toHaveLength(2)
      expect(result[0].pageNumber).toBe(1)
      expect(result[1].pageNumber).toBe(2)
    })
  })

  describe('createTextItem', () => {
    it('should create text item with percentage coordinates', () => {
      const item = {
        str: 'Hello',
        transform: [1, 0, 0, 1, 100, 200],
        width: 50,
        height: 20
      }
      const viewport = { width: 600, height: 800 }
      
      const result = createTextItem(item, 1, viewport)
      
      expect(result).toEqual({
        text: 'Hello',
        pageNumber: 1,
        leftPercent: (100 / 600) * 100,
        topPercent: ((800 - 200 - 20) / 800) * 100,
        widthPercent: (50 / 600) * 100,
        heightPercent: (20 / 800) * 100
      })
    })
  })

  describe('validateSentences', () => {
    it('should validate correct sentences', () => {
      const sentences: Sentence[] = [
        {
          text: 'Hello world.',
          textItems: [
            { text: 'Hello', pageNumber: 1, leftPercent: 0, topPercent: 0, widthPercent: 10, heightPercent: 5 },
            { text: 'world.', pageNumber: 1, leftPercent: 10, topPercent: 0, widthPercent: 10, heightPercent: 5 }
          ],
          pageNumber: 1
        }
      ]

      const result = validateSentences(sentences)

      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    it('should detect empty text', () => {
      const sentences: Sentence[] = [
        {
          text: '',
          textItems: [
            { text: 'Hello', pageNumber: 1, leftPercent: 0, topPercent: 0, widthPercent: 10, heightPercent: 5 }
          ],
          pageNumber: 1
        }
      ]

      const result = validateSentences(sentences)

      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('Sentence 0 has empty text')
    })

    it('should detect missing text items', () => {
      const sentences: Sentence[] = [
        {
          text: 'Hello world.',
          textItems: [],
          pageNumber: 1
        }
      ]

      const result = validateSentences(sentences)

      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('Sentence 0 has no text items')
    })

    it('should detect text mismatch', () => {
      const sentences: Sentence[] = [
        {
          text: 'Hello world.',
          textItems: [
            { text: 'Different', pageNumber: 1, leftPercent: 0, topPercent: 0, widthPercent: 10, heightPercent: 5 },
            { text: 'text.', pageNumber: 1, leftPercent: 10, topPercent: 0, widthPercent: 10, heightPercent: 5 }
          ],
          pageNumber: 1
        }
      ]

      const result = validateSentences(sentences)

      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('Sentence 0 text mismatch: "Hello world." vs "Different text."')
    })
  })
})
