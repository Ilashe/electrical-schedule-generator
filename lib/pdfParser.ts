// Robust PDF parser that works with ANY sales order format

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
 * Extract from Electrical Schedule PDF
 */
function extractFromElectricalSchedule(text: string): QuoteData {
  console.log('Extracting from electrical schedule format...')
  
  const projectMatch = text.match(/PROJECT.*?([A-Z\s]+CAR\s+WASH)/i)
  const projectName = projectMatch ? projectMatch[1].trim() : 'Unknown Project'
  
  const ackMatch = text.match(/AVW PROJECT #.*?([A-Z0-9-]+)/i)
  const acknowledgmentNumber = ackMatch ? ackMatch[1] : 'Unknown'
  
  const addressMatch = text.match(/(\d+.*?(?:USA|US|CANADA|CA))/is)
  const shipToAddress = addressMatch ? addressMatch[1] : ''
  const country = detectCountry(shipToAddress)
  
  console.log('Project:', projectName)
  console.log('Project #:', acknowledgmentNumber)
  console.log('Country:', country)
  
  const items = extractEquipmentItems(text)
  console.log(`Extracted ${items.length} equipment items from schedule`)
  
  return {
    acknowledgmentNumber,
    projectName,
    shipToAddress,
    country,
    items,
  }
}

/**
 * Extract from Sales Order/Quote PDF - ROBUST LOGIC
 * Works with ANY sales order format
 */
function extractFromSalesOrder(text: string): QuoteData {
  console.log('Extracting from sales order format...')
  
  // Extract acknowledgment/quote number
  const ackMatch = text.match(/(?:Acknowledgment|Quote)\s+Number:\s*(\d+)/i)
  const acknowledgmentNumber = ackMatch ? ackMatch[1] : 'Unknown'
  console.log('Quote Number:', acknowledgmentNumber)

  // Extract ship to information
  const shipToMatch = text.match(/Ship\s+To\s+([^A]+?)(?=A\.V\.W\.|Customer PO|Terms of Sale)/is)
  let shipToAddress = ''
  let projectName = ''

  if (shipToMatch) {
    const shipToText = shipToMatch[1].trim()
    const lines = shipToText.split(/\n/).map(l => l.trim()).filter(l => l)
    projectName = lines[0] || 'Unknown Project'
    shipToAddress = shipToText.replace(/\s+/g, ' ')
    console.log('Project Name:', projectName)
    console.log('Ship To:', shipToAddress)
  }

  const country = detectCountry(shipToAddress)
  console.log('Detected Country:', country)

  // Extract equipment items using ROBUST logic
  const items = extractItemsFromSalesOrder(text)
  console.log(`Extracted ${items.length} equipment items`)
  
  if (items.length === 0) {
    console.error('No equipment items found in sales order!')
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
 * ROBUST extraction of items from sales order
 * Strategy: Split by lines ending with "T" (total marker)
 * Each item block ends with: QTY PRICE TOTALT
 */
function extractItemsFromSalesOrder(text: string): QuoteItem[] {
  const items: QuoteItem[] = []
  
  console.log('Using robust sales order extraction...')
  
  // Split text into blocks ending with T (total marker)
  // Pattern: number followed by T at end of line
  const itemBlocks = text.split(/(?<=\d+\.[\d]+T)\s*\n/);
  
  for (const block of itemBlocks) {
    const trimmedBlock = block.trim()
    
    // Skip if empty, header, or subtotal
    if (!trimmedBlock || 
        trimmedBlock.includes('Item Description Qty') ||
        trimmedBlock.includes('Subtotal') ||
        trimmedBlock.includes('Page ')) {
      continue
    }
    
    // Check if block ends with pattern: QTY PRICE TOTALT
    const match = trimmedBlock.match(/(\d+)\s+([\d,]+\.[\d]+)\s+([\d,]+\.[\d]+)T\s*$/)
    
    if (!match) {
      continue
    }
    
    const quantity = parseInt(match[1])
    
    // Extract part number - first word of the block
    // Part numbers: letters, numbers, dashes, dots, underscores
    const partMatch = trimmedBlock.match(/^([A-Z0-9][A-Z0-9\-\._]*)/)
    
    if (!partMatch) {
      continue
    }
    
    const partNumber = partMatch[1]
    
    // Description is between part number and qty/price/total
    const descriptionText = trimmedBlock.substring(partNumber.length, match.index).trim()
    
    // Clean up description (remove extra whitespace, newlines)
    const description = descriptionText.replace(/\s+/g, ' ').trim()
    
    items.push({
      partNumber,
      description,
      quantity,
    })
    
    if (items.length <= 20) {
      console.log(`  Item ${items.length}: ${partNumber} (Qty: ${quantity})`)
    }
  }
  
  console.log(`Total items extracted: ${items.length}`)
  
  // Log duplicates
  const partCounts: { [key: string]: number } = {}
  items.forEach(item => {
    partCounts[item.partNumber] = (partCounts[item.partNumber] || 0) + 1
  })
  
  const duplicates = Object.entries(partCounts).filter(([_, count]) => count > 1)
  if (duplicates.length > 0) {
    console.log('Duplicate items found (all included):')
    duplicates.forEach(([part, count]) => {
      console.log(`  - ${part}: appears ${count} times`)
    })
  }
  
  return items
}

/**
 * Extract equipment items from electrical schedule table
 */
function extractEquipmentItems(text: string): QuoteItem[] {
  const items: QuoteItem[] = []
  
  const tableMatch = text.match(/PROJECT ITEM #.*?TOTAL/s)
  if (!tableMatch) {
    console.error('Could not find equipment table')
    return items
  }
  
  const tableText = tableMatch[0]
  const lines = tableText.split('\n')
  
  for (const line of lines) {
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

  return 'USA'
}
