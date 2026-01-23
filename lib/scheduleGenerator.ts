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
  'FGPIT-MOLD-K',
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
  'RB1AMC-23-13',  // Cores
  'RB1AMA-23-13',  // Brushes
  'TR1HB-82',      // Cores
  'TR1-BUN-RED',   // Brushes
]

function shouldExcludeItem(partNumber: string): boolean {
  return EXCLUDED_ITEMS.some(excluded => partNumber.includes(excluded))
}

export async function generateSchedule(quoteData: QuoteData, country: string): Promise<Schedule> {
  const voltage = (voltageMap as any)[country] || (voltageMap as any)['USA']
  const scheduleItems: ScheduleItem[] = []
  const notFoundItems: string[] = []
  const excludedItems: string[] = []
  const processedParts: Set<string> = new Set() // FIX #1: Track to skip duplicates
  let motorCount = 0
  let projectItemNumber = 1

  console.log(`Generating schedule for ${quoteData.items.length} quote items...`)

  for (const quoteItem of quoteData.items) {
    console.log(`\nProcessing: ${quoteItem.partNumber}`)
    
    // FIX #1: Skip duplicates - only first occurrence
    if (processedParts.has(quoteItem.partNumber)) {
      console.log(`  ⏭️  SKIPPING DUPLICATE: ${quoteItem.partNumber}`)
      continue
    }
    
    if (shouldExcludeItem(quoteItem.partNumber)) {
      console.log(`  ❌ EXCLUDED: ${quoteItem.partNumber}`)
      excludedItems.push(`${quoteItem.partNumber} - ${quoteItem.description}`)
      continue
    }

    // FIX #6: Better master list lookup
    const masterItem = lookupMasterItem(quoteItem.partNumber)
    
    if (!masterItem) {
      console.log(`  ⚠️  NOT FOUND - SKIPPING: ${quoteItem.partNumber}`)
      notFoundItems.push(`${quoteItem.partNumber} - ${quoteItem.description}`)
      continue
    }

    console.log(`  ✓ Found: ${masterItem.main.description}`)
    console.log(`    Sub-components: ${masterItem.sub_components.length}`)

    // Mark as processed
    processedParts.add(quoteItem.partNumber)

    // Add main item
    const mainItem = createScheduleItem(
      masterItem.main,
      projectItemNumber.toString(),
      '',
      quoteItem.quantity || 1,  // FIX #4: Use quote quantity
      voltage,
      false
    )
    
    scheduleItems.push(mainItem)

    // FIX #4: Motors get motor label, but keep original quantity
    if (isMotor(mainItem)) {
      motorCount++
      mainItem.motorLabel = `M-${motorCount}`
      mainItem.quantity = motorCount  // Motors show motor number
    }

    // FIX #5: Correct sub-item lettering with blower+motor pairing
    const subItems = masterItem.sub_components
    let subLetter = 'A'
    let i = 0
    
    while (i < subItems.length) {
      const currentSub = subItems[i]
      const nextSub = subItems[i + 1]
      
      // FIX #5: Check if BLOWER + MOTOR pair
      const isBlowerMotorPair = 
        currentSub.description.toUpperCase().includes('BLOWER') &&
        nextSub && 
        (nextSub.description.toUpperCase().includes('MOTOR') || 
         nextSub.part_num.startsWith('M-') || 
         nextSub.part_num === 'M')
      
      if (isBlowerMotorPair) {
        // Add blower with single letter (A, B, C...)
        const blowerItem = createScheduleItem(
          currentSub,
          projectItemNumber.toString(),
          subLetter,
          quoteItem.quantity || 1,
          voltage,
          true
        )
        scheduleItems.push(blowerItem)
        
        // Add motor with double letter (AA, BA, CA...)
        const motorItem = createScheduleItem(
          nextSub,
          projectItemNumber.toString(),
          subLetter + 'A',  // FIX #5: AA, BA, CA pattern
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
          quoteItem.quantity || 1,
          voltage,
          true
        )
        
        scheduleItems.push(subItem)
        
        if (isMotor(subItem)) {
          motorCount++
          subItem.motorLabel = `M-${motorCount}`
          subItem.quantity = motorCount
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
  console.log(`✓ Unique items: ${processedParts.size}`)
  console.log(`✓ Duplicates skipped: ${quoteData.items.length - processedParts.size - notFoundItems.length - excludedItems.length}`)
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

/**
 * FIX #6: More precise master list lookup
 */
function lookupMasterItem(partNumber: string): any {
  // Try exact match first
  if ((masterListData as any)[partNumber]) {
    console.log(`    Exact match: ${partNumber}`)
    return (masterListData as any)[partNumber]
  }
  
  // Try partial matches more carefully
  // Priority 1: Exact prefix match (OT2-BL1A-C should NOT match OT2-BL1C16x10)
  for (const key of Object.keys(masterListData as any)) {
    if (partNumber.startsWith(key) || key.startsWith(partNumber)) {
      console.log(`    Matched ${partNumber} → ${key}`)
      return (masterListData as any)[key]
    }
  }
  
  // Priority 2: Base part number (only first segment before dash)
  const basePartNum = partNumber.split('-')[0]
  for (const key of Object.keys(masterListData as any)) {
    const keyBase = key.split('-')[0]
    if (basePartNum === keyBase && basePartNum.length >= 3) {
      console.log(`    Base match ${partNumber} → ${key}`)
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
    quantity: quantity || (isSubComponent ? 1 : 1),
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
