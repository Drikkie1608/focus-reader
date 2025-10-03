/**
 * TTS and Highlighting Synchronization Utilities
 * Ensures accurate synchronization between speech and visual highlighting
 */

export interface SynchronizationState {
  currentSentenceIndex: number
  isPlaying: boolean
  isPaused: boolean
  lastUpdateTime: number
}

export interface SynchronizationConfig {
  highlightDelayMs: number
  sentenceTransitionDelayMs: number
  maxRetries: number
}

/**
 * Default synchronization configuration
 */
export const DEFAULT_SYNC_CONFIG: SynchronizationConfig = {
  highlightDelayMs: 100,
  sentenceTransitionDelayMs: 300,
  maxRetries: 3
}

/**
 * Manages synchronization between TTS and highlighting
 */
export class TTSSynchronizer {
  private config: SynchronizationConfig
  private state: SynchronizationState
  private listeners: Set<(state: SynchronizationState) => void> = new Set()
  private timeoutRef: NodeJS.Timeout | null = null

  constructor(config: Partial<SynchronizationConfig> = {}) {
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config }
    this.state = {
      currentSentenceIndex: -1,
      isPlaying: false,
      isPaused: false,
      lastUpdateTime: Date.now()
    }
  }

  /**
   * Subscribe to synchronization state changes
   */
  subscribe(listener: (state: SynchronizationState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Update synchronization state
   */
  updateState(updates: Partial<SynchronizationState>): void {
    this.state = {
      ...this.state,
      ...updates,
      lastUpdateTime: Date.now()
    }
    this.notifyListeners()
  }

  /**
   * Start speaking a sentence with proper synchronization
   */
  startSentence(sentenceIndex: number): void {
    this.clearTimeout()
    
    // Update state immediately
    this.updateState({
      currentSentenceIndex: sentenceIndex,
      isPlaying: true,
      isPaused: false
    })

    // Schedule highlight update with delay for better sync
    this.timeoutRef = setTimeout(() => {
      this.updateState({
        currentSentenceIndex: sentenceIndex
      })
    }, this.config.highlightDelayMs)
  }

  /**
   * Move to next sentence with proper timing
   */
  moveToNextSentence(nextIndex: number): void {
    this.clearTimeout()
    
    // Clear current highlight first
    this.updateState({
      currentSentenceIndex: -1
    })

    // Move to next sentence after transition delay
    this.timeoutRef = setTimeout(() => {
      this.updateState({
        currentSentenceIndex: nextIndex
      })
    }, this.config.sentenceTransitionDelayMs)
  }

  /**
   * Pause synchronization
   */
  pause(): void {
    this.clearTimeout()
    this.updateState({
      isPaused: true
    })
  }

  /**
   * Resume synchronization
   */
  resume(): void {
    this.updateState({
      isPaused: false
    })
  }

  /**
   * Stop synchronization and reset state
   */
  stop(): void {
    this.clearTimeout()
    this.updateState({
      currentSentenceIndex: -1,
      isPlaying: false,
      isPaused: false
    })
  }

  /**
   * Get current synchronization state
   */
  getState(): SynchronizationState {
    return { ...this.state }
  }

  /**
   * Clear any pending timeouts
   */
  private clearTimeout(): void {
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef)
      this.timeoutRef = null
    }
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state)
      } catch (error) {
        console.error('Error in synchronization listener:', error)
      }
    })
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearTimeout()
    this.listeners.clear()
  }
}

/**
 * Hook for using TTS synchronization in React components
 */
export function useTTSSynchronization(config?: Partial<SynchronizationConfig>) {
  const synchronizer = new TTSSynchronizer(config)
  
  return {
    synchronizer,
    subscribe: synchronizer.subscribe.bind(synchronizer),
    updateState: synchronizer.updateState.bind(synchronizer),
    startSentence: synchronizer.startSentence.bind(synchronizer),
    moveToNextSentence: synchronizer.moveToNextSentence.bind(synchronizer),
    pause: synchronizer.pause.bind(synchronizer),
    resume: synchronizer.resume.bind(synchronizer),
    stop: synchronizer.stop.bind(synchronizer),
    getState: synchronizer.getState.bind(synchronizer),
    destroy: synchronizer.destroy.bind(synchronizer)
  }
}

/**
 * Validate synchronization state for debugging
 */
export function validateSynchronization(
  ttsState: { currentSentenceIndex: number; isPlaying: boolean },
  highlightState: { currentSentenceIndex: number },
  sentences: Array<{ text: string }>
): { isValid: boolean; issues: string[] } {
  const issues: string[] = []

  // Check if indices are within bounds
  if (ttsState.currentSentenceIndex >= sentences.length) {
    issues.push(`TTS sentence index ${ttsState.currentSentenceIndex} is out of bounds (max: ${sentences.length - 1})`)
  }

  if (highlightState.currentSentenceIndex >= sentences.length) {
    issues.push(`Highlight sentence index ${highlightState.currentSentenceIndex} is out of bounds (max: ${sentences.length - 1})`)
  }

  // Check for synchronization mismatch
  if (ttsState.isPlaying && ttsState.currentSentenceIndex !== highlightState.currentSentenceIndex) {
    issues.push(`Synchronization mismatch: TTS at ${ttsState.currentSentenceIndex}, Highlight at ${highlightState.currentSentenceIndex}`)
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}
