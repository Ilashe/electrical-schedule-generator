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
    console.log('Parsing PDF text, length:', pdfText.length)
    
    // Extract acknowledgment number
    const ackMatch = pdfText.match(/Acknowledgment Number:\s*(\d+)/)
    const acknowledgmentNumber = ackMatch ? ackMatch[1] : 'Unknown'
    console.log('Acknowledgment Number:', acknowledgmentNumber)

    // Extract ship to information
    const shipToMatch = pdfText.match(/Ship To\s+([\s\S]*?)(?=\n\n|A\.V\.W\.|Customer PO)/i)
    let shipToAddress = ''
    let projectName = ''

    if (shipToMatch) {
      const shipToText = shipToMatch[1]
      const lines = shipToText.split('\n').map(l => l.trim()).filter(l => l)
      projectName = lines[0] || 'Unknown Project'
      shipToAddress = lines.join(', ')
      console.log('Project Name:', projectName)
      console.log('Ship To Address:', shipToAddress)
    } else {
      console.warn('Could not find Ship To information')
    }

    // Detect country from address
    const country = detectCountry(shipToAddress)
    console.log('Detected Country:', country)

    // Extract equipment items from the table
    const items = extractEquipmentItems(pdfText)
    console.log(`Extracted ${items.length} equipment items`)
    
    if (items.length === 0) {
      console.error('No equipment items found in PDF!')
      console.log('PDF Text Preview:', pdfText.substring(0, 500))
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
 * Extract equipment items from quote text
 */
function extractEquipmentItems(text: string): QuoteItem[] {
  const items: QuoteItem[] = []
  const lines = text.split('\n')

  console.log(`Searching through ${lines.length} lines for equipment items...`)

  // Find the start of the item list (after "Item Description Qty")
  let inItemSection = false
  const partNumberPattern = /^([A-Z0-9-]+)\s/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Start of items section
    if (line.includes('Item') && line.includes('Description') && line.includes('Qty')) {
      inItemSection = true
      console.log(`Found item section start at line ${i}`)
      continue
    }

    // End of items section
    if (line.includes('Subtotal') || line.includes('****Back Room Equipment***')) {
      if (line.includes('****Back Room Equipment***')) {
        console.log(`Found back room equipment marker at line ${i}`)
        // Continue to capture backroom equipment
        continue
      } else {
        console.log(`Found subtotal at line ${i}, ending item extraction`)
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
          
          if (items.length <=5) {
            console.log(`Item ${items.length}: ${partNumber} - ${description}`)
          }
        }
      }
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
