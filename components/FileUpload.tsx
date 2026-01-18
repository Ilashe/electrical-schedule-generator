'use client'

import { useCallback, useState } from 'react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  disabled?: boolean
}

export default function FileUpload({ onFileSelect, selectedFile, disabled }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0 && files[0].type === 'application/pdf') {
      onFileSelect(files[0])
    }
  }, [onFileSelect])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
    }
  }, [onFileSelect])

  return (
    <div
      className={`upload-zone rounded-xl p-8 text-center ${dragOver ? 'dragover' : ''} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />

      {selectedFile ? (
        <div className="space-y-2">
          <svg
            className="w-16 h-16 mx-auto text-green-500"
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
          <p className="text-lg font-semibold text-gray-900">{selectedFile.name}</p>
          <p className="text-sm text-gray-500">
            {(selectedFile.size / 1024).toFixed(2)} KB
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onFileSelect(null as any)
            }}
            className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
            disabled={disabled}
          >
            Remove file
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <svg
            className="w-16 h-16 mx-auto text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-lg font-semibold text-gray-900">
            Drop your PDF here or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supports PDF sales quotes from QuickBooks
          </p>
        </div>
      )}
    </div>
  )
}
