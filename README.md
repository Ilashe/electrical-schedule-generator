# Electrical Schedule Generator

Automated electrical schedule generation tool for car wash equipment. Upload a PDF sales quote and get a complete electrical schedule in Excel format.

## 🚀 Features

- **PDF Quote Upload**: Drag & drop PDF sales quotes from QuickBooks
- **Auto Country Detection**: Automatically detects country from shipping address
- **Master List Integration**: 1,500+ equipment items with complete electrical specifications
- **Smart Voltage Mapping**: Automatically applies correct voltage based on country
- **Motor Counting**: Automatically counts and labels all motors (M-1, M-2, etc.)
- **Item Numbering**: Intelligent hierarchical numbering (1, 2A, 2AA, 3B, etc.)
- **Excel Output**: Professional Excel schedule ready for CAD import

## 📋 Supported Countries & Voltages

| Country       | 3-Phase | 1-Phase |
|---------------|---------|---------|
| USA           | 460V    | 120V    |
| Canada        | 575V    | 120V    |
| Australia     | 415V    | 240V    |
| UK            | 415V    | 230V    |
| Mexico        | 460V    | 127V    |

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PDF Processing**: pdf-parse
- **Excel Generation**: ExcelJS
- **Deployment**: Vercel

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
cd electrical-schedule-generator
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Run development server**
```bash
npm run dev
# or
yarn dev
```

4. **Open in browser**
```
http://localhost:3000
```

## 🌐 Deployment to Vercel

### Option 1: Deploy with Vercel CLI (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
cd electrical-schedule-generator
vercel
```

4. **Follow prompts:**
   - Set up and deploy? **Y**
   - Which scope? **Your account**
   - Link to existing project? **N**
   - Project name? **electrical-schedule-generator**
   - Directory? **./
   - Override settings? **N**

5. **Deploy to production**
```bash
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard

1. **Push code to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Go to Vercel Dashboard**
   - Visit: https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"

3. **Configure (if needed)**
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Option 3: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/electrical-schedule-generator)

## 📁 Project Structure

```
electrical-schedule-generator/
├── app/
│   ├── api/
│   │   └── generate-schedule/
│   │       └── route.ts          # API endpoint for schedule generation
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page
├── components/
│   ├── FileUpload.tsx            # PDF upload component
│   ├── CountrySelector.tsx       # Country selection
│   ├── ProcessingStatus.tsx      # Progress indicator
│   └── ResultsDisplay.tsx        # Results and download
├── lib/
│   ├── pdfParser.ts              # PDF extraction logic
│   ├── scheduleGenerator.ts      # Schedule generation logic
│   └── excelWriter.ts            # Excel file creation
├── public/
│   └── data/
│       ├── master_list_complete.json    # Equipment database
│       └── voltage_mappings.json        # Country voltage config
├── package.json
├── next.config.js
├── tsconfig.json
└── tailwind.config.js
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file (optional):

```env
NEXT_PUBLIC_APP_NAME=Electrical Schedule Generator
NEXT_PUBLIC_MAX_FILE_SIZE=10485760  # 10MB
```

### Update Master List

To update the equipment master list:

1. Edit `/public/data/master_list_complete.json`
2. Follow the existing structure:
```json
{
  "part_num": "PHE2-0315",
  "description": "DOUBLE PHOTO EYE",
  "hp": null,
  "phase": 1,
  "volts": 120,
  "amps": 0.5,
  "is_sub_component": false,
  "parent": null
}
```
3. Redeploy to Vercel

### Add New Country

1. Edit `/public/data/voltage_mappings.json`:
```json
{
  "NewCountry": {
    "3phase": 400,
    "1phase": 230
  }
}
```

2. Update `/components/CountrySelector.tsx`:
```typescript
const COUNTRIES = [
  // ...existing countries
  { code: 'NewCountry', name: 'New Country', voltage: '400V / 230V' },
]
```

## 📊 How It Works

1. **PDF Upload**: User uploads sales quote PDF
2. **Extraction**: Tool extracts equipment list and shipping address
3. **Country Detection**: Determines country from address
4. **Master List Lookup**: Finds each equipment item in master database
5. **Voltage Application**: Applies country-specific voltage
6. **Item Numbering**: Assigns hierarchical item numbers
7. **Motor Counting**: Identifies and labels all motors
8. **Excel Generation**: Creates formatted Excel schedule
9. **Download**: User downloads completed schedule

## 🧪 Testing

### Test with Sample Quote

A sample PDF quote is included for testing:
- File: `2d77ca87-6fa3-444d-a965-49d92f043cd9-TICKET_attachments-Est_38388.pdf`
- Project: Genius Car Wash
- Location: Pine Hills, FL (USA)
- Expected output: ~60 equipment items, 17 motors

### Manual Testing Checklist

- [ ] Upload PDF quote
- [ ] Verify country auto-detection
- [ ] Change country selection
- [ ] Generate schedule
- [ ] Download Excel file
- [ ] Verify all equipment listed
- [ ] Verify motor count
- [ ] Verify voltage values
- [ ] Verify item numbering

## 🐛 Troubleshooting

### PDF Not Parsing
- Ensure PDF is from QuickBooks
- Check PDF is not password-protected
- Verify file size < 10MB

### Equipment Not Found
- Check part number spelling
- Update master list if new equipment
- Check for missing items in console

### Wrong Voltage
- Verify country selection
- Check voltage mappings configuration
- Manually override if needed

## 📝 API Reference

### POST /api/generate-schedule

Generate electrical schedule from PDF quote.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `pdf`: File (PDF)
  - `country`: string (optional, e.g., "USA")

**Response:**
- Success: Excel file download (200)
- Error: JSON with error message (400/500)

## 🚀 Performance

- PDF Processing: ~2-5 seconds
- Schedule Generation: ~1-3 seconds
- Total Time: ~5-10 seconds
- Handles quotes with 100+ items

## 🔒 Security

- No data stored on server
- Processing happens in memory
- Files not saved to disk
- No authentication required (consider adding for production)

## 📈 Future Enhancements

- [ ] User authentication
- [ ] Save/load previous schedules
- [ ] Batch processing (multiple quotes)
- [ ] Custom master list per user
- [ ] Mobile app version
- [ ] Email delivery of schedules
- [ ] Integration with QuickBooks API

## 🤝 Contributing

To contribute:
1. Fork the repository
2. Create a feature branch
3. Make changes
4. Submit pull request

## 📄 License

Private - Express Carwash Equipment, LLC

## 👨‍💻 Support

For issues or questions:
- Email: support@example.com
- Documentation: See this README

## 🎉 Version History

### v1.0.0 (Current)
- Initial release
- PDF quote parsing
- Master list integration
- Excel generation
- Vercel deployment ready

---

**Built with ❤️ for Express Carwash Equipment**
