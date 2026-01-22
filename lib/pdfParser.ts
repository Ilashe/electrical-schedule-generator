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
 * Handles two types of PDFs:
 * 1. Sales Order/Quote PDFs (with prices)
 * 2. Electrical Schedule PDFs (completed schedules)
 */
export function extractQuoteDataFromText(pdfText: string): QuoteData {
  try {
    console.log('Parsing PDF text, length:', pdfText.length)
    
    // Detect PDF type
    const isElectricalSchedule = pdfText.includes('PROJECT ITEM #') && 
                                  pdfText.includes('EQUIPMENT REQUIREMENTS')
    
    if (isElectricalSchedule) {
      console.log('Detected: ELECTRICAL SCHEDULE PDF')
      return extractFromElectricalSchedule(pdfText)
    } else {
      console.log('Detected: SALES ORDER/QUOTE PDF')
      return extractFromSalesOrder(pdfText)
    }
  } catch (error) {
    console.error('Error parsing PDF text:', error)
    throw new Error('Failed to parse PDF')
  }
}

/**
 * Extract from Electrical Schedule PDF (like EQ-1-1115)
 */
function extractFromElectricalSchedule(text: string): QuoteData {
  console.log('Extracting from electrical schedule format...')
  
  // Extract project info
  const projectMatch = text.match(/PROJECT.*?([A-Z\s]+CAR\s+WASH)/i)
  const projectName = projectMatch ? projectMatch[1].trim() : 'Unknown Project'
  
  const ackMatch = text.match(/AVW PROJECT #.*?([A-Z0-9-]+)/i)
  const acknowledgmentNumber = ackMatch ? ackMatch[1] : 'Unknown'
  
  // Extract address for country detection
  const addressMatch = text.match(/(\d+.*?(?:USA|US|CANADA|CA))/is)
  const shipToAddress = addressMatch ? addressMatch[1] : ''
  const country = detectCountry(shipToAddress)
  
  console.log('Project:', projectName)
  console.log('Project #:', acknowledgmentNumber)
  console.log('Country:', country)
  
  // Extract main equipment items (those without letter suffixes)
  const items: QuoteItem[] = []
  
  // Find the equipment table section
  const tableMatch = text.match(/PROJECT ITEM #.*?TOTAL/s)
  if (!tableMatch) {
    console.error('Could not find equipment table')
    return {
      acknowledgmentNumber,
      projectName,
      shipToAddress,
      country,
      items: [],
    }
  }
  
  const tableText = tableMatch[0]
  const lines = tableText.split('\n')
  
  for (const line of lines) {
    // Pattern: sequential# projectItem# partNum quantity description...
    // Main items have numeric-only project item # (1, 2, 3, 4...)
    // Sub-items have letters (2A, 2B, 4AA, 5C...)
    
    const match = line.match(/^\s*\d+\s+(\d+)\s+([A-Z0-9-]+)\s+(\d+)\s+(.+?)(?:\s+-\s+|\s+\d+\s+|$)/)
    
    if (match) {
      const projectItemNum = match[1]
      const partNumber = match[2]
      const quantity = parseInt(match[3])
      const description = match[4].trim()
      
      // Only extract main items (numeric project item numbers)
      if (/^\d+$/.test(projectItemNum)) {
        items.push({
          partNumber,
          description,
          quantity,
        })
        
        console.log(`Main item ${projectItemNum}: ${partNumber} - ${description}`)
      }
    }
  }
  
  console.log(`Extracted ${items.length} main equipment items from schedule`)
  
  return {
    acknowledgmentNumber,
    projectName,
    shipToAddress,
    country,
    items,
  }
}

/**
 * Extract from Sales Order/Quote PDF (like Quote #38388)
 */
function extractFromSalesOrder(text: string): QuoteData {
  console.log('Extracting from sales order format...')
  
  // Extract acknowledgment number
  const ackMatch = text.match(/Acknowledgment Number:\s*(\d+)/)
  const acknowledgmentNumber = ackMatch ? ackMatch[1] : 'Unknown'
  console.log('Acknowledgment Number:', acknowledgmentNumber)

  // Extract ship to information
  const shipToMatch = text.match(/Ship To\s+([^A]+?)(?=A\.V\.W\.|Customer PO)/i)
  let shipToAddress = ''
  let projectName = ''

  if (shipToMatch) {
    const shipToText = shipToMatch[1].trim()
    const parts = shipToText.split(/\s{2,}/)
    projectName = parts[0] || 'Unknown Project'
    shipToAddress = shipToText.replace(/\s+/g, ' ')
    console.log('Project Name:', projectName)
    console.log('Ship To Address:', shipToAddress)
  }

  const country = detectCountry(shipToAddress)
  console.log('Detected Country:', country)

  // Extract equipment items
  const items = extractEquipmentItems(text)
  console.log(`Extracted ${items.length} equipment items`)
  
  if (items.length === 0) {
    console.error('No equipment items found in PDF!')
    console.log('PDF Text Preview:', text.substring(0, 1000))
  }

  return {
    acknowledgmentNumber,
    projectName,
    shipToAddress,
    country,
    items,
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
