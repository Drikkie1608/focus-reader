import React, { useState, useRef, useCallback } from 'react'
import { useTTS } from './hooks/useTTS'
import { usePDF } from './hooks/usePDF'
import { Sentence } from './utils/textProcessor'
import { TextItemWithHover } from './utils/hoverHighlighting'
import { findSentenceContainingTextItem, createSentenceFromTextItem } from './utils/textItemToSentenceMapping'
import { ControlPanel } from './components/ControlPanel'
import { PDFViewer } from './components/PDFViewer'
import { TextTracker } from './components/TextTracker'
import { TextViewer } from './components/TextViewer'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [sentences, setSentences] = useState<Sentence[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1.0)
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1)
  const [hoveredTextItem, setHoveredTextItem] = useState<TextItemWithHover | null>(null)
  const [trackingEnabled, setTrackingEnabled] = useState(true)
  const [currentPageNumber, setCurrentPageNumber] = useState(1)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { extractTextWithPositions, isLoading: pdfLoading } = usePDF()
  const { 
    speak, 
    pause, 
    resume, 
    stop, 
    skip,
    isPlaying: ttsPlaying,
    currentSentenceIndex: ttsCurrentSentenceIndex 
  } = useTTS(sentences, speed)

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile)
    setSentences([])
    setCurrentSentenceIndex(-1)
    
    try {
      // Extract sentences with text items using single source of truth
      const { sentences: extractedSentences } = await extractTextWithPositions(selectedFile)
      
      console.log('=== SINGLE SOURCE OF TRUTH DEBUG ===')
      console.log('Extracted sentences count:', extractedSentences.length)
      console.log('First sentence:', extractedSentences[0])
      console.log('First sentence text items:', extractedSentences[0]?.textItems?.length)
      
      setSentences(extractedSentences)
    } catch (error) {
      console.error('Error extracting text:', error)
    }
  }, [extractTextWithPositions])

  const handleSentenceClick = useCallback((sentenceIndex: number) => {
    setCurrentSentenceIndex(sentenceIndex)
    // Start TTS from the clicked sentence
    speak(sentenceIndex)
  }, [speak])

  const handlePlayPause = useCallback(() => {
    if (ttsPlaying) {
      pause()
    } else {
      resume()
    }
  }, [ttsPlaying, pause, resume])

  const handleStop = useCallback(() => {
    stop()
    setCurrentSentenceIndex(-1)
  }, [stop])

  const handleSkip = useCallback(() => {
    skip()
  }, [skip])

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed)
  }, [])

  const handleTrackingToggle = useCallback((enabled: boolean) => {
    setTrackingEnabled(enabled)
    console.log('📍 Text tracking', enabled ? 'enabled' : 'disabled')
  }, [])

  const handlePageChange = useCallback((pageNumber: number) => {
    setCurrentPageNumber(pageNumber)
    console.log('📄 Page changed to:', pageNumber)
  }, [])

  const handleTextItemHover = useCallback((textItem: TextItemWithHover | null) => {
    setHoveredTextItem(textItem)
  }, [])

  const handleTextItemClick = useCallback((textItem: TextItemWithHover) => {
    console.log('🎯 CLICKED TEXT ITEM:', textItem.text)
    
    // Find which sentence contains this text item
    const sentenceResult = findSentenceContainingTextItem(textItem, sentences)
    
    if (sentenceResult) {
      const { sentence, sentenceIndex } = sentenceResult
      console.log('📝 FOUND SENTENCE:', sentence.text)
      console.log('📍 SENTENCE INDEX:', sentenceIndex)
      
      // Create a modified sentence starting from the clicked text item
      const modifiedSentence = createSentenceFromTextItem(textItem, sentence)
      
      if (modifiedSentence) {
        console.log('🎤 STARTING FROM MODIFIED SENTENCE:', modifiedSentence.text)
        
        // Create a temporary sentences array with the modified sentence
        const modifiedSentences = [...sentences]
        modifiedSentences[sentenceIndex] = modifiedSentence
        
        // Start speaking from this sentence
        speak(sentenceIndex)
      } else {
        console.log('⚠️ Could not create modified sentence')
        // Fallback: start from the original sentence
        speak(sentenceIndex)
      }
    } else {
      console.log('⚠️ Could not find sentence containing text item')
    }
  }, [sentences, speak])

  return (
    <div className="app">
      <div className="sidebar">
        <ControlPanel
          onFileSelect={handleFileSelect}
          onPause={handlePlayPause}
          onSkip={handleSkip}
          onSpeedChange={handleSpeedChange}
          onTrackingToggle={handleTrackingToggle}
          isPlaying={ttsPlaying}
          speed={speed}
          hasText={sentences.length > 0}
          isLoading={pdfLoading}
          trackingEnabled={trackingEnabled}
        />
      </div>
      
      <div className="main-content">
        {file ? (
          <>
              <div className="pdf-viewer">
                <PDFViewer 
                  file={file} 
                  sentences={sentences}
                  currentSentenceIndex={ttsCurrentSentenceIndex}
                  onTextItemHover={handleTextItemHover}
                  onTextItemClick={handleTextItemClick}
                  currentPageNumber={currentPageNumber}
                  onPageChange={handlePageChange}
                />
              </div>
            
            {/* Text Tracker for auto-scrolling */}
            <TextTracker
              sentences={sentences}
              currentSentenceIndex={ttsCurrentSentenceIndex}
              isPlaying={ttsPlaying}
              enabled={trackingEnabled}
              currentPageNumber={currentPageNumber}
              onPageChange={handlePageChange}
            />
            
            {/* DEPRECATED: This window is deprecated but needs to be left for future reference */}
            {/* 
            {text && (
              <div className="text-viewer-container">
                <h3>Extracted Text (Click sentences to start reading)</h3>
                <TextViewer
                  text={text}
                  currentSentenceIndex={ttsCurrentSentenceIndex}
                  onSentenceClick={handleSentenceClick}
                />
              </div>
            )}
            */}
          </>
        ) : (
          <div className="pdf-viewer">
            <div className="loading">
              <h2>Focus Reader</h2>
              <p>Upload a PDF file to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
