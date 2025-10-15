const { pool } = require('./database');
require('dotenv').config();

async function setupDatabase() {
  console.log('Setting up Assurance School database...\n');

  try {
    // Create Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        school_name VARCHAR(255) NOT NULL,
        account_type VARCHAR(50) NOT NULL CHECK(account_type IN ('Administrator', 'Accountant')),
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created');

    // Create Students table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(10) CHECK(gender IN ('Male', 'Female')),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        parent_guardian_name VARCHAR(255),
        parent_guardian_phone VARCHAR(50),
        parent_guardian_email VARCHAR(255),
        enrollment_category VARCHAR(20) CHECK(enrollment_category IN ('MayJune', 'NovDec')),
        enrollment_date DATE,
        status VARCHAR(20) DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive', 'Graduated')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Students table created');

    // Create Staff table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        staff_id VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        date_of_birth DATE,
        gender VARCHAR(10) CHECK(gender IN ('Male', 'Female')),
        qualification VARCHAR(255),
        hire_date DATE,
        status VARCHAR(20) DEFAULT 'Active' CHECK(status IN ('Active', 'On Leave', 'Inactive')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Staff table created');

    // Create Subjects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        subject_name VARCHAR(255) NOT NULL,
        subject_code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Subjects table created');

    // Create Staff-Subject Assignment table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_subjects (
        id SERIAL PRIMARY KEY,
        staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
        subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        assigned_date DATE DEFAULT CURRENT_DATE,
        UNIQUE(staff_id, subject_id)
      )
    `);
    console.log('✓ Staff-Subjects table created');

    // Create Staff Attendance table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_attendance (
        id SERIAL PRIMARY KEY,
        staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
        attendance_date DATE NOT NULL,
        status VARCHAR(20) CHECK(status IN ('Present', 'Absent', 'Late', 'On Leave')),
        notes TEXT,
        UNIQUE(staff_id, attendance_date)
      )
    `);
    console.log('✓ Staff Attendance table created');

    // Create Fees table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fees (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_method VARCHAR(50) CHECK(payment_method IN ('Cash', 'Bank Transfer', 'Mobile Money', 'Cheque')),
        receipt_number VARCHAR(100) UNIQUE NOT NULL,
        academic_year VARCHAR(20),
        term VARCHAR(20),
        description TEXT,
        recorded_by INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Fees table created');

    // Create Fee Structure table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fee_structure (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        total_fees DECIMAL(10, 2) NOT NULL,
        amount_paid DECIMAL(10, 2) DEFAULT 0,
        balance DECIMAL(10, 2),
        academic_year VARCHAR(20),
        term VARCHAR(20)
      )
    `);
    console.log('✓ Fee Structure table created');

    // Insert default subjects
    const defaultSubjects = [
      ['Mathematics', 'MATH101', 'Core Mathematics'],
      ['English Language', 'ENG101', 'English Language and Literature'],
      ['Science', 'SCI101', 'Integrated Science'],
      ['Social Studies', 'SOC101', 'Social Studies'],
      ['ICT', 'ICT101', 'Information Communication Technology']
    ];

    for (const [name, code, desc] of defaultSubjects) {
      await pool.query(
        'INSERT INTO subjects (subject_name, subject_code, description) VALUES ($1, $2, $3) ON CONFLICT (subject_code) DO NOTHING',
        [name, code, desc]
      );
    }
    console.log('✓ Default subjects inserted');

    // Create indexes for better performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_students_enrollment ON students(enrollment_category)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_students_status ON students(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_fees_payment_date ON fees(payment_date)');
    console.log('✓ Indexes created');

    console.log('\n✅ Database setup completed successfully!');
    console.log('\nYou can now start the server with: npm start\n');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error('\nPlease make sure:');
    console.error('1. PostgreSQL is installed and running');
    console.error('2. Database credentials in .env file are correct');
    console.error('3. Database "assurance_school" exists (or create it with: createdb assurance_school)');
  } finally {
    await pool.end();
  }
}

// Run setup
setupDatabase();
