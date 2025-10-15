# 🚀 QUICK START GUIDE

## Assurance School Management System - PostgreSQL Version

Get up and running in **5 simple steps**!

---

## Step 1: Install PostgreSQL

### Windows:
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer
3. Remember the **password** you set for `postgres` user
4. Keep default port: **5432**

### Mac:
```bash
brew install postgresql
brew services start postgresql
```

### Linux:
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

## Step 2: Create Database

### Windows (PostgreSQL SQL Shell):
```sql
CREATE DATABASE assurance_school;
```

### Mac/Linux (Terminal):
```bash
sudo -u postgres createdb assurance_school
```

---

## Step 3: Configure

1. **Copy `.env.example` to `.env`**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** with your PostgreSQL password:
   ```env
   DB_PASSWORD=your_postgres_password_here
   ```

That's the minimum! Other settings have defaults.

---

## Step 4: Install & Setup

```bash
npm install
npm run setup
```

You should see:
```
✓ Users table created
✓ Students table created
✓ Staff table created
...
✅ Database setup completed successfully!
```

---

## Step 5: Start!

```bash
npm start
```

Open browser to: **http://localhost:3000**

---

## ✨ First Time Use

1. Click **"Sign Up"**
2. Fill in your details:
   - Full Name
   - Email
   - Password (min 6 characters)
   - Choose **"Administrator"** for full access
3. Click **"Create Account"**
4. **Login** with your credentials
5. Start managing!

---

## 🆘 Quick Troubleshooting

### "Cannot connect to database"
→ Make sure PostgreSQL is running  
→ Check password in `.env` matches your PostgreSQL password

### "Database does not exist"
→ Run: `createdb assurance_school`

### "Port 3000 already in use"
→ Change `PORT=3001` in `.env` file

### "npm is not recognized"
→ Install Node.js from https://nodejs.org/

---

## 📧 Email Setup (Optional)

For email verification, add to `.env`:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Get Gmail App Password:**
1. Google Account → Security → 2-Step Verification
2. App passwords → Create new
3. Copy password to `.env`

**Note:** Email is optional for testing!

---

## 🎯 What You Get

✅ Complete school management system  
✅ PostgreSQL database (production-ready!)  
✅ Student management (May/June & Nov/Dec)  
✅ Staff management with subjects  
✅ Fees management with receipts  
✅ Dashboard with statistics  
✅ Email verification  
✅ Professional yellow & blue design  

---

## 📖 Need More Help?

Check the **README.md** for:
- Detailed installation guide
- Full feature documentation
- Production deployment guide
- Troubleshooting tips

---

## ✅ Quick Verification

After setup, check that:
- [ ] PostgreSQL is installed and running
- [ ] Database `assurance_school` exists
- [ ] `.env` file has correct password
- [ ] `npm install` completed successfully
- [ ] `npm run setup` showed all ✓ marks
- [ ] `npm start` runs without errors
- [ ] Browser opens http://localhost:3000

---

**You're all set! Happy managing! 🎓**
