'use client'

interface ResultsDisplayProps {
  result: {
    projectName: string
    totalItems: number
    totalMotors: number
    totalAmps: number
    voltage: string
    filename: string
  }
  onDownload: () => void
}

export default function ResultsDisplay({ result, onDownload }: ResultsDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
        <svg
          className="w-16 h-16 mx-auto text-green-500 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Schedule Generated Successfully!
        </h3>
        <p className="text-gray-600">
          Your electrical schedule is ready to download
        </p>
      </div>

      {/* Project Summary */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Project Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Project</p>
            <p className="text-lg font-bold text-gray-900">{result.projectName}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Total Items</p>
            <p className="text-lg font-bold text-blue-600">{result.totalItems}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Total Motors</p>
            <p className="text-lg font-bold text-indigo-600">{result.totalMotors}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Total Amps</p>
            <p className="text-lg font-bold text-purple-600">{result.totalAmps}A</p>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={onDownload}
        className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span>Download Electrical Schedule</span>
      </button>

      {/* File Info */}
      <div className="text-center text-sm text-gray-600">
        <p>File: {result.filename}</p>
        <p className="mt-1">Ready to import into your CAD drawings</p>
      </div>
    </div>
  )
}
