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
}

/**
 * Items to exclude from electrical schedule (non-electrical items)
 * These are the exact part numbers from quotes that should NOT appear in schedules
 */
const EXCLUDED_ITEMS = [
  'RC3DG-UHMW',                    // Guide rails
  'FGPIT-MOLD-K-4X12',             // Fiberglass grating
  'FGPIT-CLM-K',                   // Fiberglass closed grating
  'WA2F-0318',                     // Wrap stabilizer kit
  'WA1M-72-510-5220-CORE',         // Cores only (no electrical)
  'WA1M-00-510-5220-SS-CL-BL',     // Brushes only (no electrical)
  'CB1AMA-50-13-S-CL',             // Upper contour brush cloth only
  'CB1AMC-50-13',                  // Upper contour cores only
  'CB1AMA-23-13-S-CL',             // Lower contour brush cloth only
  'CB1AMC-23-13',                  // Lower contour cores only
  'MC1E-12W79L-S-CL-AVW-BL',       // Mitter curtains
  'MCC-460',                       // Motor control center (already included in main system)
  'MCC-5-460-VFD',                 // VFD control center (already included in main system)
  'DISPENSEIT-10-INJ-KIT',         // Injector kit only
  'COMP-FLTR-REG-3-4IN',           // Filter/regulator (accessory)
  'COMP-PRESS-GAUGE',              // Pressure gauge (accessory)
]

/**
 * Check if an item should be excluded from the schedule
 */
function shouldExcludeItem(partNumber: string): boolean {
  return EXCLUDED_ITEMS.some(excluded => partNumber.includes(excluded))
}

/**
 * Generate electrical schedule from quote data
 */
export async function generateSchedule(quoteData: QuoteData, country: string): Promise<Schedule> {
  const voltage = (voltageMap as any)[country] || (voltageMap as any)['USA']
  const scheduleItems: ScheduleItem[] = []
  let motorCount = 0
  let projectItemNumber = 1

  console.log(`Generating schedule for ${quoteData.items.length} quote items...`)

  // Process each item from the quote
  for (const quoteItem of quoteData.items) {
    console.log(`\nProcessing: ${quoteItem.partNumber}`)
    
    // Check if this item should be excluded
    if (shouldExcludeItem(quoteItem.partNumber)) {
      console.log(`  ❌ EXCLUDED (non-electrical): ${quoteItem.partNumber}`)
      continue
    }

    // Look up in master list
    const masterItem = lookupMasterItem(quoteItem.partNumber)
    
    if (!masterItem) {
      console.log(`  ⚠️  NOT FOUND in master list: ${quoteItem.partNumber}`)
      // Add placeholder
      scheduleItems.push({
        itemNumber: projectItemNumber.toString(),
        partNumber: quoteItem.partNumber,
        quantity: quoteItem.quantity || '#',
        description: `${quoteItem.description} [NOT IN MASTER LIST - VERIFY]`,
        hp: '-',
        phase: '-',
        volts: '-',
        amps: '-',
        cb: '-',
        port: null,
        cold: null,
        hot: null,
        reclaim: null,
        galMin: null,
        btuh: null,
        isSubComponent: false,
      })
      projectItemNumber++
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
      
      if (subComp.description.startsWith('--')) {
        if (!subSubLetter) subSubLetter = 'A'
        subItemLetter = subLetter + subSubLetter
        subSubLetter = String.fromCharCode(subSubLetter.charCodeAt(0) + 1)
      } else {
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

  console.log(`\n✓ Schedule: ${scheduleItems.length} rows, ${motorCount} motors, ${totalAmps.toFixed(2)} amps`)

  return {
    projectName: quoteData.projectName,
    acknowledgmentNumber: quoteData.acknowledgmentNumber,
    country,
    voltage,
    items: scheduleItems,
    totalMotors: motorCount,
    totalAmps: parseFloat(totalAmps.toFixed(2)),
  }
}

function lookupMasterItem(partNumber: string): any {
  if ((masterListData as any)[partNumber]) {
    return (masterListData as any)[partNumber]
  }
  
  const basePartNum = partNumber.split('-')[0]
  
  for (const key of Object.keys(masterListData as any)) {
    if (key.startsWith(basePartNum) || partNumber.startsWith(key)) {
      console.log(`    Matched ${partNumber} to ${key}`)
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
