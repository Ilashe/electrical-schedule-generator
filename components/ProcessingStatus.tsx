'use client'

interface ProcessingStatusProps {
  progress: number
}

export default function ProcessingStatus({ progress }: ProcessingStatusProps) {
  const getStatusMessage = () => {
    if (progress < 30) return 'Extracting data from PDF...'
    if (progress < 50) return 'Looking up equipment in master list...'
    if (progress < 70) return 'Assigning item numbers and counting motors...'
    if (progress < 90) return 'Generating Excel schedule...'
    return 'Finalizing...'
  }

  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{getStatusMessage()}</span>
          <span className="text-sm font-semibold text-blue-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center space-x-2 text-gray-600">
        <svg
          className="animate-spin h-5 w-5 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm">Processing your quote...</span>
      </div>
    </div>
  )
}
