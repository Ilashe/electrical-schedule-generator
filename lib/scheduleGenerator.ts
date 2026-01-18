import { QuoteData } from './pdfParser'
import masterListData from '@/public/data/master_list_complete.json'
import voltageMap from '@/public/data/voltage_mappings.json'

export interface ScheduleItem {
  itemNumber: string
  partNumber: string
  quantity: string
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
  voltage: any
  items: ScheduleItem[]
  totalMotors: number
  totalAmps: number
}

/**
 * Generate electrical schedule from quote data
 */
export async function generateSchedule(quoteData: QuoteData, country: string): Promise<Schedule> {
  const voltage = (voltageMap as any)[country] || (voltageMap as any)['USA']
  const scheduleItems: ScheduleItem[] = []
  let motorCount = 0
  let mainItemNumber = 1

  // Process each item from the quote
  for (const quoteItem of quoteData.items) {
    // Look up equipment in master list
    const equipmentData = lookupEquipment(quoteItem.partNumber)

    if (!equipmentData || equipmentData.length === 0) {
      // Equipment not found - add placeholder
      scheduleItems.push({
        itemNumber: mainItemNumber.toString(),
        partNumber: quoteItem.partNumber,
        quantity: '#',
        description: quoteItem.description + ' [NOT IN MASTER LIST - MANUAL ENTRY REQUIRED]',
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
      mainItemNumber++
      continue
    }

    // Add main item and all sub-components
    let subItemLetter = ''
    let subSubItemLetter = ''

    for (let i = 0; i < equipmentData.length; i++) {
      const equipment = equipmentData[i]
      
      // Determine item numbering
      let itemNumber: string
      if (i === 0) {
        // Main item
        itemNumber = mainItemNumber.toString()
      } else {
        // Sub-item
        if (equipment.description.startsWith('--')) {
          // Sub-sub item (e.g., 5AA, 5AB)
          if (subSubItemLetter === '') {
            subSubItemLetter = 'A'
          } else {
            subSubItemLetter = String.fromCharCode(subSubItemLetter.charCodeAt(0) + 1)
          }
          itemNumber = mainItemNumber + subItemLetter + subSubItemLetter
        } else {
          // Regular sub-item (e.g., 5A, 5B)
          if (subItemLetter === '') {
            subItemLetter = 'A'
          } else {
            subItemLetter = String.fromCharCode(subItemLetter.charCodeAt(0) + 1)
          }
          subSubItemLetter = '' // Reset sub-sub counter
          itemNumber = mainItemNumber + subItemLetter
        }
      }

      // Apply voltage based on country
      let volts = equipment.volts
      let amps = equipment.amps

      if (equipment.phase === 3 || equipment.phase === '3') {
        volts = voltage['3phase']
      } else if (equipment.phase === 1 || equipment.phase === '1') {
        volts = voltage['1phase']
      }

      // Recalculate amps if voltage changed (rough approximation)
      if (equipment.volts && equipment.amps && volts !== equipment.volts) {
        const originalPower = equipment.volts * equipment.amps
        amps = (originalPower / volts).toFixed(2)
      }

      // Check if this is a motor
      let motorLabel: string | undefined
      if (isMotor(equipment.description, equipment.hp)) {
        motorCount++
        motorLabel = `M-${motorCount}`
      }

      scheduleItems.push({
        itemNumber,
        partNumber: equipment.part_num,
        quantity: i === 0 ? '#' : '',
        description: equipment.description,
        hp: equipment.hp || '-',
        phase: equipment.phase || '-',
        volts: volts || '-',
        amps: amps || '-',
        cb: equipment.cb || '-',
        port: equipment.port,
        cold: equipment.cold,
        hot: equipment.hot,
        reclaim: equipment.reclaim,
        galMin: equipment.gal_min,
        btuh: equipment.btuh,
        isSubComponent: equipment.is_sub_component,
        motorLabel,
      })
    }

    mainItemNumber++
  }

  // Calculate total amps
  const totalAmps = scheduleItems.reduce((sum, item) => {
    const amps = parseFloat(item.amps as string)
    return sum + (isNaN(amps) ? 0 : amps)
  }, 0)

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

/**
 * Look up equipment and its sub-components in master list
 */
function lookupEquipment(partNumber: string): any[] {
  const results: any[] = []
  let foundMain = false
  let collectingSubComponents = false

  for (const item of masterListData as any[]) {
    if (item.part_num === partNumber && !item.is_sub_component) {
      // Found main equipment
      results.push(item)
      foundMain = true
      collectingSubComponents = true
    } else if (collectingSubComponents && item.is_sub_component && item.parent === partNumber) {
      // This is a sub-component of the main equipment
      results.push(item)
    } else if (collectingSubComponents && !item.is_sub_component) {
      // Reached next main component, stop collecting
      break
    }
  }

  return results
}

/**
 * Determine if item is a motor
 */
function isMotor(description: string, hp: any): boolean {
  const descUpper = description.toUpperCase()
  
  // Check if description contains motor keywords
  if (descUpper.includes('-MOTOR') || descUpper.includes('MOTOR')) {
    return true
  }

  // Check if it has HP value (and it's not a dash)
  if (hp && hp !== '-' && !isNaN(parseFloat(hp))) {
    return true
  }

  return false
}
