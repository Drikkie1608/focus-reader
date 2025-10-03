/**
 * PDF Hover Highlighting Utilities
 * Handles mouse hover effects on PDF text items
 */

export interface HoverHighlight {
  id: string
  x: number
  y: number
  width: number
  height: number
  pageNumber: number
  color?: string
}

export interface TextItemWithHover {
  text: string
  pageNumber: number
  leftPercent: number
  topPercent: number
  widthPercent: number
  heightPercent: number
  id: string
}

/**
 * Creates hover highlights for text items
 */
export function createHoverHighlights(textItems: TextItemWithHover[]): HoverHighlight[] {
  return textItems.map(item => ({
    id: item.id,
    x: item.leftPercent,
    y: item.topPercent + (item.heightPercent * 0.2), // Move down like original highlighting
    width: item.widthPercent,
    height: item.heightPercent,
    pageNumber: item.pageNumber,
    color: '#e3f2fd' // Subtle blue highlight
  }))
}

/**
 * Finds text items that intersect with mouse position
 */
export function findTextItemsAtPosition(
  mouseX: number,
  mouseY: number,
  textItems: TextItemWithHover[],
  pageNumber: number,
  containerWidth: number,
  containerHeight: number
): TextItemWithHover[] {
  // Convert mouse position to percentage coordinates
  const mouseXPercent = (mouseX / containerWidth) * 100
  const mouseYPercent = (mouseY / containerHeight) * 100
  
  return textItems.filter(item => {
    // Only check items on the current page
    if (item.pageNumber !== pageNumber) return false
    
    // Check if mouse is within the text item bounds
    const isWithinX = mouseXPercent >= item.leftPercent && 
                     mouseXPercent <= item.leftPercent + item.widthPercent
    const isWithinY = mouseYPercent >= item.topPercent && 
                     mouseYPercent <= item.topPercent + item.heightPercent
    
    return isWithinX && isWithinY
  })
}

/**
 * Generates unique IDs for text items
 */
export function generateTextItemId(pageNumber: number, index: number): string {
  return `text-item-${pageNumber}-${index}`
}

/**
 * Converts regular text items to text items with hover support
 */
export function addHoverSupportToTextItems(
  textItems: Array<{
    text: string
    pageNumber: number
    leftPercent: number
    topPercent: number
    widthPercent: number
    heightPercent: number
  }>
): TextItemWithHover[] {
  return textItems.map((item, index) => ({
    ...item,
    id: generateTextItemId(item.pageNumber, index)
  }))
}
