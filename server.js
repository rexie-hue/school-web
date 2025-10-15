const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query } = require('./database');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'assurance_school_secret_key_2024';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Email configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to check if user is administrator
const isAdmin = (req, res, next) => {
  if (req.user.account_type !== 'Administrator') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
};

// ============ AUTHENTICATION ROUTES ============

// Sign Up
app.post('/api/auth/signup', [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('school_name').trim().notEmpty().withMessage('School name is required'),
  body('account_type').isIn(['Administrator', 'Accountant']).withMessage('Invalid account type')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { full_name, email, password, school_name, account_type } = req.body;

  try {
    // Check if user already exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();

    // Insert new user
    const result = await query(
      'INSERT INTO users (full_name, email, password, school_name, account_type, verification_token) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [full_name, email, hashedPassword, school_name, account_type, verificationToken]
    );

    // Send verification email
    const verificationLink = `${process.env.APP_URL || `http://localhost:${PORT}`}/api/auth/verify/${verificationToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Assurance School Account',
      html: `
        <h2>Welcome to Assurance Remedial School Management System!</h2>
        <p>Hi ${full_name},</p>
        <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
        <a href="${verificationLink}" style="background-color: #4169E1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
        <br>
        <p>Best regards,<br>Assurance Remedial School Team</p>
      `
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Email error:', error);
        } else {
          console.log('Verification email sent:', info.response);
        }
      });
    } else {
      console.log('Email not configured. Verification link:', verificationLink);
    }

    res.status(201).json({
      message: 'Account created successfully! Please check your email to verify your account.',
      userId: result.rows[0].id
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Email Verification
app.get('/api/auth/verify/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const result = await query(
      'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE verification_token = $1 RETURNING id',
      [token]
    );

    if (result.rows.length === 0) {
      return res.send('<h1>Invalid or Expired Link</h1><p>The verification link is invalid or has expired.</p>');
    }

    res.send(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #FFD700 0%, #4169E1 100%); margin: 0; }
            .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
            h1 { color: #4169E1; }
            a { background: #4169E1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✓ Email Verified Successfully!</h1>
            <p>Your account has been verified. You can now log in to the system.</p>
            <a href="/login.html">Go to Login</a>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).send('<h1>Verification Failed</h1><p>An error occurred during verification.</p>');
  }
});

// Login
app.post('/api/auth/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, account_type: user.account_type },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, { httpOnly: true, maxAge: 86400000 });
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        account_type: user.account_type,
        school_name: user.school_name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, full_name, email, school_name, account_type FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ STUDENT MANAGEMENT ROUTES ============

// Get all students
app.get('/api/students', authenticateToken, async (req, res) => {
  const { search, enrollment_category, status } = req.query;

  try {
    let queryText = 'SELECT * FROM students WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (search) {
      queryText += ` AND (full_name ILIKE $${paramCount} OR student_id ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (enrollment_category) {
      queryText += ` AND enrollment_category = $${paramCount}`;
      params.push(enrollment_category);
      paramCount++;
    }

    if (status) {
      queryText += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);
    res.json({ students: result.rows });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get single student
app.get('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM students WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ student: result.rows[0] });

  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Add new student
app.post('/api/students', authenticateToken, isAdmin, async (req, res) => {
  const {
    student_id, full_name, date_of_birth, gender, email, phone, address,
    parent_guardian_name, parent_guardian_phone, parent_guardian_email,
    enrollment_category, enrollment_date
  } = req.body;

  try {
    const result = await query(
      `INSERT INTO students (student_id, full_name, date_of_birth, gender, email, phone, address,
       parent_guardian_name, parent_guardian_phone, parent_guardian_email, enrollment_category, enrollment_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [student_id, full_name, date_of_birth, gender, email, phone, address,
       parent_guardian_name, parent_guardian_phone, parent_guardian_email, enrollment_category, enrollment_date]
    );

    res.status(201).json({ message: 'Student added successfully', studentId: result.rows[0].id });

  } catch (error) {
    console.error('Add student error:', error);
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Student ID already exists' });
    } else {
      res.status(500).json({ error: 'Failed to add student' });
    }
  }
});

// Update student
app.put('/api/students/:id', authenticateToken, isAdmin, async (req, res) => {
  const {
    student_id, full_name, date_of_birth, gender, email, phone, address,
    parent_guardian_name, parent_guardian_phone, parent_guardian_email,
    enrollment_category, enrollment_date, status
  } = req.body;

  try {
    const result = await query(
      `UPDATE students SET student_id = $1, full_name = $2, date_of_birth = $3, gender = $4, email = $5,
       phone = $6, address = $7, parent_guardian_name = $8, parent_guardian_phone = $9, 
       parent_guardian_email = $10, enrollment_category = $11, enrollment_date = $12, status = $13,
       updated_at = CURRENT_TIMESTAMP WHERE id = $14 RETURNING id`,
      [student_id, full_name, date_of_birth, gender, email, phone, address,
       parent_guardian_name, parent_guardian_phone, parent_guardian_email,
       enrollment_category, enrollment_date, status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student updated successfully' });

  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
app.delete('/api/students/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await query('DELETE FROM students WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// ============ STAFF MANAGEMENT ROUTES ============

// Get all staff
app.get('/api/staff', authenticateToken, async (req, res) => {
  const { search, status } = req.query;

  try {
    let queryText = 'SELECT * FROM staff WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (search) {
      queryText += ` AND (full_name ILIKE $${paramCount} OR staff_id ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      queryText += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);
    res.json({ staff: result.rows });

  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get single staff
app.get('/api/staff/:id', authenticateToken, async (req, res) => {
  try {
    const staffResult = await query('SELECT * FROM staff WHERE id = $1', [req.params.id]);

    if (staffResult.rows.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // Get assigned subjects
    const subjectsResult = await query(
      `SELECT s.* FROM subjects s
       INNER JOIN staff_subjects ss ON s.id = ss.subject_id
       WHERE ss.staff_id = $1`,
      [req.params.id]
    );

    const staff = staffResult.rows[0];
    staff.subjects = subjectsResult.rows;

    res.json({ staff });

  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Add new staff
app.post('/api/staff', authenticateToken, isAdmin, async (req, res) => {
  const {
    staff_id, full_name, email, phone, address, date_of_birth,
    gender, qualification, hire_date
  } = req.body;

  try {
    const result = await query(
      `INSERT INTO staff (staff_id, full_name, email, phone, address, date_of_birth, gender, qualification, hire_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [staff_id, full_name, email, phone, address, date_of_birth, gender, qualification, hire_date]
    );

    res.status(201).json({ message: 'Staff member added successfully', staffId: result.rows[0].id });

  } catch (error) {
    console.error('Add staff error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Staff ID or email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to add staff member' });
    }
  }
});

// Update staff
app.put('/api/staff/:id', authenticateToken, isAdmin, async (req, res) => {
  const {
    staff_id, full_name, email, phone, address, date_of_birth,
    gender, qualification, hire_date, status
  } = req.body;

  try {
    const result = await query(
      `UPDATE staff SET staff_id = $1, full_name = $2, email = $3, phone = $4, address = $5,
       date_of_birth = $6, gender = $7, qualification = $8, hire_date = $9, status = $10,
       updated_at = CURRENT_TIMESTAMP WHERE id = $11 RETURNING id`,
      [staff_id, full_name, email, phone, address, date_of_birth, gender, qualification, hire_date, status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({ message: 'Staff member updated successfully' });

  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
});

// Delete staff
app.delete('/api/staff/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await query('DELETE FROM staff WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({ message: 'Staff member deleted successfully' });

  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
});

// Get all subjects
app.get('/api/subjects', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM subjects ORDER BY subject_name');
    res.json({ subjects: result.rows });

  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Assign subject to staff
app.post('/api/staff/:id/subjects', authenticateToken, isAdmin, async (req, res) => {
  const { subject_id } = req.body;

  try {
    await query(
      'INSERT INTO staff_subjects (staff_id, subject_id) VALUES ($1, $2)',
      [req.params.id, subject_id]
    );

    res.status(201).json({ message: 'Subject assigned successfully' });

  } catch (error) {
    console.error('Assign subject error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Subject already assigned to this staff member' });
    } else {
      res.status(500).json({ error: 'Failed to assign subject' });
    }
  }
});

// Remove subject from staff
app.delete('/api/staff/:staffId/subjects/:subjectId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM staff_subjects WHERE staff_id = $1 AND subject_id = $2 RETURNING id',
      [req.params.staffId, req.params.subjectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'Subject removed successfully' });

  } catch (error) {
    console.error('Remove subject error:', error);
    res.status(500).json({ error: 'Failed to remove subject' });
  }
});

// Record staff attendance
app.post('/api/staff/attendance', authenticateToken, isAdmin, async (req, res) => {
  const { staff_id, attendance_date, status, notes } = req.body;

  try {
    await query(
      `INSERT INTO staff_attendance (staff_id, attendance_date, status, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (staff_id, attendance_date)
       DO UPDATE SET status = $3, notes = $4`,
      [staff_id, attendance_date, status, notes]
    );

    res.status(201).json({ message: 'Attendance recorded successfully' });

  } catch (error) {
    console.error('Record attendance error:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// ============ FEES MANAGEMENT ROUTES ============

// Get all fee payments
app.get('/api/fees', authenticateToken, async (req, res) => {
  const { student_id, academic_year, term } = req.query;

  try {
    let queryText = `
      SELECT f.*, s.full_name as student_name, s.student_id as student_number,
             u.full_name as recorded_by_name
      FROM fees f
      INNER JOIN students s ON f.student_id = s.id
      INNER JOIN users u ON f.recorded_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (student_id) {
      queryText += ` AND f.student_id = $${paramCount}`;
      params.push(student_id);
      paramCount++;
    }

    if (academic_year) {
      queryText += ` AND f.academic_year = $${paramCount}`;
      params.push(academic_year);
      paramCount++;
    }

    if (term) {
      queryText += ` AND f.term = $${paramCount}`;
      params.push(term);
      paramCount++;
    }

    queryText += ' ORDER BY f.payment_date DESC';

    const result = await query(queryText, params);
    res.json({ fees: result.rows });

  } catch (error) {
    console.error('Get fees error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Record new payment
app.post('/api/fees', authenticateToken, async (req, res) => {
  const {
    student_id, amount, payment_date, payment_method,
    academic_year, term, description
  } = req.body;

  const receipt_number = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    const result = await query(
      `INSERT INTO fees (student_id, amount, payment_date, payment_method, receipt_number,
       academic_year, term, description, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [student_id, amount, payment_date, payment_method, receipt_number,
       academic_year, term, description, req.user.id]
    );

    // Update fee structure balance
    await query(
      `UPDATE fee_structure 
       SET amount_paid = amount_paid + $1, balance = total_fees - (amount_paid + $1)
       WHERE student_id = $2 AND academic_year = $3 AND term = $4`,
      [amount, student_id, academic_year, term]
    );

    res.status(201).json({
      message: 'Payment recorded successfully',
      paymentId: result.rows[0].id,
      receipt_number
    });

  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// Get student balance
app.get('/api/fees/balance/:studentId', authenticateToken, async (req, res) => {
  const { academic_year, term } = req.query;

  try {
    const result = await query(
      `SELECT * FROM fee_structure WHERE student_id = $1 AND academic_year = $2 AND term = $3`,
      [req.params.studentId, academic_year, term]
    );

    if (result.rows.length === 0) {
      return res.json({ balance: 0, total_fees: 0, amount_paid: 0 });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Set fee structure for student
app.post('/api/fees/structure', authenticateToken, isAdmin, async (req, res) => {
  const { student_id, total_fees, academic_year, term } = req.body;

  try {
    await query(
      `INSERT INTO fee_structure (student_id, total_fees, balance, academic_year, term)
       VALUES ($1, $2, $2, $3, $4)
       ON CONFLICT ON CONSTRAINT fee_structure_pkey
       DO UPDATE SET total_fees = $2, balance = $2`,
      [student_id, total_fees, academic_year, term]
    );

    res.status(201).json({ message: 'Fee structure set successfully' });

  } catch (error) {
    console.error('Set fee structure error:', error);
    res.status(500).json({ error: 'Failed to set fee structure' });
  }
});

// Get payment receipt
app.get('/api/fees/receipt/:receiptNumber', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT f.*, s.full_name as student_name, s.student_id as student_number,
              s.enrollment_category, u.full_name as recorded_by_name
       FROM fees f
       INNER JOIN students s ON f.student_id = s.id
       INNER JOIN users u ON f.recorded_by = u.id
       WHERE f.receipt_number = $1`,
      [req.params.receiptNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    res.json({ receipt: result.rows[0] });

  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============ DASHBOARD STATISTICS ============

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    // Get total students
    const studentsResult = await query('SELECT COUNT(*) as total FROM students WHERE status = $1', ['Active']);
    const totalStudents = parseInt(studentsResult.rows[0].total);

    // Get total staff
    const staffResult = await query('SELECT COUNT(*) as total FROM staff WHERE status = $1', ['Active']);
    const totalStaff = parseInt(staffResult.rows[0].total);

    // Get total fees collected this month
    const revenueResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM fees 
       WHERE EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)`
    );
    const monthlyRevenue = parseFloat(revenueResult.rows[0].total);

    // Get pending balances
    const balanceResult = await query('SELECT COALESCE(SUM(balance), 0) as total FROM fee_structure WHERE balance > 0');
    const pendingBalances = parseFloat(balanceResult.rows[0].total);

    // Get enrollment categories distribution
    const distributionResult = await query(
      'SELECT enrollment_category, COUNT(*) as count FROM students WHERE status = $1 GROUP BY enrollment_category',
      ['Active']
    );

    res.json({
      stats: {
        totalStudents,
        totalStaff,
        monthlyRevenue,
        pendingBalances,
        enrollmentDistribution: distributionResult.rows
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🎓 Assurance School Management System (PostgreSQL)`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: PostgreSQL\n`);
});
