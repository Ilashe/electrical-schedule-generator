import ExcelJS from 'exceljs'
import { Schedule } from './scheduleGenerator'

/**
 * Create Excel file with electrical schedule matching exact format
 */
export async function createExcelFile(schedule: Schedule, country: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Schedule')

  // Set column widths to match template
  worksheet.columns = [
    { width: 5 },   // A - Sequential #
    { width: 15 },  // B - Project Item #
    { width: 5 },   // C - Sub-letter
    { width: 20 },  // D - Part #
    { width: 5 },   // E - Quantity
    { width: 50 },  // F - Description
    { width: 8 },   // G - HP
    { width: 8 },   // H - Phase
    { width: 8 },   // I - Volts
    { width: 8 },   // J - Amps
    { width: 8 },   // K - C.B.
    { width: 8 },   // L - Port
    { width: 8 },   // M - Cold
    { width: 8 },   // N - Hot
    { width: 10 },  // O - Reclaim
    { width: 10 },  // P - Gal/Min
    { width: 10 },  // Q - BTUH
  ]

  // Title row
  worksheet.mergeCells('A1:Q1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = `${schedule.projectName.toUpperCase()} - SCHEDULE REV 0`
  titleCell.font = { bold: true, size: 14 }
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' }

  // Subtitle row (Row 3)
  worksheet.mergeCells('A3:F3')
  const subtitleCell = worksheet.getCell('A3')
  subtitleCell.value = 'CAR  WASH  EQUIPMENT  LIST'
  subtitleCell.font = { bold: true, size: 12 }

  worksheet.mergeCells('G3:Q3')
  const equipReqCell = worksheet.getCell('G3')
  equipReqCell.value = 'EQUIPMENT REQUIREMENTS '
  equipReqCell.font = { bold: true, size: 12 }
  equipReqCell.alignment = { horizontal: 'center' }

  // Row 5 headers
  worksheet.mergeCells('G5:K5')
  const elecHeaderCell = worksheet.getCell('G5')
  elecHeaderCell.value = 'ELECTRICAL'
  elecHeaderCell.font = { bold: true }
  elecHeaderCell.alignment = { horizontal: 'center' }
  elecHeaderCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' }
  }

  worksheet.getCell('L5').value = 'AIR'
  worksheet.getCell('L5').font = { bold: true }
  worksheet.getCell('L5').alignment = { horizontal: 'center' }
  
  worksheet.mergeCells('M5:O5')
  const waterCell = worksheet.getCell('M5')
  waterCell.value = 'WATER'
  waterCell.font = { bold: true }
  waterCell.alignment = { horizontal: 'center' }
  
  worksheet.getCell('Q5').value = 'GAS'
  worksheet.getCell('Q5').font = { bold: true }
  worksheet.getCell('Q5').alignment = { horizontal: 'center' }

  // Column headers (Row 6)
  const headers = [
    '', 'PROJECT ITEM #', '', 'PART #', '#', 'DESCRIPTION',
    'HP', 'PHASE', 'VOLTS', 'AMPS', 'C.B.', 'PORT',
    'COLD', 'HOT', 'RECLAIM', 'GAL/MIN', '(BTUH)'
  ]

  headers.forEach((header, index) => {
    const cell = worksheet.getCell(6, index + 1)
    cell.value = header
    cell.font = { bold: true }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  })

  // Add data rows starting at row 7
  let currentRow = 7
  let sequentialNumber = 1

  for (const item of schedule.items) {
    const row = worksheet.getRow(currentRow)

    // Column A: Sequential number
    row.getCell(1).value = sequentialNumber

    // Column B: Project Item # (just the number part)
    const projectItemMatch = item.itemNumber.match(/^\d+/)
    row.getCell(2).value = projectItemMatch ? parseInt(projectItemMatch[0]) : item.itemNumber

    // Column C: Sub-item letter(s) (A, AA, AB, etc.)
    const subItemMatch = item.itemNumber.match(/\d+(.+)/)
    row.getCell(3).value = subItemMatch ? subItemMatch[1] : ''

    // Column D: Part #
    row.getCell(4).value = item.partNumber

    // Column E: Quantity - use motor label number if this is a motor, otherwise use quantity marker
    if (item.motorLabel) {
      const motorNum = item.motorLabel.replace('M-', '')
      row.getCell(5).value = parseInt(motorNum)
    } else {
      row.getCell(5).value = item.quantity || '1'
    }

    // Column F: Description
    row.getCell(6).value = item.description

    // Columns G-Q: Equipment specs
    row.getCell(7).value = item.hp          // HP
    row.getCell(8).value = item.phase       // Phase
    row.getCell(9).value = item.volts       // Volts
    row.getCell(10).value = item.amps       // Amps
    row.getCell(11).value = item.cb         // C.B.
    row.getCell(12).value = item.port       // Port
    row.getCell(13).value = item.cold       // Cold
    row.getCell(14).value = item.hot        // Hot
    row.getCell(15).value = item.reclaim    // Reclaim
    row.getCell(16).value = item.galMin     // Gal/Min
    row.getCell(17).value = item.btuh       // BTUH

    // Apply borders to all cells
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }

      // Center align most cells
      if (colNumber !== 6) { // Don't center description
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      } else {
        cell.alignment = { vertical: 'middle' }
      }
    })

    // Bold main items (those without sub-letters)
    if (!subItemMatch || !subItemMatch[1]) {
      row.font = { bold: true }
    }

    currentRow++
    sequentialNumber++
  }

  // Add totals row
  const totalRow = worksheet.getRow(currentRow + 2)
  totalRow.getCell(6).value = 'TOTAL'
  totalRow.getCell(6).font = { bold: true }
  totalRow.getCell(10).value = `Σ ${schedule.totalAmps}`
  totalRow.getCell(10).font = { bold: true }

  // Add notes section
  const notesRow = currentRow + 5
  worksheet.getCell(notesRow, 2).value = `Total Motors: ${schedule.totalMotors}`
  worksheet.getCell(notesRow + 1, 2).value = `Country: ${country}`
  worksheet.getCell(notesRow + 2, 2).value = `Voltage Configuration: ${schedule.voltage['3phase']}V (3Ø) / ${schedule.voltage['1phase']}V (1Ø)`
  worksheet.getCell(notesRow + 3, 2).value = `Generated: ${new Date().toLocaleDateString()}`

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
