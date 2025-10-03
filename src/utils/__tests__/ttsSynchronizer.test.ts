/**
 * Tests for TTS Synchronization Utilities
 */

import { TTSSynchronizer, validateSynchronization, DEFAULT_SYNC_CONFIG } from '../ttsSynchronizer'

describe('TTS Synchronization', () => {
  describe('TTSSynchronizer', () => {
    let synchronizer: TTSSynchronizer

    beforeEach(() => {
      synchronizer = new TTSSynchronizer()
    })

    afterEach(() => {
      synchronizer.destroy()
    })

    it('should initialize with default state', () => {
      const state = synchronizer.getState()
      
      expect(state.currentSentenceIndex).toBe(-1)
      expect(state.isPlaying).toBe(false)
      expect(state.isPaused).toBe(false)
      expect(state.lastUpdateTime).toBeGreaterThan(0)
    })

    it('should update state correctly', () => {
      synchronizer.updateState({
        currentSentenceIndex: 5,
        isPlaying: true
      })

      const state = synchronizer.getState()
      expect(state.currentSentenceIndex).toBe(5)
      expect(state.isPlaying).toBe(true)
      expect(state.isPaused).toBe(false)
    })

    it('should notify listeners on state changes', () => {
      const listener = jest.fn()
      const unsubscribe = synchronizer.subscribe(listener)

      synchronizer.updateState({ currentSentenceIndex: 3 })

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          currentSentenceIndex: 3
        })
      )

      unsubscribe()
    })

    it('should start sentence with proper timing', (done) => {
      const listener = jest.fn()
      synchronizer.subscribe(listener)

      synchronizer.startSentence(2)

      // Should update immediately
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          currentSentenceIndex: 2,
          isPlaying: true,
          isPaused: false
        })
      )

      // Should update again after delay
      setTimeout(() => {
        expect(listener).toHaveBeenCalledTimes(2)
        done()
      }, DEFAULT_SYNC_CONFIG.highlightDelayMs + 50)
    })

    it('should move to next sentence with transition delay', (done) => {
      const listener = jest.fn()
      synchronizer.subscribe(listener)

      // Start with a sentence
      synchronizer.startSentence(1)

      // Move to next sentence
      synchronizer.moveToNextSentence(2)

      // Should clear current highlight first
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          currentSentenceIndex: -1
        })
      )

      // Should move to next sentence after delay
      setTimeout(() => {
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            currentSentenceIndex: 2
          })
        )
        done()
      }, DEFAULT_SYNC_CONFIG.sentenceTransitionDelayMs + 50)
    })

    it('should pause and resume correctly', () => {
      synchronizer.startSentence(1)
      
      synchronizer.pause()
      let state = synchronizer.getState()
      expect(state.isPaused).toBe(true)

      synchronizer.resume()
      state = synchronizer.getState()
      expect(state.isPaused).toBe(false)
    })

    it('should stop and reset state', () => {
      synchronizer.startSentence(3)
      
      synchronizer.stop()
      
      const state = synchronizer.getState()
      expect(state.currentSentenceIndex).toBe(-1)
      expect(state.isPlaying).toBe(false)
      expect(state.isPaused).toBe(false)
    })

    it('should clear timeouts when destroyed', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
      
      synchronizer.startSentence(1)
      synchronizer.destroy()
      
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('should handle custom configuration', () => {
      const customConfig = {
        highlightDelayMs: 200,
        sentenceTransitionDelayMs: 500
      }
      
      const customSynchronizer = new TTSSynchronizer(customConfig)
      
      // Test that custom config is used
      const listener = jest.fn()
      customSynchronizer.subscribe(listener)
      
      customSynchronizer.startSentence(1)
      
      // Should still update immediately
      expect(listener).toHaveBeenCalled()
      
      customSynchronizer.destroy()
    })
  })

  describe('validateSynchronization', () => {
    const sentences = [
      { text: 'First sentence.' },
      { text: 'Second sentence.' },
      { text: 'Third sentence.' }
    ]

    it('should validate correct synchronization', () => {
      const ttsState = { currentSentenceIndex: 1, isPlaying: true }
      const highlightState = { currentSentenceIndex: 1 }

      const result = validateSynchronization(ttsState, highlightState, sentences)

      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    it('should detect out of bounds TTS index', () => {
      const ttsState = { currentSentenceIndex: 5, isPlaying: true }
      const highlightState = { currentSentenceIndex: 1 }

      const result = validateSynchronization(ttsState, highlightState, sentences)

      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('TTS sentence index 5 is out of bounds (max: 2)')
    })

    it('should detect out of bounds highlight index', () => {
      const ttsState = { currentSentenceIndex: 1, isPlaying: true }
      const highlightState = { currentSentenceIndex: 5 }

      const result = validateSynchronization(ttsState, highlightState, sentences)

      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('Highlight sentence index 5 is out of bounds (max: 2)')
    })

    it('should detect synchronization mismatch', () => {
      const ttsState = { currentSentenceIndex: 1, isPlaying: true }
      const highlightState = { currentSentenceIndex: 2 }

      const result = validateSynchronization(ttsState, highlightState, sentences)

      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('Synchronization mismatch: TTS at 1, Highlight at 2')
    })

    it('should not detect mismatch when not playing', () => {
      const ttsState = { currentSentenceIndex: 1, isPlaying: false }
      const highlightState = { currentSentenceIndex: 2 }

      const result = validateSynchronization(ttsState, highlightState, sentences)

      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    it('should handle multiple issues', () => {
      const ttsState = { currentSentenceIndex: 5, isPlaying: true }
      const highlightState = { currentSentenceIndex: 6 }

      const result = validateSynchronization(ttsState, highlightState, sentences)

      expect(result.isValid).toBe(false)
      expect(result.issues).toHaveLength(3)
      expect(result.issues).toContain('TTS sentence index 5 is out of bounds (max: 2)')
      expect(result.issues).toContain('Highlight sentence index 6 is out of bounds (max: 2)')
      expect(result.issues).toContain('Synchronization mismatch: TTS at 5, Highlight at 6')
    })
  })
})
