# ⚡ Quick Start Guide

Get your Electrical Schedule Generator up and running in 5 minutes!

## 🎯 What This Tool Does

Converts PDF sales quotes → Electrical schedules in Excel format

**Before:** 15 minutes - 2 hours of manual work
**After:** 30 seconds automated

---

## 🚀 Getting Started

### Option 1: I Want to Deploy Online (Recommended)

**Best for:** Sharing with team, accessing anywhere

1. **Install Node.js:**
   - Download from https://nodejs.org
   - Install Node.js 18 or higher

2. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

3. **Navigate to Project:**
   ```bash
   cd electrical-schedule-generator
   ```

4. **Deploy:**
   ```bash
   vercel
   ```

5. **Follow prompts and get your URL!**

**Done!** Share the URL with your team.

---

### Option 2: I Want to Run Locally

**Best for:** Testing, development

1. **Install Dependencies:**
   ```bash
   cd electrical-schedule-generator
   npm install
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```

3. **Open Browser:**
   ```
   http://localhost:3000
   ```

**Done!** Use the tool locally.

---

## 📱 How to Use the Tool

### Step 1: Upload Quote
- Drag & drop PDF quote OR
- Click to browse and select file

### Step 2: Select Country
- Tool auto-detects from address
- Override if needed
- Selects correct voltage

### Step 3: Generate
- Click "Generate Electrical Schedule"
- Wait 5-10 seconds
- See progress bar

### Step 4: Download
- Click "Download Electrical Schedule"
- Get Excel file
- Import into CAD drawings

**That's it!** 🎉

---

## 📋 Sample Workflow

**Real-world example:**

1. Sales team sends you: `Quote_38388.pdf`
2. You upload to tool
3. Tool detects: Genius Car Wash, Florida, USA
4. Tool generates schedule with:
   - 45 equipment items
   - 17 motors (M-1 through M-17)
   - Correct 460V/120V for USA
   - All sub-components listed
5. You download: `Genius_Car_Wash_Schedule.xlsx`
6. You import into AutoCAD
7. **Saved 1.5 hours!**

---

## 🎓 Understanding the Output

### Excel Schedule Contains:

**Column B:** Project Item # (1, 2, 2A, 2B, 3, etc.)
**Column D:** Part Number (RC4, WACB2-EL-LPC, etc.)
**Column F:** Description (equipment name)
**Column G:** Horsepower
**Column H:** Phase (1 or 3)
**Column I:** Voltage (460V or 120V)
**Column J:** Amperage
**Columns K-Q:** Water, air, other specs

### Item Numbering System:

```
1    - Roller Correlator (main item)
2    - Belt Conveyor (main item)
2A   - Motor (sub-item of conveyor)
3    - Wrap Combo (main item)
3A   - Wrap motor #1 (sub-item)
3B   - Wrap motor #2 (sub-item)
3C   - Retract panel (sub-item)
3CA  - Solenoid valve (sub-sub-item)
```

### Motor Labeling:

```
M-1  - First motor in entire quote
M-2  - Second motor
M-3  - Third motor
...
M-17 - Seventeenth motor
```

This helps track total motor count for MCC sizing.

---

## 🌍 Country & Voltage Guide

| Country   | Use When Quote Ships To       | 3-Phase | 1-Phase |
|-----------|-------------------------------|---------|---------|
| USA       | Anywhere in United States     | 460V    | 120V    |
| Canada    | Canadian provinces            | 575V    | 120V    |
| Australia | Australia                     | 415V    | 240V    |
| UK        | United Kingdom, Ireland       | 415V    | 230V    |
| Mexico    | Mexico                        | 460V    | 127V    |

**Tool auto-detects based on "Ship To" address in PDF!**

---

## ⚠️ Common Issues & Solutions

### PDF Won't Upload

**Problem:** File rejected or error message

**Solutions:**
- ✅ Ensure file is PDF format
- ✅ Check file size < 10MB
- ✅ Make sure PDF isn't password-protected
- ✅ Try exporting quote again from QuickBooks

### Missing Equipment

**Problem:** "NOT IN MASTER LIST" appears

**Solutions:**
- ✅ Check part number spelling in quote
- ✅ Contact admin to add to master list
- ✅ Manually fill in that row in Excel

### Wrong Voltage

**Problem:** Shows 460V but should be 575V

**Solutions:**
- ✅ Change country selection before generating
- ✅ Verify address in PDF has country name
- ✅ Manually override country dropdown

### Schedule Won't Download

**Problem:** Download button doesn't work

**Solutions:**
- ✅ Check browser pop-up blocker
- ✅ Try different browser (Chrome recommended)
- ✅ Clear browser cache
- ✅ Refresh page and try again

---

## 💡 Pro Tips

### Tip 1: Batch Processing
Generate multiple schedules in one session - just upload, generate, download, repeat!

### Tip 2: Save Templates
Keep common equipment combos as reference. Tool will handle variations automatically.

### Tip 3: Motor Count Check
Always verify total motor count matches your manual count. Easy way to catch missing items!

### Tip 4: Voltage Verification
Double-check voltage matches the customer's country. Wrong voltage = expensive mistake!

### Tip 5: Keep PDFs Organized
Name PDFs clearly: `Quote_38388_GeniusCarWash.pdf` for easy reference.

---

## 📊 Master List Updates

### When to Update:

- New equipment released
- Part numbers change
- Specs updated
- New suppliers

### How to Update:

1. Edit `/public/data/master_list_complete.json`
2. Add new equipment following format
3. Redeploy (Vercel auto-deploys on git push)
4. Test with sample quote

**Format:**
```json
{
  "part_num": "NEW-PART-123",
  "description": "New Equipment Name",
  "hp": 5,
  "phase": 3,
  "volts": 460,
  "amps": 7,
  "is_sub_component": false,
  "parent": null
}
```

---

## 🤝 Getting Help

### Self-Service:
1. Check this guide first
2. Review README.md
3. Test with sample PDF
4. Check console for errors

### Need More Help?
- **Technical issues:** Contact developer
- **Master list updates:** Contact Josh
- **Quote questions:** Contact sales team

---

## ✅ Quality Checklist

Before sending schedule to customer:

- [ ] All equipment listed
- [ ] Motor count correct
- [ ] Voltage matches country
- [ ] Item numbers logical
- [ ] No "MANUAL ENTRY" flags
- [ ] Total amperage reasonable
- [ ] Sub-components properly nested
- [ ] File name clear and professional

---

## 🎯 Success Metrics

**You're doing great if:**
- ⚡ Schedules take < 1 minute to generate
- ✅ 95%+ equipment auto-found in master list
- 🎯 Zero voltage errors
- 😊 Team prefers tool over manual entry
- 💰 Saving 10+ hours per week

---

## 🎉 You're Ready!

Start generating schedules automatically!

**Remember:**
1. Upload PDF quote
2. Verify country
3. Generate schedule
4. Download Excel
5. Save 1-2 hours!

**Questions?** Review this guide or contact support.

**Happy Scheduling! ⚡**
