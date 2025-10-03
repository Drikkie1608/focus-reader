/**
 * Tests for Text Item Utilities
 */

import { groupTextItemsIntoSentences, splitIntoSentences, createTextItem, TextItem } from '../textItemUtils'

describe('Text Item Utilities', () => {
  describe('splitIntoSentences', () => {
    it('should split text into sentences while preserving punctuation', () => {
      const text = 'Hello world. This is a test! Another sentence?'
      const result = splitIntoSentences(text)
      expect(result).toEqual(['Hello world.', 'This is a test!', 'Another sentence?'])
    })

    it('should handle empty text', () => {
      const result = splitIntoSentences('')
      expect(result).toEqual([])
    })

    it('should normalize whitespace', () => {
      const text = 'Hello    world.\n\nThis   is   a   test.'
      const result = splitIntoSentences(text)
      expect(result).toEqual(['Hello world.', 'This is a test.'])
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

  describe('groupTextItemsIntoSentences', () => {
    it('should group text items into sentences', () => {
      const textItems: TextItem[] = [
        { text: 'Hello', pageNumber: 1, leftPercent: 0, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'world', pageNumber: 1, leftPercent: 10, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'This', pageNumber: 1, leftPercent: 20, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'is', pageNumber: 1, leftPercent: 30, topPercent: 0, widthPercent: 10, heightPercent: 5 },
        { text: 'test', pageNumber: 1, leftPercent: 40, topPercent: 0, widthPercent: 10, heightPercent: 5 }
      ]
      
      const sentences = ['Hello world', 'This is test']
      
      const result = groupTextItemsIntoSentences(textItems, sentences)
      
      expect(result).toHaveLength(2)
      expect(result[0].text).toBe('Hello world')
      expect(result[0].textItems).toHaveLength(2)
      expect(result[1].text).toBe('This is test')
      expect(result[1].textItems).toHaveLength(3)
    })

    it('should handle empty inputs', () => {
      const result = groupTextItemsIntoSentences([], [])
      expect(result).toEqual([])
    })
  })
})
