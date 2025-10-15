# Assurance Remedial School Management System (PostgreSQL)

A professional web-based school management system with **PostgreSQL database** for production-ready deployment.

## 🌟 Key Features

### ✅ Production-Ready Database
- **PostgreSQL** - Industrial-strength relational database
- Connection pooling for better performance
- Proper indexing for fast queries
- ACID compliance and data integrity
- Scalable for thousands of records

### 🎨 Complete Functionality
- User authentication with email verification
- Student management (May/June & Nov/Dec enrollment)
- Staff management with subject assignments
- Fees management with receipt generation
- Dashboard with real-time statistics
- Yellow and blue professional design

## 📋 Prerequisites

### Required Software:
1. **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
2. **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
   - Windows: Use the installer from postgresql.org
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql postgresql-contrib`

## 🚀 Installation Guide

### Step 1: Install PostgreSQL

#### Windows:
1. Download PostgreSQL installer from https://www.postgresql.org/download/windows/
2. Run the installer
3. Remember the password you set for the `postgres` user
4. Default port is 5432 (keep it)

#### Mac:
```bash
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database

Open PostgreSQL command line (psql) and run:

```sql
CREATE DATABASE assurance_school;
```

Or from terminal:
```bash
# Windows (from psql):
createdb assurance_school

# Mac/Linux:
sudo -u postgres createdb assurance_school
```

### Step 3: Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=assurance_school
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   
   PORT=3000
   JWT_SECRET=change_this_to_a_random_secret_key
   
   # Email configuration (optional)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Setup Database Tables

```bash
npm run setup
```

This will create all necessary tables, indexes, and insert default data.

### Step 6: Start the Server

```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

### Step 7: Access the Application

Open your browser and go to:
```
http://localhost:3000
```

## 🗄️ Database Schema

The system creates the following PostgreSQL tables:

1. **users** - System users (administrators and accountants)
2. **students** - Student records with enrollment information
3. **staff** - Teacher/staff records
4. **subjects** - Available subjects (pre-populated)
5. **staff_subjects** - Staff-subject assignments
6. **staff_attendance** - Attendance tracking
7. **fees** - Fee payment records
8. **fee_structure** - Expected fees and balances

All tables include:
- Primary keys with auto-increment
- Foreign key constraints
- Check constraints for data validation
- Indexes for query optimization
- Timestamps for audit trails

## 🔧 Configuration

### Database Connection

Edit the `.env` file to configure your PostgreSQL connection:

```env
DB_HOST=localhost          # Database server address
DB_PORT=5432              # PostgreSQL port (default 5432)
DB_NAME=assurance_school  # Database name
DB_USER=postgres          # Database username
DB_PASSWORD=your_password # Database password
```

### Email Configuration

For email verification to work, configure your email settings:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**To get Gmail App Password:**
1. Enable 2-Step Verification on your Google Account
2. Go to: Google Account → Security → App passwords
3. Create a new app password for "Mail"
4. Use this password in `.env`

### Server Configuration

```env
PORT=3000                 # Server port
NODE_ENV=development      # Environment (development/production)
APP_URL=http://localhost:3000  # Application URL
JWT_SECRET=your_secret_key     # Change this in production!
```

## 📊 Features & Usage

### User Roles

**Administrator:**
- Full system access
- Add/edit/delete students and staff
- Record payments
- View all reports

**Accountant:**
- View students and staff (read-only)
- Record payments
- Generate receipts
- View payment history

### Student Management
- Add students with complete profiles
- Assign to enrollment categories (May/June or Nov/Dec)
- Track status (Active, Inactive, Graduated)
- Store parent/guardian information
- Search and filter capabilities

### Staff Management
- Add staff with qualifications
- Assign subjects to teachers
- Track attendance
- Manage staff status

### Fees Management
- Record payments with multiple methods
- Auto-generate unique receipt numbers
- Track pending balances
- Print professional receipts
- Payment history tracking

## 🔒 Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT tokens with expiration
- ✅ Email verification before login
- ✅ Role-based access control
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection
- ✅ HTTP-only cookies
- ✅ Environment variable configuration

## 🎨 Design

- Professional yellow (#FFD700) and blue (#4169E1) color scheme
- Responsive design (mobile, tablet, desktop)
- Modern UI with smooth animations
- User-friendly forms and modals
- Clean and intuitive interface

## 📁 Project Structure

```
assurance-school-postgres/
├── .env.example           # Environment variables template
├── .env                   # Your configuration (create this)
├── package.json           # Dependencies
├── database.js            # PostgreSQL connection pool
├── setup-database.js      # Database initialization script
├── server.js              # Main server with all API routes
└── public/
    ├── login.html         # Login page
    ├── signup.html        # Registration page
    ├── dashboard.html     # Main dashboard
    └── dashboard.js       # Frontend logic
```

## 🛠️ Troubleshooting

### Cannot connect to database

**Error:** `ECONNREFUSED` or `password authentication failed`

**Solutions:**
1. Make sure PostgreSQL is running:
   - Windows: Check Services for PostgreSQL
   - Mac: `brew services list`
   - Linux: `sudo systemctl status postgresql`

2. Verify credentials in `.env` file
3. Check if database exists: `psql -l`
4. Ensure port 5432 is not blocked by firewall

### Setup script fails

**Error:** Database connection error

**Solutions:**
1. Create the database manually:
   ```bash
   createdb assurance_school
   ```
2. Check PostgreSQL is running
3. Verify `.env` credentials
4. Check PostgreSQL logs for errors

### Port 3000 already in use

**Solution:** Change PORT in `.env` file or stop other applications using port 3000

### Email verification not working

**Solution:** Email is optional for testing. Configure EMAIL_USER and EMAIL_PASSWORD in `.env` for production use.

## 🔄 Database Backup

### Backup database:
```bash
pg_dump assurance_school > backup.sql
```

### Restore database:
```bash
psql assurance_school < backup.sql
```

## 🚀 Production Deployment

### Before deploying:

1. **Change JWT_SECRET** in `.env` to a strong random key
2. **Set NODE_ENV** to `production`
3. **Configure email** settings
4. **Setup SSL/HTTPS** for secure connections
5. **Use a process manager** like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name assurance-school
   pm2 save
   pm2 startup
   ```

### Recommended production setup:
- Use a cloud-hosted PostgreSQL (AWS RDS, Heroku Postgres, etc.)
- Enable SSL for database connections
- Use Nginx as reverse proxy
- Configure proper firewall rules
- Setup automated backups
- Monitor server logs

## 📈 Performance

PostgreSQL advantages:
- ✅ Handles concurrent users efficiently
- ✅ Connection pooling (20 connections)
- ✅ Indexed queries for fast searches
- ✅ Transaction support
- ✅ Scalable to millions of records
- ✅ Production-proven reliability

## 🆘 Support

### Common Issues:

1. **"Module not found"** → Run `npm install`
2. **Database errors** → Check PostgreSQL is running and credentials are correct
3. **Port conflicts** → Change PORT in `.env`
4. **Email not working** → Configure email settings or skip for testing

### Getting Help:

1. Check this README
2. Verify PostgreSQL is installed and running
3. Check `.env` configuration
4. Review server logs for error messages

## 📝 License

Created for Assurance Remedial School.

## 🎓 Credits

Developed with:
- Node.js & Express.js
- PostgreSQL (pg library)
- JWT for authentication
- bcrypt for password security
- Nodemailer for emails

---

**Version:** 1.0.0 (PostgreSQL)  
**Status:** Production-Ready  
**Database:** PostgreSQL 12+
#   s c h o o l - w e b  
 