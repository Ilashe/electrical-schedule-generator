import ExcelJS from 'exceljs'
import { Schedule } from './scheduleGenerator'

/**
 * Create Excel file with electrical schedule
 */
export async function createExcelFile(schedule: Schedule, country: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Schedule')

  // Set column widths
  worksheet.columns = [
    { width: 5 },   // A
    { width: 15 },  // B - Project Item #
    { width: 3 },   // C
    { width: 20 },  // D - Part #
    { width: 5 },   // E - #
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
  titleCell.value = `"${schedule.projectName}" - SCHEDULE`
  titleCell.font = { bold: true, size: 14 }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

  // Subtitle row
  worksheet.mergeCells('A3:F3')
  const subtitleCell = worksheet.getCell('A3')
  subtitleCell.value = 'CAR  WASH  EQUIPMENT  LIST'
  subtitleCell.font = { bold: true, size: 12 }

  worksheet.mergeCells('G3:Q3')
  const equipReqCell = worksheet.getCell('G3')
  equipReqCell.value = 'EQUIPMENT REQUIREMENTS '
  equipReqCell.font = { bold: true, size: 12 }
  equipReqCell.alignment = { horizontal: 'center' }

  // Electrical header
  worksheet.mergeCells('G5:Q5')
  const elecHeaderCell = worksheet.getCell('G5')
  elecHeaderCell.value = 'ELECTRICAL'
  elecHeaderCell.font = { bold: true }
  elecHeaderCell.alignment = { horizontal: 'center' }
  elecHeaderCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' }
  }

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

  // Add data rows
  let currentRow = 7
  let lastMainItemRow = 7

  for (const item of schedule.items) {
    const row = worksheet.getRow(currentRow)

    // Apply shading to main items (non-sub-components)
    if (!item.isSubComponent) {
      lastMainItemRow = currentRow
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' }
        }
      })
    }

    // Set values
    row.getCell(2).value = item.itemNumber // Project Item #
    row.getCell(4).value = item.partNumber  // Part #
    row.getCell(5).value = item.quantity    // #
    row.getCell(6).value = item.description // Description
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

    // Apply borders
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

    // Bold main items
    if (!item.isSubComponent) {
      row.font = { bold: true }
    }

    // Add motor label in column A if applicable
    if (item.motorLabel) {
      row.getCell(1).value = item.motorLabel
      row.getCell(1).font = { italic: true, size: 9 }
    }

    currentRow++
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
