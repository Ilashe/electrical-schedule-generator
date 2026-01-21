'use client'

interface SchedulePreviewProps {
  data: any
  onDownload: () => void
  onClose: () => void
}

export default function SchedulePreview({ data, onDownload, onClose }: SchedulePreviewProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{data.projectName} - Schedule Preview</h2>
            <p className="text-sm text-gray-600 mt-1">
              {data.totalItems} items • {data.totalMotors} motors • {data.totalAmps} amps • {data.voltage}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Notifications */}
        {(data.notFoundItems?.length > 0 || data.excludedItems?.length > 0) && (
          <div className="p-4 border-b bg-yellow-50">
            {data.notFoundItems?.length > 0 && (
              <div className="mb-3">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  ⚠️ Items Not Found in Master List ({data.notFoundItems.length}):
                </h3>
                <ul className="text-sm text-yellow-700 space-y-1 max-h-32 overflow-y-auto">
                  {data.notFoundItems.map((item: string, i: number) => (
                    <li key={i} className="pl-4">• {item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {data.excludedItems?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">
                  🚫 Non-Electrical Items Excluded ({data.excludedItems.length}):
                </h3>
                <ul className="text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                  {data.excludedItems.map((item: string, i: number) => (
                    <li key={i} className="pl-4">• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Table Preview */}
        <div className="flex-1 overflow-auto p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="border border-gray-300 px-2 py-1 text-left w-12">#</th>
                  <th className="border border-gray-300 px-2 py-1 text-left w-16">Item</th>
                  <th className="border border-gray-300 px-2 py-1 text-left w-32">Part #</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Description</th>
                  <th className="border border-gray-300 px-2 py-1 text-center w-16">HP</th>
                  <th className="border border-gray-300 px-2 py-1 text-center w-16">Phase</th>
                  <th className="border border-gray-300 px-2 py-1 text-center w-16">Volts</th>
                  <th className="border border-gray-300 px-2 py-1 text-center w-16">Amps</th>
                </tr>
              </thead>
              <tbody>
                {data.preview?.map((row: any, i: number) => (
                  <tr key={i} className={row.isMain ? 'bg-gray-50 font-semibold' : ''}>
                    <td className="border border-gray-300 px-2 py-1 text-center text-xs">{i + 1}</td>
                    <td className="border border-gray-300 px-2 py-1">{row.itemNumber}</td>
                    <td className="border border-gray-300 px-2 py-1 font-mono text-xs">{row.partNumber}</td>
                    <td className="border border-gray-300 px-2 py-1">
                      {row.description}
                      {row.motorLabel && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 rounded">
                          {row.motorLabel}
                        </span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{row.hp}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{row.phase}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{row.volts}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{row.amps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <p>Preview showing first 50 rows. Full schedule will be in the Excel file.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={onDownload}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Download Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
