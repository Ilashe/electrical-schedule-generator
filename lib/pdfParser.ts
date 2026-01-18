// Browser-compatible PDF parser using pdfjs-dist
// This works in Vercel serverless environment

export interface QuoteItem {
  partNumber: string
  description: string
  quantity: number
}

export interface QuoteData {
  acknowledgmentNumber: string
  projectName: string
  shipToAddress: string
  country: string
  items: QuoteItem[]
}

/**
 * Extract equipment list and metadata from PDF text
 * This function receives already-extracted text from the browser
 */
export function extractQuoteDataFromText(pdfText: string): QuoteData {
  try {
    // Extract acknowledgment number
    const ackMatch = pdfText.match(/Acknowledgment Number:\s*(\d+)/)
    const acknowledgmentNumber = ackMatch ? ackMatch[1] : 'Unknown'

    // Extract ship to information
    const shipToMatch = pdfText.match(/Ship To\s+([\s\S]*?)(?=\n\n|A\.V\.W\.|Customer PO)/i)
    let shipToAddress = ''
    let projectName = ''

    if (shipToMatch) {
      const shipToText = shipToMatch[1]
      const lines = shipToText.split('\n').map(l => l.trim()).filter(l => l)
      projectName = lines[0] || 'Unknown Project'
      shipToAddress = lines.join(', ')
    }

    // Detect country from address
    const country = detectCountry(shipToAddress)

    // Extract equipment items from the table
    const items = extractEquipmentItems(pdfText)

    return {
      acknowledgmentNumber,
      projectName,
      shipToAddress,
      country,
      items,
    }
  } catch (error) {
    console.error('Error parsing PDF text:', error)
    throw new Error('Failed to parse PDF quote')
  }
}

/**
 * Extract equipment items from quote text
 */
function extractEquipmentItems(text: string): QuoteItem[] {
  const items: QuoteItem[] = []
  const lines = text.split('\n')

  // Find the start of the item list (after "Item Description Qty")
  let inItemSection = false
  const partNumberPattern = /^([A-Z0-9-]+)\s/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Start of items section
    if (line.includes('Item') && line.includes('Description') && line.includes('Qty')) {
      inItemSection = true
      continue
    }

    // End of items section
    if (line.includes('Subtotal') || line.includes('****Back Room Equipment***')) {
      if (line.includes('****Back Room Equipment***')) {
        // Continue to capture backroom equipment
        continue
      } else {
        break
      }
    }

    if (inItemSection && line.length > 0) {
      // Try to extract part number from the beginning of the line
      const partMatch = line.match(partNumberPattern)
      
      if (partMatch) {
        const partNumber = partMatch[1]
        
        // Get description (everything after part number until quantity)
        // Pattern: PART_NUM Description text... Qty Price Total
        const descMatch = line.match(/^[A-Z0-9-]+\s+(.+?)\s+(\d+)\s+[\d,]+\.[\d]+/)
        
        if (descMatch) {
          const description = descMatch[1].trim()
          const quantity = parseInt(descMatch[2])

          items.push({
            partNumber,
            description,
            quantity,
          })
        }
      }
    }
  }

  return items
}

/**
 * Detect country from shipping address
 */
function detectCountry(address: string): string {
  const addressUpper = address.toUpperCase()

  if (addressUpper.includes('USA') || addressUpper.includes('UNITED STATES')) {
    return 'USA'
  } else if (addressUpper.includes('CANADA')) {
    return 'Canada'
  } else if (addressUpper.includes('AUSTRALIA')) {
    return 'Australia'
  } else if (addressUpper.includes('UK') || addressUpper.includes('UNITED KINGDOM')) {
    return 'UK'
  } else if (addressUpper.includes('MEXICO')) {
    return 'Mexico'
  }

  // Default to USA
  return 'USA'
}
