import { useState, useRef, useCallback, useEffect } from 'react'
import { Sentence } from '../utils/textProcessor'
import { TTSSynchronizer } from '../utils/ttsSynchronizer'

interface UseTTSReturn {
  speak: (startIndex?: number) => void
  pause: () => void
  resume: () => void
  stop: () => void
  skip: () => void
  isPlaying: boolean
  currentSentenceIndex: number
}

export const useTTS = (sentences: Sentence[], speed: number = 1.0): UseTTSReturn => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1)
  const [isPaused, setIsPaused] = useState(false)
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const sentencesRef = useRef<Sentence[]>([])
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const synchronizerRef = useRef<TTSSynchronizer | null>(null)

  // Use sentences directly from single source of truth
  sentencesRef.current = sentences

  // Initialize synchronizer
  useEffect(() => {
    if (!synchronizerRef.current) {
      synchronizerRef.current = new TTSSynchronizer({
        highlightDelayMs: 50,
        sentenceTransitionDelayMs: 200
      })
    }

    // Subscribe to synchronization updates
    const unsubscribe = synchronizerRef.current.subscribe((state) => {
      setCurrentSentenceIndex(state.currentSentenceIndex)
      setIsPlaying(state.isPlaying)
      setIsPaused(state.isPaused)
    })

    return () => {
      unsubscribe()
      synchronizerRef.current?.destroy()
      synchronizerRef.current = null
    }
  }, [])

  // Simple language detection based on common words
  const detectLanguage = useCallback((text: string): string => {
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall']
    const dutchWords = ['de', 'het', 'een', 'en', 'van', 'in', 'op', 'aan', 'voor', 'met', 'door', 'bij', 'is', 'zijn', 'was', 'waren', 'worden', 'hebben', 'heeft', 'had', 'doen', 'doet', 'deed', 'zal', 'zou', 'kon', 'moet', 'mag', 'kan', 'moet', 'zal']
    
    const words = text.toLowerCase().split(/\s+/)
    let englishCount = 0
    let dutchCount = 0
    
    words.forEach(word => {
      if (englishWords.includes(word)) englishCount++
      if (dutchWords.includes(word)) dutchCount++
    })
    
    return englishCount > dutchCount ? 'en-US' : 'nl-NL'
  }, [])

  const calculateWordTimings = useCallback((text: string, rate: number): number[] => {
    // More accurate word timing calculation
    const words = text.split(/\s+/).filter(word => word.length > 0)
    const timings: number[] = []
    let currentTime = 0
    
    // Average reading speed: ~200 words per minute = ~300ms per word
    // Adjust based on rate
    const baseWordDuration = 300 / rate
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      // Adjust timing based on word length and complexity
      let wordDuration = baseWordDuration
      
      // Longer words take more time
      if (word.length > 6) {
        wordDuration *= 1.2
      } else if (word.length < 3) {
        wordDuration *= 0.8
      }
      
      // Punctuation adds pause
      if (word.match(/[.!?]$/)) {
        wordDuration *= 1.5
      } else if (word.match(/[,;:]$/)) {
        wordDuration *= 1.2
      }
      
      timings.push(currentTime)
      currentTime += wordDuration
    }
    
    return timings
  }, [])

  const speak = useCallback((startIndex: number = 0) => {
    console.log('🎯 SPEAK FUNCTION CALLED with startIndex:', startIndex)
    console.log('📊 Sentences available:', sentences.length)
    
    if (!sentences.length) {
      console.log('❌ No sentences available, returning')
      return
    }

    // Check if voices are available, if not, load them
    if (speechSynthesis.getVoices().length === 0) {
      console.log('🔄 No voices available, loading voices...')
      
      // Load voices and retry
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices()
        console.log('📢 Voices loaded:', voices.length)
        
        if (voices.length > 0) {
          console.log('✅ Voices available, retrying speak...')
          speak(startIndex)
        } else {
          console.log('❌ Still no voices available after loading')
        }
      }
      
      // Try to load voices
      speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true })
      
      // Fallback: try again after a short delay
      setTimeout(() => {
        const voices = speechSynthesis.getVoices()
        if (voices.length > 0) {
          console.log('✅ Voices loaded via timeout, retrying speak...')
          speak(startIndex)
        } else {
          console.log('❌ No voices available even after timeout')
        }
      }, 1000)
      
      return
    }

    // Stop any existing speech
    if (utteranceRef.current) {
      console.log('🛑 Stopping existing speech')
      speechSynthesis.cancel()
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    let currentSentenceIndex = 0

    const speakNextSentence = () => {
      console.log('🎤 SPEAK NEXT SENTENCE called, currentSentenceIndex:', currentSentenceIndex)
      
      if (currentSentenceIndex >= sentences.length) {
        console.log('🏁 End of sentences reached')
        synchronizerRef.current?.stop()
        return
      }

      const sentence = sentences[currentSentenceIndex]
      console.log('📝 Current sentence:', sentence?.text)
      
      if (!sentence || !sentence.text.trim()) {
        console.log('⏭️ Skipping empty sentence')
        currentSentenceIndex++
        speakNextSentence()
        return
      }

      console.log('🎵 Creating utterance for:', sentence.text)
      const utterance = new SpeechSynthesisUtterance(sentence.text)
      utterance.rate = speed
      utterance.pitch = 1
      utterance.volume = 1
      utterance.lang = detectLanguage(sentence.text) // Set language based on sentence content

      utterance.onstart = () => {
        console.log('🎤 SPEAKING SENTENCE STARTED:', currentSentenceIndex, sentence.text)
        synchronizerRef.current?.startSentence(currentSentenceIndex)
      }

      utterance.onend = () => {
        currentSentenceIndex++
        console.log(`🎯 MOVING TO NEXT SENTENCE: ${currentSentenceIndex}`)
        console.log(`Next sentence: "${sentences[currentSentenceIndex]?.text || 'END OF DOCUMENT'}"`)
        
        if (currentSentenceIndex < sentences.length) {
          // Move to next sentence with proper synchronization
          synchronizerRef.current?.moveToNextSentence(currentSentenceIndex)
          setTimeout(() => {
            speakNextSentence()
          }, 200) // Reduced delay since synchronizer handles timing
        } else {
          // End of document
          synchronizerRef.current?.stop()
        }
      }

      utterance.onerror = (event) => {
        // Only log non-cancellation errors
        if (event.error !== 'canceled') {
          console.error('Speech synthesis error:', event.error)
        }
        synchronizerRef.current?.stop()
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }

      utteranceRef.current = utterance
      console.log('🔊 Calling speechSynthesis.speak()')
      console.log('📊 Speech synthesis status:', {
        speaking: speechSynthesis.speaking,
        pending: speechSynthesis.pending,
        paused: speechSynthesis.paused,
        voices: speechSynthesis.getVoices().length
      })
      
      // Add a small delay to ensure speech synthesis is ready
      setTimeout(() => {
        speechSynthesis.speak(utterance)
        console.log('🔊 speechSynthesis.speak() called after delay')
        
        // Fallback: if onstart doesn't fire within 200ms, manually trigger it
        setTimeout(() => {
          if (!utteranceRef.current || utteranceRef.current !== utterance) return
          
          console.log('🔄 Fallback: Manually triggering onstart event')
          synchronizerRef.current?.startSentence(currentSentenceIndex)
          console.log(`🎤 SPEAKING SENTENCE ${currentSentenceIndex}: "${sentence.text}"`)
        }, 200)
      }, 50)
    }

    // Find the correct starting sentence
    if (startIndex < sentences.length) {
      currentSentenceIndex = startIndex
    }

    // Set playing state immediately and start synchronizer
    setIsPlaying(true)
    setIsPaused(false)
    synchronizerRef.current?.startSentence(currentSentenceIndex)
    
    console.log('🚀 Starting speakNextSentence with currentSentenceIndex:', currentSentenceIndex)
    speakNextSentence()
  }, [sentences, speed])

  const pause = useCallback(() => {
    if (isPlaying && !isPaused) {
      speechSynthesis.pause()
      synchronizerRef.current?.pause()
      setIsPlaying(false)
      setIsPaused(true)
    }
  }, [isPlaying, isPaused])

  const resume = useCallback(() => {
    if (isPlaying && isPaused) {
      speechSynthesis.resume()
      synchronizerRef.current?.resume()
      setIsPlaying(true)
      setIsPaused(false)
    } else if (!isPlaying) {
      // If not playing, start from current sentence
      speak(currentSentenceIndex >= 0 ? currentSentenceIndex : 0)
    }
  }, [isPlaying, isPaused, speak, currentSentenceIndex])

  const stop = useCallback(() => {
    // Stop speech synthesis
    speechSynthesis.cancel()
    
    // Stop synchronizer
    synchronizerRef.current?.stop()
    
    // Reset state
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentSentenceIndex(-1)
    utteranceRef.current = null
  }, [])

  const skip = useCallback(() => {
    if (!isPlaying || currentSentenceIndex < 0) {
      return
    }

    console.log('⏭️ SKIPPING current sentence:', currentSentenceIndex)
    
    // Stop current speech
    speechSynthesis.cancel()
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Move to next sentence
    const nextIndex = currentSentenceIndex + 1
    
    if (nextIndex < sentences.length) {
      console.log('🎯 Moving to next sentence:', nextIndex)
      // Update synchronizer to next sentence
      synchronizerRef.current?.startSentence(nextIndex)
      
      // Continue speaking from next sentence
      setTimeout(() => {
        speak(nextIndex)
      }, 100)
    } else {
      console.log('🏁 End of document reached')
      stop()
    }
  }, [isPlaying, currentSentenceIndex, sentences.length, speak, stop])

  return {
    speak,
    pause,
    resume,
    stop,
    skip,
    isPlaying,
    currentSentenceIndex
  }
}
