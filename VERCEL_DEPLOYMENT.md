# 🚀 Vercel Deployment Guide

Complete step-by-step guide to deploy the Electrical Schedule Generator to Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Git installed on your computer

## 📋 Method 1: Deploy via GitHub (Recommended)

This is the easiest and most maintainable approach.

### Step 1: Push Code to GitHub

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `electrical-schedule-generator`
   - Make it Private (recommended)
   - Don't initialize with README (we have one)
   - Click "Create repository"

2. **Push your code:**
```bash
cd electrical-schedule-generator

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Electrical Schedule Generator"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/electrical-schedule-generator.git

# Push
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel

1. **Go to Vercel:**
   - Visit https://vercel.com
   - Click "Sign Up" or "Log In"
   - Sign in with GitHub

2. **Import Project:**
   - Click "Add New..." → "Project"
   - You'll see "Import Git Repository"
   - Find `electrical-schedule-generator` in your repos
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** ./
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Environment Variables (Optional):**
   - Click "Environment Variables"
   - Add any custom env vars (none required for basic setup)

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live!

### Step 3: Get Your URL

After deployment:
- You'll get a URL like: `https://electrical-schedule-generator.vercel.app`
- Or: `https://electrical-schedule-generator-abc123.vercel.app`

### Step 4: Test the Deployment

1. Visit your URL
2. Upload the test PDF
3. Generate schedule
4. Download and verify Excel file

---

## 📋 Method 2: Deploy via Vercel CLI

For developers who prefer command-line.

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login

```bash
vercel login
```

Enter your email and verify.

### Step 3: Deploy

```bash
cd electrical-schedule-generator
vercel
```

**Answer the prompts:**
```
? Set up and deploy "~/electrical-schedule-generator"? [Y/n] Y
? Which scope do you want to deploy to? Your Account
? Link to existing project? [y/N] N
? What's your project's name? electrical-schedule-generator
? In which directory is your code located? ./
? Want to override the settings? [y/N] N
```

### Step 4: Deploy to Production

After testing preview:
```bash
vercel --prod
```

Your production URL will be displayed!

---

## 📋 Method 3: One-Click Deploy

Use the Vercel button for instant deployment.

### Step 1: Click Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/electrical-schedule-generator)

### Step 2: Configure

- Clone the repository to your GitHub
- Vercel will automatically configure
- Click "Deploy"

---

## 🎨 Custom Domain (Optional)

### Add Custom Domain

1. **In Vercel Dashboard:**
   - Go to your project
   - Click "Settings" → "Domains"
   - Add your domain: `schedule.yourcompany.com`

2. **Update DNS:**
   - Add CNAME record in your DNS:
   ```
   Type: CNAME
   Name: schedule
   Value: cname.vercel-dns.com
   ```

3. **Wait for SSL:**
   - Vercel auto-provisions SSL certificate
   - Usually takes 1-5 minutes

---

## 🔧 Configuration

### Environment Variables

Add in Vercel Dashboard under Settings → Environment Variables:

```env
# Optional configurations
NEXT_PUBLIC_APP_NAME=Electrical Schedule Generator
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
```

### Build Settings

Default settings work perfectly:
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Development Command:** `npm run dev`

---

## 🔄 Updating Your Deployment

### Automatic Deployments (GitHub Method)

Every push to `main` branch triggers auto-deployment:

```bash
# Make changes
git add .
git commit -m "Update master list"
git push

# Vercel automatically deploys!
```

### Manual Deployment (CLI Method)

```bash
vercel --prod
```

---

## 📊 Monitoring

### Vercel Dashboard

Monitor your app:
- **Analytics:** View usage stats
- **Logs:** Debug issues
- **Deployments:** See deployment history
- **Performance:** Monitor speed

Access at: https://vercel.com/dashboard

### View Logs

```bash
vercel logs [deployment-url]
```

---

## 🐛 Troubleshooting

### Build Fails

**Error:** "Module not found"
```bash
# Solution: Ensure all dependencies in package.json
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

**Error:** "Build exceeded maximum duration"
```bash
# Solution: Check for infinite loops or heavy processing
# Optimize code or contact Vercel support
```

### Runtime Errors

**Check logs:**
```bash
vercel logs --follow
```

**Common fixes:**
- Clear deployment cache in Vercel dashboard
- Redeploy: `vercel --prod --force`

### Large Files

Master list too big (>4.5MB)?
- Vercel has 4.5MB limit for serverless functions
- Solution: Move data to external storage (database/API)
- Or: Use Vercel Blob Storage

---

## 🚀 Performance Optimization

### Enable Caching

Add to `next.config.js`:
```javascript
const nextConfig = {
  compress: true,
  poweredByHeader: false,
}
```

### Add Loading States

Already implemented in components!

### Monitor Performance

Use Vercel Analytics:
- Enable in Dashboard → Analytics
- View Core Web Vitals
- Monitor response times

---

## 🔒 Security

### Recommended Settings

1. **Environment Variables:**
   - Store sensitive data in Vercel env vars
   - Never commit to Git

2. **Authentication (Future):**
   - Add NextAuth.js
   - Restrict access to authorized users

3. **Rate Limiting:**
   - Consider adding in API route
   - Prevent abuse

---

## 💰 Pricing

### Vercel Free Tier Includes:
- Unlimited deployments
- 100GB bandwidth/month
- Automatic SSL certificates
- Custom domains (unlimited)
- **Perfect for this tool!**

### If You Need More:
- Pro: $20/month
- Includes: More bandwidth, better support
- **Not needed for most cases**

---

## ✅ Post-Deployment Checklist

- [ ] App loads successfully
- [ ] PDF upload works
- [ ] Schedule generates correctly
- [ ] Excel downloads properly
- [ ] All countries work
- [ ] Mobile responsive
- [ ] Test with real quote PDFs
- [ ] Share URL with team
- [ ] Add to bookmarks
- [ ] Train users

---

## 📞 Support

### Vercel Support
- Documentation: https://vercel.com/docs
- Support: https://vercel.com/support
- Community: https://github.com/vercel/next.js/discussions

### This App Support
- Check README.md
- Review code comments
- GitHub Issues (if public repo)

---

## 🎉 Success!

Your Electrical Schedule Generator is now live!

**Your URL:** https://your-project.vercel.app

Share it with your team and start generating schedules automatically!

---

**Next Steps:**
1. Test with multiple quote PDFs
2. Share with engineering team
3. Gather feedback
4. Update master list as needed
5. Monitor usage in Vercel dashboard

**Enjoy your automated schedule generation! 🚀**
