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

/**
 * Items to exclude from electrical schedule (non-electrical items)
 */
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
 */
export async function generateSchedule(quoteData: QuoteData, country: string): Promise<Schedule> {
  const voltage = (voltageMap as any)[country] || (voltageMap as any)['USA']
  const scheduleItems: ScheduleItem[] = []
  const notFoundItems: string[] = []
  const excludedItems: string[] = []
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

    // Look up in master list
    const masterItem = lookupMasterItem(quoteItem.partNumber)
    
    if (!masterItem) {
      console.log(`  ⚠️  NOT FOUND - SKIPPING: ${quoteItem.partNumber}`)
      notFoundItems.push(`${quoteItem.partNumber} - ${quoteItem.description}`)
      continue
    }

    console.log(`  ✓ Found: ${masterItem.main.description}`)
    console.log(`    Sub-components: ${masterItem.sub_components.length}`)

    // Add main item
    const mainItem = createScheduleItem(
      masterItem.main,
      projectItemNumber.toString(),
      '',
      quoteItem.quantity || '#',
      voltage,
      false
    )
    
    scheduleItems.push(mainItem)

    if (isMotor(mainItem)) {
      motorCount++
      mainItem.motorLabel = `M-${motorCount}`
    }

    // Add sub-components
    let subLetter = 'A'
    let subSubLetter = ''
    
    for (const subComp of masterItem.sub_components) {
      let subItemLetter = ''
      
      // Determine level by counting leading dashes
      const desc = subComp.description
      if (desc.startsWith('--')) {
        // Level 2: AA, AB, AC
        if (!subSubLetter) subSubLetter = 'A'
        subItemLetter = subLetter + subSubLetter
        subSubLetter = String.fromCharCode(subSubLetter.charCodeAt(0) + 1)
      } else {
        // Level 1: A, B, C
        subItemLetter = subLetter
        subLetter = String.fromCharCode(subLetter.charCodeAt(0) + 1)
        subSubLetter = ''
      }
      
      const subItem = createScheduleItem(
        subComp,
        projectItemNumber.toString(),
        subItemLetter,
        '',
        voltage,
        true
      )
      
      scheduleItems.push(subItem)
      
      if (isMotor(subItem)) {
        motorCount++
        subItem.motorLabel = `M-${motorCount}`
        subItem.quantity = motorCount
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
  // Try exact match
  if ((masterListData as any)[partNumber]) {
    return (masterListData as any)[partNumber]
  }
  
  // Try base part number (before first dash)
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
    quantity: isSubComponent ? (quantity || '') : (quantity || '#'),
    description: masterData.description,
    hp: masterData.hp || '-',
    phase: masterData.phase || '-',
    volts: volts || '-',
    amps: amps || '-',
    cb: masterData.cb || '-',
    port: masterData.port,
    cold: masterData.cold,
    hot: masterData.hot,
    reclaim: masterData.reclaim,
    galMin: masterData.gal_min,
    btuh: masterData.btuh,
    isSubComponent,
  }
}

function isMotor(item: ScheduleItem): boolean {
  const desc = item.description.toUpperCase()
  const hasMotorKeyword = desc.includes('MOTOR') || desc.includes('GEARMOTOR')
  const hasHP = item.hp && item.hp !== '-' && !isNaN(parseFloat(String(item.hp)))
  
  return hasMotorKeyword || hasHP
}
