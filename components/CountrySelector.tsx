'use client'

interface CountrySelectorProps {
  value: string
  onChange: (country: string) => void
  disabled?: boolean
}

const COUNTRIES = [
  { code: 'USA', name: 'United States', voltage: '460V / 120V' },
  { code: 'Canada', name: 'Canada', voltage: '575V / 120V' },
  { code: 'Australia', name: 'Australia', voltage: '415V / 240V' },
  { code: 'UK', name: 'United Kingdom', voltage: '415V / 230V' },
  { code: 'Mexico', name: 'Mexico', voltage: '460V / 127V' },
]

export default function CountrySelector({ value, onChange, disabled }: CountrySelectorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {COUNTRIES.map((country) => (
          <button
            key={country.code}
            onClick={() => onChange(country.code)}
            disabled={disabled}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              value === country.code
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 bg-white'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="font-semibold text-gray-900">{country.name}</div>
            <div className="text-sm text-gray-600 mt-1">{country.voltage}</div>
          </button>
        ))}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> The tool will auto-detect country from the shipping address in your PDF,
          but you can override it here if needed.
        </p>
      </div>
    </div>
  )
}
