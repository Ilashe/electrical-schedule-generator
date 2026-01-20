// Browser-compatible PDF parser
// Handles PDF text that comes as continuous space-separated text

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
 */
export function extractQuoteDataFromText(pdfText: string): QuoteData {
  try {
    console.log('Parsing PDF text, length:', pdfText.length)
    
    // Extract acknowledgment number
    const ackMatch = pdfText.match(/Acknowledgment Number:\s*(\d+)/)
    const acknowledgmentNumber = ackMatch ? ackMatch[1] : 'Unknown'
    console.log('Acknowledgment Number:', acknowledgmentNumber)

    // Extract ship to information
    const shipToMatch = pdfText.match(/Ship To\s+([^A]+?)(?=A\.V\.W\.|Customer PO)/i)
    let shipToAddress = ''
    let projectName = ''

    if (shipToMatch) {
      const shipToText = shipToMatch[1].trim()
      const parts = shipToText.split(/\s{2,}/) // Split on multiple spaces
      projectName = parts[0] || 'Unknown Project'
      shipToAddress = shipToText.replace(/\s+/g, ' ')
      console.log('Project Name:', projectName)
      console.log('Ship To Address:', shipToAddress)
    }

    // Detect country from address
    const country = detectCountry(shipToAddress)
    console.log('Detected Country:', country)

    // Extract equipment items
    const items = extractEquipmentItems(pdfText)
    console.log(`Extracted ${items.length} equipment items`)
    
    if (items.length === 0) {
      console.error('No equipment items found in PDF!')
      console.log('PDF Text Preview:', pdfText.substring(0, 1000))
    }

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
 * Extract equipment items from continuous PDF text
 */
function extractEquipmentItems(text: string): QuoteItem[] {
  const items: QuoteItem[] = []
  
  console.log('Extracting equipment items from continuous text...')
  
  // Find the section between "Item Description Qty" and "Subtotal"
  const itemSectionMatch = text.match(/Item\s+Description\s+Qty\s+Unit Price\s+Total\s+(.*?)(?=Subtotal|Page \d)/s)
  
  if (!itemSectionMatch) {
    console.error('Could not find item section in PDF')
    return items
  }
  
  const itemSection = itemSectionMatch[1]
  console.log('Item section length:', itemSection.length)
  
  // Pattern: PART_NUMBER Description... Quantity Price Total
  // Example: RC4 Roller Correlator, 2-1/2" Sch 10 Rollers, Frames, SS 1 5,385.00 5,385.00T
  const itemPattern = /([A-Z0-9-]+)\s+(.+?)\s+(\d+)\s+[\d,]+\.[\d]+\s+[\d,]+\.[\d]+T/g
  
  let match
  while ((match = itemPattern.exec(itemSection)) !== null) {
    const partNumber = match[1]
    const description = match[2].trim()
    const quantity = parseInt(match[3])
    
    items.push({
      partNumber,
      description,
      quantity,
    })
    
    if (items.length <= 10) {
      console.log(`Item ${items.length}: ${partNumber} - ${description.substring(0, 50)}`)
    }
  }
  
  console.log(`Total items extracted: ${items.length}`)
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
