import React, { useState, useCallback } from 'react'

interface ControlPanelProps {
  onFileSelect: (file: File) => void
  onPause: () => void
  onSkip: () => void
  onSpeedChange: (speed: number) => void
  onTrackingToggle: (enabled: boolean) => void
  isPlaying: boolean
  speed: number
  hasText: boolean
  isLoading: boolean
  trackingEnabled: boolean
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onFileSelect,
  onPause,
  onSkip,
  onSpeedChange,
  onTrackingToggle,
  isPlaying,
  speed,
  hasText,
  isLoading,
  trackingEnabled
}) => {
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      onFileSelect(file)
    } else {
      alert('Please select a PDF file')
    }
  }, [onFileSelect])

  const handleDropzoneClick = useCallback(() => {
    const input = document.querySelector('.file-input-hidden') as HTMLInputElement
    if (input) {
      input.click()
    }
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'application/pdf') {
        onFileSelect(file)
      } else {
        alert('Please drop a PDF file')
      }
    }
  }, [onFileSelect])

  return (
    <div className="control-panel">
      <div className="app-header">
        <div className="app-title">
          <div className="app-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <h1>Focus Reader</h1>
        </div>
        <p className="app-subtitle">eliminate spray</p>
      </div>
      
      <div className="upload-section">
        <div 
          className={`file-dropzone ${dragActive ? 'drag-active' : ''} ${isLoading ? 'loading' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleDropzoneClick}
        >
          <div className="dropzone-content">
            <div className="upload-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </div>
            <div className="upload-text">
              <strong>Drop PDF here</strong>
              <span>or click to browse</span>
            </div>
          </div>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={isLoading}
            className="file-input-hidden"
          />
        </div>
      </div>

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Processing PDF...</span>
        </div>
      )}

      {hasText && (
        <div className="controls-section">
          <div className="playback-controls">
            <button 
              className={`play-button ${isPlaying ? 'playing' : 'paused'}`}
              onClick={onPause}
              disabled={isLoading}
            >
              <span className="button-icon">
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,19H18V5H14M6,19H10V5H6V19Z"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
                  </svg>
                )}
              </span>
              <span className="button-text">
                {isPlaying ? 'Pause' : 'Play'}
              </span>
            </button>
            
            {isPlaying && (
              <button 
                className="skip-button"
                onClick={onSkip}
                disabled={isLoading}
                title="Skip current sentence"
              >
                <span className="button-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4,18V6H6V18H4M11,6L19,12L11,18V6Z"/>
                  </svg>
                </span>
                <span className="button-text">Skip</span>
              </button>
            )}
          </div>

          <div className="speed-control">
            <label className="control-label">
              Reading Speed
            </label>
            <div className="speed-slider-container">
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={speed}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                className="speed-slider"
              />
              <div className="speed-labels">
                <span className="speed-label">0.5x</span>
                <span className="speed-value">{speed.toFixed(1)}x</span>
                <span className="speed-label">3.0x</span>
              </div>
            </div>
          </div>

          <div className="tracking-control">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={trackingEnabled}
                onChange={(e) => onTrackingToggle(e.target.checked)}
                disabled={isLoading}
                className="toggle-input"
              />
              <span className="toggle-slider"></span>
              <div className="toggle-content">
                <div className="toggle-text">
                  <strong>Auto-scroll</strong>
                  <span>Follow highlighted text</span>
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

    </div>
  )
}
