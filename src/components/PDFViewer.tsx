import React, { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { PDFHighlighter } from './PDFHighlighter'
import { HoverHighlighter } from './HoverHighlighter'
import { Sentence } from '../utils/textProcessor'
import { TextItemWithHover, addHoverSupportToTextItems } from '../utils/hoverHighlighting'

// Set up PDF.js worker - use jsdelivr CDN with proper CORS headers
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  file: File
  sentences?: Sentence[]
  currentSentenceIndex?: number
  onTextItemHover?: (textItem: TextItemWithHover | null) => void
  onTextItemClick?: (textItem: TextItemWithHover) => void
  currentPageNumber?: number
  onPageChange?: (pageNumber: number) => void
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ 
  file, 
  sentences = [], 
  currentSentenceIndex = -1, 
  onTextItemHover,
  onTextItemClick,
  currentPageNumber: externalPageNumber,
  onPageChange
}) => {
  const [numPages, setNumPages] = useState<number>(0)
  const [internalPageNumber, setInternalPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [pageHeight, setPageHeight] = useState<number>(800) // Default page height

  // Use external page number if provided, otherwise use internal state
  const pageNumber = externalPageNumber !== undefined ? externalPageNumber : internalPageNumber

  // Get all text items from sentences for hover highlighting
  const allTextItems: TextItemWithHover[] = sentences
    .flatMap(sentence => sentence.textItems)
    .map((item, index) => ({
      ...item,
      id: `text-item-${item.pageNumber}-${index}`
    }))

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    if (externalPageNumber === undefined) {
      setInternalPageNumber(1)
    }
    setScale(1.0) // Reset scale on new document load
  }

  const handlePrevPage = () => {
    const newPage = Math.max(pageNumber - 1, 1)
    if (onPageChange) {
      onPageChange(newPage)
    } else {
      setInternalPageNumber(newPage)
    }
  }

  const handleNextPage = () => {
    const newPage = Math.min(pageNumber + 1, numPages)
    if (onPageChange) {
      onPageChange(newPage)
    } else {
      setInternalPageNumber(newPage)
    }
  }

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 2.0))
  }

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5))
  }

  return (
    <div className="pdf-viewer">
      <div className="pdf-toolbar">
        <div className="page-info">
          <span className="page-indicator">
            <span className="page-number">{pageNumber}</span>
            <span className="page-separator">/</span>
            <span className="total-pages">{numPages}</span>
          </span>
        </div>
        
        <div className="zoom-controls">
          <button 
            className="zoom-button" 
            onClick={handleZoomOut} 
            disabled={scale <= 0.5}
            title="Zoom out"
          >
            <span className="zoom-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H5V11H19V13Z"/>
              </svg>
            </span>
          </button>
          <div className="zoom-display">
            <span className="zoom-percentage">{(scale * 100).toFixed(0)}%</span>
          </div>
          <button 
            className="zoom-button" 
            onClick={handleZoomIn} 
            disabled={scale >= 2.0}
            title="Zoom in"
          >
            <span className="zoom-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
            </span>
          </button>
        </div>
        
        <div className="page-navigation">
          <button 
            className="nav-button prev" 
            onClick={handlePrevPage}
            disabled={pageNumber <= 1}
            title="Previous page"
          >
            <span className="nav-icon">◀</span>
          </button>
          <button 
            className="nav-button next" 
            onClick={handleNextPage}
            disabled={pageNumber >= numPages}
            title="Next page"
          >
            <span className="nav-icon">▶</span>
          </button>
        </div>
      </div>
      <div className="pdf-content">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={console.error}
          className="pdf-document"
        >
          <div style={{ position: 'relative' }}>
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="pdf-page"
            />
            <PDFHighlighter
              sentences={sentences}
              currentSentenceIndex={currentSentenceIndex}
              scale={scale}
              pageNumber={pageNumber}
              pageHeight={pageHeight}
            />
            <HoverHighlighter
              textItems={allTextItems}
              pageNumber={pageNumber}
              scale={scale}
              pageHeight={pageHeight}
              onTextItemHover={onTextItemHover}
              onTextItemClick={onTextItemClick}
            />
          </div>
        </Document>
      </div>
    </div>
  )
}