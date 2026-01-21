'use client'

import { useState } from 'react'
import FileUpload from '@/components/FileUpload'
import CountrySelector from '@/components/CountrySelector'
import ProcessingStatus from '@/components/ProcessingStatus'
import ResultsDisplay from '@/components/ResultsDisplay'
import SchedulePreview from '@/components/SchedulePreview'

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [country, setCountry] = useState('USA')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleFileSelect = (file: File) => {
    setPdfFile(file)
    setResult(null)
    setError(null)
  }

  const handleGenerate = async () => {
    if (!pdfFile) {
      setError('Please upload a PDF file first')
      return
    }

    setProcessing(true)
    setProgress(0)
    setError(null)

    try {
      // Step 1: Parse PDF in browser (20%)
      setProgress(20)
      const pdfText = await extractTextFromPDF(pdfFile)

      // Step 2: Send to API for processing (40%)
      setProgress(40)
      const response = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfText,
          country,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate schedule')
      }

      // Step 3: Receive results (80%)
      setProgress(80)
      const data = await response.json()

      // Add preview data (first 50 items)
      data.preview = data.items?.slice(0, 50).map((item: any, index: number) => ({
        itemNumber: item.itemNumber,
        partNumber: item.partNumber,
        description: item.description,
        hp: item.hp,
        phase: item.phase,
        volts: item.volts,
        amps: item.amps,
        motorLabel: item.motorLabel,
        isMain: !item.isSubComponent,
      }))

      // Step 4: Complete (100%)
      setProgress(100)
      setResult(data)
      setShowPreview(true) // Show preview modal

    } catch (err: any) {
      setError(err.message || 'An error occurred while processing')
    } finally {
      setProcessing(false)
    }
  }

  // Extract text from PDF using browser APIs via CDN
  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      
      // Load PDF.js from CDN (browser-compatible, no Node.js dependencies)
      // @ts-ignore
      if (!window.pdfjsLib) {
        console.log('Loading PDF.js from CDN...')
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
          script.onload = () => {
            console.log('PDF.js loaded successfully')
            resolve(true)
          }
          script.onerror = () => {
            console.error('Failed to load PDF.js')
            reject(new Error('Failed to load PDF library'))
          }
          document.head.appendChild(script)
        })
      }
      
      // @ts-ignore
      const pdfjsLib = window.pdfjsLib
      if (!pdfjsLib) {
        throw new Error('PDF.js library not available')
      }
      
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      
      console.log('Loading PDF document...')
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      console.log(`PDF loaded: ${pdf.numPages} pages`)
      
      let fullText = ''
      
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`Extracting page ${i}...`)
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item: any) => item.str).join(' ')
        fullText += pageText + '\n'
      }
      
      console.log(`Extracted ${fullText.length} characters from PDF`)
      
      if (fullText.length < 100) {
        throw new Error('PDF appears to be empty or text extraction failed')
      }
      
      return fullText
    } catch (error) {
      console.error('PDF extraction error:', error)
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDownload = () => {
    if (!result?.excelData) return

    try {
      // Convert base64 to blob
      const byteCharacters = atob(result.excelData)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      // Download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename || 'electrical-schedule.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError('Failed to download file')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Electrical Schedule Generator
          </h1>
          <p className="text-gray-600 text-lg">
            Automated electrical schedule generation from sales quotes
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Upload */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Step 1: Upload Sales Quote
            </h2>
            <FileUpload
              onFileSelect={handleFileSelect}
              selectedFile={pdfFile}
              disabled={processing}
            />
          </div>

          {/* Step 2: Country Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Step 2: Select Country/Region
            </h2>
            <CountrySelector
              value={country}
              onChange={setCountry}
              disabled={processing}
            />
          </div>

          {/* Generate Button */}
          <div className="mb-8">
            <button
              onClick={handleGenerate}
              disabled={!pdfFile || processing}
              className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all ${
                !pdfFile || processing
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {processing ? 'Generating Schedule...' : 'Generate Electrical Schedule'}
            </button>
          </div>

          {/* Processing Status */}
          {processing && (
            <ProcessingStatus progress={progress} />
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error: {error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <ResultsDisplay
              result={result}
              onDownload={handleDownload}
            />
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Powered by AVW Equipment Master List | Version 1.0</p>
          <p className="mt-2">
            Supports PDF quotes from QuickBooks | Auto-detects voltage based on country
          </p>
        </div>
      </div>

      {/* Schedule Preview Modal */}
      {showPreview && result && (
        <SchedulePreview
          data={result}
          onDownload={() => {
            setShowPreview(false)
            handleDownload()
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </main>
  )
}
