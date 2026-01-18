import { NextRequest, NextResponse } from 'next/server'
import { extractQuoteDataFromText } from '@/lib/pdfParser'
import { generateSchedule } from '@/lib/scheduleGenerator'
import { createExcelFile } from '@/lib/excelWriter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pdfText, country } = body

    if (!pdfText) {
      return NextResponse.json(
        { error: 'No PDF text provided' },
        { status: 400 }
      )
    }

    // Step 1: Extract data from PDF text (already extracted on client)
    const quoteData = extractQuoteDataFromText(pdfText)

    // Override country if provided, otherwise use detected
    const finalCountry = country || quoteData.country

    // Step 2: Generate schedule from quote data
    const schedule = await generateSchedule(quoteData, finalCountry)

    // Step 3: Create Excel file
    const excelBuffer = await createExcelFile(schedule, finalCountry)

    // Step 4: Convert to base64 for JSON response
    const base64Excel = excelBuffer.toString('base64')
    const filename = `${quoteData.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_Schedule.xlsx`

    return NextResponse.json({
      success: true,
      projectName: quoteData.projectName,
      totalItems: schedule.items.length,
      totalMotors: schedule.totalMotors,
      totalAmps: schedule.totalAmps,
      voltage: `${schedule.voltage['3phase']}V / ${schedule.voltage['1phase']}V`,
      filename,
      excelData: base64Excel,
    })

  } catch (error: any) {
    console.error('Error generating schedule:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate schedule' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const maxDuration = 60
