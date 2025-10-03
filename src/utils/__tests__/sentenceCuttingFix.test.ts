/**
 * Test for the specific sentence cutting issue
 */

import { groupTextItemsIntoSentences, TextItem } from '../textProcessor'

describe('Sentence Cutting Issue Fix', () => {
  it('should not cut sentences in the middle with capital letters', () => {
    // Simulate the problematic text from the user's example
    const textItems: TextItem[] = [
      { text: 'Specifically,', pageNumber: 1, leftPercent: 0, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'this', pageNumber: 1, leftPercent: 10, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'study', pageNumber: 1, leftPercent: 20, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'first', pageNumber: 1, leftPercent: 30, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'applies', pageNumber: 1, leftPercent: 40, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'a', pageNumber: 1, leftPercent: 50, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'prediction', pageNumber: 1, leftPercent: 60, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'method.', pageNumber: 1, leftPercent: 70, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'Then,', pageNumber: 1, leftPercent: 80, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'the', pageNumber: 1, leftPercent: 90, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'predicted', pageNumber: 1, leftPercent: 0, topPercent: 10, widthPercent: 10, heightPercent: 5 },
      { text: 'results', pageNumber: 1, leftPercent: 10, topPercent: 10, widthPercent: 10, heightPercent: 5 },
      { text: 'are', pageNumber: 1, leftPercent: 20, topPercent: 10, widthPercent: 10, heightPercent: 5 },
      { text: 'integrated.', pageNumber: 1, leftPercent: 30, topPercent: 10, widthPercent: 10, heightPercent: 5 }
    ]

    const result = groupTextItemsIntoSentences(textItems)

    // Should create two complete sentences, not cut in the middle
    expect(result).toHaveLength(2)
    expect(result[0].text).toBe('Specifically, this study first applies a prediction method.')
    expect(result[1].text).toBe('Then, the predicted results are integrated.')
    
    // Neither sentence should end with just a capital letter
    expect(result[0].text).not.toMatch(/[A-Z]$/)
    expect(result[1].text).not.toMatch(/[A-Z]$/)
    
    // Both should end with proper punctuation
    expect(result[0].text).toMatch(/[.!?]$/)
    expect(result[1].text).toMatch(/[.!?]$/)
  })

  it('should handle academic paper structure correctly', () => {
    const textItems: TextItem[] = [
      { text: 'Abstract:', pageNumber: 1, leftPercent: 0, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'With', pageNumber: 1, leftPercent: 10, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'the', pageNumber: 1, leftPercent: 20, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'advances', pageNumber: 1, leftPercent: 30, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'in', pageNumber: 1, leftPercent: 40, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'machine', pageNumber: 1, leftPercent: 50, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'learning.', pageNumber: 1, leftPercent: 60, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'In', pageNumber: 1, leftPercent: 70, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'this', pageNumber: 1, leftPercent: 80, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'paper,', pageNumber: 1, leftPercent: 90, topPercent: 0, widthPercent: 10, heightPercent: 5 },
      { text: 'we', pageNumber: 1, leftPercent: 0, topPercent: 10, widthPercent: 10, heightPercent: 5 },
      { text: 'propose', pageNumber: 1, leftPercent: 10, topPercent: 10, widthPercent: 10, heightPercent: 5 },
      { text: 'a', pageNumber: 1, leftPercent: 20, topPercent: 10, widthPercent: 10, heightPercent: 5 },
      { text: 'novel', pageNumber: 1, leftPercent: 30, topPercent: 10, widthPercent: 10, heightPercent: 5 },
      { text: 'approach.', pageNumber: 1, leftPercent: 40, topPercent: 10, widthPercent: 10, heightPercent: 5 }
    ]

    const result = groupTextItemsIntoSentences(textItems)

    expect(result).toHaveLength(2)
    expect(result[0].text).toBe('Abstract: With the advances in machine learning.')
    expect(result[1].text).toBe('In this paper, we propose a novel approach.')
    
    // Verify no sentences end with capital letters
    result.forEach(sentence => {
      expect(sentence.text).not.toMatch(/[A-Z]$/)
      expect(sentence.text).toMatch(/[.!?]$/)
    })
  })
})
