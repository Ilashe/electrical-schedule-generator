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
 * Generate electrical schedule from quote data
 * IMPORTANT: Skips duplicate items - only first occurrence is used
 */
export async function generateSchedule(quoteData: QuoteData, country: string): Promise<Schedule> {
  const voltage = (voltageMap as any)[country] || (voltageMap as any)['USA']
  const scheduleItems: ScheduleItem[] = []
  const notFoundItems: string[] = []
  const excludedItems: string[] = []
  const processedItems: Set<string> = new Set() // Track processed items to skip duplicates
  let motorCount = 0
  let projectItemNumber = 1

  console.log(`Generating schedule for ${quoteData.items.length} quote items...`)

  for (const quoteItem of quoteData.items) {
    console.log(`\nProcessing: ${quoteItem.partNumber}`)
    
    // Check if excluded
    if (shouldExcludeItem(quoteItem.partNumber)) {
      console.log(`  ❌ EXCLUDED: ${quoteItem.partNumber}`)
      excludedItems.push(`${quoteItem.partNumber} - ${quoteItem.description}`)
      continue
    }

    // SKIP DUPLICATES - only process each item once
    if (processedItems.has(quoteItem.partNumber)) {
      console.log(`  ⏭️  SKIPPING DUPLICATE: ${quoteItem.partNumber}`)
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

    // Mark as processed
    processedItems.add(quoteItem.partNumber)

    // Add main item
    const mainItem = createScheduleItem(
      masterItem.main,
      projectItemNumber.toString(),
      '',
      quoteItem.quantity || 1,
      voltage,
      false
    )
    
    scheduleItems.push(mainItem)

    if (isMotor(mainItem)) {
      motorCount++
      mainItem.motorLabel = `M-${motorCount}`
      mainItem.quantity = motorCount
    }

    // Add sub-components
    let subLetter = 'A'
    let i = 0
    
    while (i < masterItem.sub_components.length) {
      const currentSub = masterItem.sub_components[i]
      const nextSub = masterItem.sub_components[i + 1]
      
      // Check if BLOWER + MOTOR pair
      const isBlowerMotorPair = 
        currentSub.description.toUpperCase().includes('BLOWER') &&
        nextSub && 
        (nextSub.description.toUpperCase().includes('MOTOR') || nextSub.part_num.startsWith('M-') || nextSub.part_num === 'M')
      
      if (isBlowerMotorPair) {
        // Add blower (A, B, C...)
        const blowerItem = createScheduleItem(
          currentSub,
          projectItemNumber.toString(),
          subLetter,
          quoteItem.quantity || 1,
          voltage,
          true
        )
        scheduleItems.push(blowerItem)
        
        // Add motor (AA, BA, CA...)
        const motorItem = createScheduleItem(
          nextSub,
          projectItemNumber.toString(),
          subLetter + 'A',
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
        i += 2
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

  const duplicatesSkipped = quoteData.items.length - processedItems.size - notFoundItems.length - excludedItems.length

  console.log(`\n✓ Generated: ${scheduleItems.length} rows, ${motorCount} motors, ${totalAmps.toFixed(2)} amps`)
  console.log(`✓ Unique items: ${processedItems.size}`)
  console.log(`✓ Duplicates skipped: ${duplicatesSkipped}`)
  console.log(`✓ Not found: ${notFoundItems.length}`)
  console.log(`✓ Excluded: ${excludedItems.length}`)

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
