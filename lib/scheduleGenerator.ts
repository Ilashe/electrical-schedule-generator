import { QuoteData } from './pdfParser'
import masterListData from '../public/data/master_list_structured.json'
import voltageMap from '../public/data/voltage_mappings.json'

export interface ScheduleItem {
  itemNumber: string
  partNumber: string
  quantity: string | number
  description: string
  hp: any
  phase: any
  volts: any
  amps: any
  cb: any
  port: any
  cold: any
  hot: any
  reclaim: any
  galMin: any
  btuh: any
  isSubComponent: boolean
  motorLabel?: string
}

export interface Schedule {
  projectName: string
  acknowledgmentNumber: string
  country: string
  voltage: {
    '3phase': number
    '1phase': number
  }
  items: ScheduleItem[]
  totalMotors: number
  totalAmps: number
  notFoundItems: string[]
  excludedItems: string[]
}

const EXCLUDED_ITEMS = [
  'RC3DG-UHMW',
  'FGPIT-MOLD-K-4X12',
  'FGPIT-CLM-K',
  'WA2F-0318',
  'WA1M-72-510-5220-CORE',
  'WA1M-00-510-5220-SS-CL-BL',
  'CB1AMA-50-13-S-CL',
  'CB1AMC-50-13',
  'CB1AMA-23-13-S-CL',
  'CB1AMC-23-13',
  'MC1E-12W79L-S-CL-AVW-BL',
  'MCC-460',
  'MCC-5-460-VFD',
  'DISPENSEIT-10-INJ-KIT',
  'COMP-FLTR-REG-3-4IN',
  'COMP-PRESS-GAUGE',
]

function shouldExcludeItem(partNumber: string): boolean {
  return EXCLUDED_ITEMS.some(excluded => partNumber.includes(excluded))
}

/**
 * FIX #1: Track occurrence count for each part number
 */
interface OccurrenceTracker {
  [partNumber: string]: number
}

/**
 * Generate electrical schedule from quote data
 * FIXES:
 * #1 - Handle duplicate items (each occurrence is separate project item)
 * #3 - Include all columns (PORT, COLD, HOT, RECLAIM, GAL/MIN, BTUH)
 * #4 - Occurrence count for ALL equipment, not just motors
 * #5 - Correct sub-item lettering (AA, BA, CA for nested items)
 */
export async function generateSchedule(quoteData: QuoteData, country: string): Promise<Schedule> {
  const voltage = (voltageMap as any)[country] || (voltageMap as any)['USA']
  const scheduleItems: ScheduleItem[] = []
  const notFoundItems: string[] = []
  const excludedItems: string[] = []
  const occurrenceTracker: OccurrenceTracker = {} // FIX #4: Track ALL equipment occurrences
  let motorCount = 0
  let projectItemNumber = 1

  console.log(`Generating schedule for ${quoteData.items.length} quote items...`)

  // FIX #1: Process ALL items from quote, including duplicates
  for (const quoteItem of quoteData.items) {
    console.log(`\nProcessing: ${quoteItem.partNumber}`)
    
    if (shouldExcludeItem(quoteItem.partNumber)) {
      console.log(`  ❌ EXCLUDED: ${quoteItem.partNumber}`)
      excludedItems.push(`${quoteItem.partNumber} - ${quoteItem.description}`)
      continue
    }

    const masterItem = lookupMasterItem(quoteItem.partNumber)
    
    if (!masterItem) {
      console.log(`  ⚠️  NOT FOUND - SKIPPING: ${quoteItem.partNumber}`)
      notFoundItems.push(`${quoteItem.partNumber} - ${quoteItem.description}`)
      continue
    }

    console.log(`  ✓ Found: ${masterItem.main.description}`)
    console.log(`    Sub-components: ${masterItem.sub_components.length}`)

    // FIX #4: Track occurrence for this main item
    const mainPartNum = masterItem.main.part_num
    if (!occurrenceTracker[mainPartNum]) {
      occurrenceTracker[mainPartNum] = 0
    }
    occurrenceTracker[mainPartNum]++
    const mainOccurrence = occurrenceTracker[mainPartNum]

    // Add main item with occurrence count
    const mainItem = createScheduleItem(
      masterItem.main,
      projectItemNumber.toString(),
      '',
      mainOccurrence, // FIX #4: Show occurrence count
      voltage,
      false
    )
    
    scheduleItems.push(mainItem)

    if (isMotor(mainItem)) {
      motorCount++
      mainItem.motorLabel = `M-${motorCount}`
      mainItem.quantity = motorCount // Motors show motor number instead
    }

    // FIX #5: Intelligent sub-item lettering
    // Pair BLOWER + MOTOR together (BL0115D-15 + M-15 → A + AA, B + BA, C + CA)
    const subItems = masterItem.sub_components
    let subLetter = 'A'
    let i = 0
    
    while (i < subItems.length) {
      const currentSub = subItems[i]
      const nextSub = subItems[i + 1]
      
      // Check if this is BLOWER + MOTOR pair
      const isBlowerMotorPair = 
        currentSub.description.toUpperCase().includes('BLOWER') &&
        nextSub && 
        (nextSub.description.toUpperCase().includes('MOTOR') || nextSub.part_num.startsWith('M-') || nextSub.part_num === 'M')
      
      if (isBlowerMotorPair) {
        // Add blower with letter (A, B, C...)
        const blowerItem = createScheduleItem(
          currentSub,
          projectItemNumber.toString(),
          subLetter,
          '', // No quantity for sub-items
          voltage,
          true
        )
        scheduleItems.push(blowerItem)
        
        // Track blower occurrence
        if (!occurrenceTracker[currentSub.part_num]) {
          occurrenceTracker[currentSub.part_num] = 0
        }
        occurrenceTracker[currentSub.part_num]++
        blowerItem.quantity = occurrenceTracker[currentSub.part_num]
        
        // Add motor with double letter (AA, BA, CA...)
        const motorItem = createScheduleItem(
          nextSub,
          projectItemNumber.toString(),
          subLetter + 'A', // FIX #5: AA, BA, CA pattern
          '',
          voltage,
          true
        )
        scheduleItems.push(motorItem)
        
        if (isMotor(motorItem)) {
          motorCount++
          motorItem.motorLabel = `M-${motorCount}`
          motorItem.quantity = motorCount
        }
        
        subLetter = String.fromCharCode(subLetter.charCodeAt(0) + 1)
        i += 2 // Skip both blower and motor
      } else {
        // Regular sub-item
        const subItem = createScheduleItem(
          currentSub,
          projectItemNumber.toString(),
          subLetter,
          '',
          voltage,
          true
        )
        
        scheduleItems.push(subItem)
        
        // Track occurrence for sub-items too
        if (!occurrenceTracker[currentSub.part_num]) {
          occurrenceTracker[currentSub.part_num] = 0
        }
        occurrenceTracker[currentSub.part_num]++
        subItem.quantity = occurrenceTracker[currentSub.part_num]
        
        if (isMotor(subItem)) {
          motorCount++
          subItem.motorLabel = `M-${motorCount}`
          subItem.quantity = motorCount // Motors show motor count
        }
        
        subLetter = String.fromCharCode(subLetter.charCodeAt(0) + 1)
        i++
      }
    }

    projectItemNumber++
  }

  const totalAmps = scheduleItems.reduce((sum, item) => {
    const amps = parseFloat(String(item.amps))
    return sum + (isNaN(amps) ? 0 : amps)
  }, 0)

  console.log(`\n✓ Generated: ${scheduleItems.length} rows, ${motorCount} motors, ${totalAmps.toFixed(2)} amps`)
  console.log(`✓ Not found: ${notFoundItems.length} items`)
  console.log(`✓ Excluded: ${excludedItems.length} items`)

  return {
    projectName: quoteData.projectName,
    acknowledgmentNumber: quoteData.acknowledgmentNumber,
    country,
    voltage,
    items: scheduleItems,
    totalMotors: motorCount,
    totalAmps: parseFloat(totalAmps.toFixed(2)),
    notFoundItems,
    excludedItems,
  }
}

function lookupMasterItem(partNumber: string): any {
  if ((masterListData as any)[partNumber]) {
    return (masterListData as any)[partNumber]
  }
  
  const basePartNum = partNumber.split('-')[0]
  
  for (const key of Object.keys(masterListData as any)) {
    if (key === basePartNum || key.startsWith(basePartNum)) {
      console.log(`    Matched ${partNumber} → ${key}`)
      return (masterListData as any)[key]
    }
  }
  
  return null
}

/**
 * FIX #3: Include ALL columns from master list
 */
function createScheduleItem(
  masterData: any,
  projectItemNum: string,
  subLetter: string,
  quantity: string | number,
  voltage: any,
  isSubComponent: boolean
): ScheduleItem {
  let volts = masterData.volts
  let amps = masterData.amps
  
  if (masterData.phase === 3 || masterData.phase === '3') {
    volts = voltage['3phase']
  } else if (masterData.phase === 1 || masterData.phase === '1') {
    volts = voltage['1phase']
  }
  
  if (masterData.volts && masterData.amps && volts !== masterData.volts) {
    const power = masterData.volts * masterData.amps
    amps = (power / volts).toFixed(2)
  }
  
  return {
    itemNumber: subLetter ? `${projectItemNum}${subLetter}` : projectItemNum,
    partNumber: masterData.part_num,
    quantity: quantity || (isSubComponent ? '' : '#'),
    description: masterData.description,
    hp: masterData.hp || '-',
    phase: masterData.phase || '-',
    volts: volts || '-',
    amps: amps || '-',
    cb: masterData.cb || '-',
    // FIX #3: Include all columns
    port: masterData.port || null,
    cold: masterData.cold || null,
    hot: masterData.hot || null,
    reclaim: masterData.reclaim || null,
    galMin: masterData.gal_min || null,
    btuh: masterData.btuh || null,
    isSubComponent,
  }
}

function isMotor(item: ScheduleItem): boolean {
  const desc = item.description.toUpperCase()
  const hasMotorKeyword = desc.includes('MOTOR') || desc.includes('GEARMOTOR')
  const hasHP = item.hp && item.hp !== '-' && !isNaN(parseFloat(String(item.hp)))
  
  return hasMotorKeyword || hasHP
}
