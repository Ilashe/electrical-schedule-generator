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
  'RB1AMC-23-13',
  'RB1AMA-23-13',
  'TR1HB-82',
  'TR1-BUN-RED',
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
 * COMPLETE SOLUTION - Based on Genius Car Wash analysis
 */
export async function generateSchedule(quoteData: QuoteData, country: string): Promise<Schedule> {
  const voltage = (voltageMap as any)[country] || (voltageMap as any)['USA']
  const scheduleItems: ScheduleItem[] = []
  const notFoundItems: string[] = []
  const excludedItems: string[] = []
  const processedParts: Set<string> = new Set()
  const partOccurrences: { [key: string]: number } = {} // Track occurrences for duplicates
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

    // Skip duplicates UNLESS quote qty > 1
    if (processedParts.has(quoteItem.partNumber) && quoteItem.quantity <= 1) {
      console.log(`  ⏭️  SKIPPING DUPLICATE (Qty=1): ${quoteItem.partNumber}`)
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

    // Track occurrence for items with Qty > 1
    const mainPartNum = masterItem.main.part_num
    if (!partOccurrences[mainPartNum]) {
      partOccurrences[mainPartNum] = 0
    }
    partOccurrences[mainPartNum]++
    const occurrence = partOccurrences[mainPartNum]

    // Mark as processed
    processedParts.add(quoteItem.partNumber)

    // Add main item
    const mainItem = createScheduleItem(
      masterItem.main,
      projectItemNumber.toString(),
      '',
      occurrence,
      voltage,
      false
    )
    
    scheduleItems.push(mainItem)

    if (isMotor(mainItem)) {
      motorCount++
      mainItem.motorLabel = `M-${motorCount}`
      mainItem.quantity = motorCount
    }

    // SMART NESTING - Process sub-components with intelligent hierarchy
    processSubComponentsWithNesting(
      masterItem.sub_components,
      projectItemNumber,
      voltage,
      scheduleItems,
      (motor) => {
        motorCount++
        motor.motorLabel = `M-${motorCount}`
        motor.quantity = motorCount
        return motorCount
      }
    )

    projectItemNumber++
  }

  const totalAmps = scheduleItems.reduce((sum, item) => {
    const amps = parseFloat(String(item.amps))
    return sum + (isNaN(amps) ? 0 : amps)
  }, 0)

  console.log(`\n✓ Generated: ${scheduleItems.length} rows, ${motorCount} motors, ${totalAmps.toFixed(2)} amps`)
  console.log(`✓ Unique items: ${processedParts.size}`)
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

/**
 * SMART NESTING LOGIC - Based on Genius Car Wash pattern analysis
 */
function processSubComponentsWithNesting(
  subItems: any[],
  projectItemNum: number,
  voltage: any,
  scheduleItems: ScheduleItem[],
  registerMotor: (item: ScheduleItem) => number
): void {
  let currentLetter = 'A'
  let i = 0

  while (i < subItems.length) {
    const item = subItems[i]
    const nextItems = subItems.slice(i + 1, Math.min(i + 10, subItems.length))
    
    // Detect children based on smart rules
    const children = detectChildren(item, nextItems)
    
    if (children.length > 0) {
      // Add parent
      const parentItem = createScheduleItem(
        item,
        projectItemNum.toString(),
        currentLetter,
        1,
        voltage,
        true
      )
      scheduleItems.push(parentItem)
      
      if (isMotor(parentItem)) {
        registerMotor(parentItem)
      }
      
      // Add children with nested letters
      let childLetter = currentLetter + 'A'
      for (const child of children) {
        const childItem = createScheduleItem(
          child,
          projectItemNum.toString(),
          childLetter,
          '',
          voltage,
          true
        )
        scheduleItems.push(childItem)
        
        if (isMotor(childItem)) {
          registerMotor(childItem)
        }
        
        // Increment child letter (AA → AB → AC...)
        childLetter = incrementNestedLetter(childLetter)
      }
      
      i += 1 + children.length
    } else {
      // Standalone item
      const standaloneItem = createScheduleItem(
        item,
        projectItemNum.toString(),
        currentLetter,
        1,
        voltage,
        true
      )
      scheduleItems.push(standaloneItem)
      
      if (isMotor(standaloneItem)) {
        registerMotor(standaloneItem)
      }
      
      i++
    }
    
    // Increment to next letter (A → B → C...)
    currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1)
  }
}

/**
 * Detect which items are children of a parent based on patterns
 */
function detectChildren(parent: any, nextItems: any[]): any[] {
  const children: any[] = []
  const parentDesc = parent.description.toUpperCase()
  const parentPart = parent.part_num.toUpperCase()
  
  // RULE 1: BLOWER + MOTOR(s)
  if (parentDesc.includes('BLOWER') || parentPart.includes('BL0')) {
    if (nextItems[0] && isMotorItem(nextItems[0])) {
      children.push(nextItems[0])
    }
    return children
  }
  
  // RULE 2: PANEL/CONTROL + SOLENOID(s)
  if (parentDesc.includes('PANEL') || parentDesc.includes('CONTROL') || parentPart.includes('WA1P')) {
    for (const next of nextItems) {
      if (isSolenoid(next)) {
        children.push(next)
      } else {
        break
      }
    }
    return children
  }
  
  // RULE 3: ELECTRIC items (WA1-EL, CB2-EL) + MOTOR(s)
  if (parentDesc.includes('-EL') || parentDesc.includes('ELECTRIC') || parentPart.includes('-EL')) {
    for (const next of nextItems) {
      if (isMotorItem(next)) {
        children.push(next)
      } else {
        break
      }
    }
    return children
  }
  
  // RULE 4: WRAP items with MOTOR(s)
  if (parentDesc.includes('WRAP') && parentPart.startsWith('WA')) {
    for (const next of nextItems) {
      if (isMotorItem(next)) {
        children.push(next)
      } else {
        break
      }
    }
    return children
  }
  
  return children
}

/**
 * Increment nested letter: AA → AB → AC, ACA → ACB → ACC
 */
function incrementNestedLetter(letter: string): string {
  const lastChar = letter[letter.length - 1]
  const prefix = letter.slice(0, -1)
  
  if (lastChar === 'Z') {
    return prefix + 'AA'  // Overflow case (rare)
  }
  
  return prefix + String.fromCharCode(lastChar.charCodeAt(0) + 1)
}

/**
 * Better master list lookup
 */
function lookupMasterItem(partNumber: string): any {
  // Try exact match
  if ((masterListData as any)[partNumber]) {
    console.log(`    ✓ Exact match: ${partNumber}`)
    return (masterListData as any)[partNumber]
  }
  
  // Try with base part (before first dash)
  const basePart = partNumber.split('-')[0]
  
  for (const key of Object.keys(masterListData as any)) {
    // Check if key starts with the part number
    if (key.startsWith(partNumber) || partNumber.startsWith(key)) {
      console.log(`    ✓ Prefix match: ${partNumber} → ${key}`)
      return (masterListData as any)[key]
    }
  }
  
  // Try base match (3+ chars only to avoid false matches)
  if (basePart.length >= 3) {
    for (const key of Object.keys(masterListData as any)) {
      if (key.split('-')[0] === basePart) {
        console.log(`    ✓ Base match: ${partNumber} → ${key}`)
        return (masterListData as any)[key]
      }
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
    quantity: quantity || 1,
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
  return isMotorItem({ description: item.description, hp: item.hp, part_num: item.partNumber })
}

function isMotorItem(item: any): boolean {
  const desc = item.description.toUpperCase()
  const hasMotorKeyword = desc.includes('MOTOR') || desc.includes('GEARMOTOR')
  const hasHP = item.hp && item.hp !== '-' && !isNaN(parseFloat(String(item.hp)))
  
  return hasMotorKeyword || hasHP
}

function isSolenoid(item: any): boolean {
  const part = item.part_num.toUpperCase()
  const desc = item.description.toUpperCase()
  
  return part === 'SOL' || desc.includes('SOLENOID')
}
