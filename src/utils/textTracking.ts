/**
 * Text Tracking Utilities
 * Handles automatic scrolling to track highlighted text
 */

import { Sentence } from './textProcessor'

export interface TextPosition {
  pageNumber: number
  yPercent: number
  heightPercent: number
}

export interface ScrollTarget {
  pageNumber: number
  scrollY: number
  reason: 'sentence_start' | 'page_change' | 'manual'
}

/**
 * Extracts text position information from a sentence
 */
export function getTextPosition(sentence: Sentence): TextPosition | null {
  if (!sentence.textItems || sentence.textItems.length === 0) {
    return null
  }

  // Use the first text item to determine position
  const firstItem = sentence.textItems[0]
  
  return {
    pageNumber: firstItem.pageNumber,
    yPercent: firstItem.topPercent,
    heightPercent: firstItem.heightPercent
  }
}

/**
 * Calculates scroll position to center text on screen
 */
export function calculateScrollTarget(
  textPosition: TextPosition,
  viewportHeight: number,
  pageHeight: number,
  pageNumber: number
): ScrollTarget {
  // Convert percentage to pixels
  const textY = (textPosition.yPercent / 100) * pageHeight
  
  // Calculate scroll position to center the text
  const scrollY = Math.max(0, textY - (viewportHeight / 2))
  
  return {
    pageNumber,
    scrollY,
    reason: 'sentence_start'
  }
}

/**
 * Determines if text is visible in current viewport
 */
export function isTextVisible(
  textPosition: TextPosition,
  currentScrollY: number,
  viewportHeight: number,
  pageHeight: number
): boolean {
  const textY = (textPosition.yPercent / 100) * pageHeight
  const textBottom = textY + ((textPosition.heightPercent / 100) * pageHeight)
  
  const viewportTop = currentScrollY
  const viewportBottom = currentScrollY + viewportHeight
  
  // Text is visible if any part is within the viewport
  return textY < viewportBottom && textBottom > viewportTop
}

/**
 * Calculates optimal scroll position for text tracking
 */
export function calculateOptimalScrollPosition(
  textPosition: TextPosition,
  currentScrollY: number,
  viewportHeight: number,
  pageHeight: number,
  scrollThreshold: number = 0.3 // 30% threshold
): ScrollTarget | null {
  const textY = (textPosition.yPercent / 100) * pageHeight
  const textBottom = textY + ((textPosition.heightPercent / 100) * pageHeight)
  
  const viewportTop = currentScrollY
  const viewportBottom = currentScrollY + viewportHeight
  
  // Check if text is already well-positioned
  const textCenter = textY + ((textPosition.heightPercent / 100) * pageHeight) / 2
  const viewportCenter = viewportTop + viewportHeight / 2
  
  const distanceFromCenter = Math.abs(textCenter - viewportCenter)
  const threshold = viewportHeight * scrollThreshold
  
  // Only scroll if text is too far from center
  if (distanceFromCenter < threshold) {
    return null
  }
  
  // Calculate new scroll position to center the text
  const newScrollY = Math.max(0, textCenter - viewportHeight / 2)
  
  return {
    pageNumber: textPosition.pageNumber,
    scrollY: newScrollY,
    reason: 'sentence_start'
  }
}

/**
 * Smooth scroll configuration
 */
export interface SmoothScrollConfig {
  duration: number // milliseconds
  easing: 'linear' | 'ease-in-out' | 'ease-out'
  threshold: number // minimum distance to trigger scroll
}

export const DEFAULT_SCROLL_CONFIG: SmoothScrollConfig = {
  duration: 500,
  easing: 'ease-out',
  threshold: 50 // pixels
}

/**
 * Performs smooth scrolling to target position within a specific container
 */
export function smoothScrollTo(
  targetY: number,
  container: HTMLElement | Window = window,
  config: SmoothScrollConfig = DEFAULT_SCROLL_CONFIG
): Promise<void> {
  return new Promise((resolve) => {
    const isWindow = container === window
    const startY = isWindow ? window.scrollY : (container as HTMLElement).scrollTop
    const distance = targetY - startY
    
    // Don't scroll if distance is too small
    if (Math.abs(distance) < config.threshold) {
      resolve()
      return
    }
    
    const startTime = performance.now()
    
    function animateScroll(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / config.duration, 1)
      
      let easedProgress: number
      switch (config.easing) {
        case 'ease-in-out':
          easedProgress = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2
          break
        case 'ease-out':
          easedProgress = 1 - Math.pow(1 - progress, 3)
          break
        default:
          easedProgress = progress
      }
      
      const currentY = startY + distance * easedProgress
      
      if (isWindow) {
        window.scrollTo(0, currentY)
      } else {
        (container as HTMLElement).scrollTop = currentY
      }
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      } else {
        resolve()
      }
    }
    
    requestAnimationFrame(animateScroll)
  })
}
