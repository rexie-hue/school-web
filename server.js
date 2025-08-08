const express = require('express');
const ADODB = require('node-adodb');
const path = require('path');
const bcrypt = require('bcrypt');
const app = express();

// Database connection
let connection;
try {
    connection = ADODB.open('Provider=Microsoft.ACE.OLEDB.12.0;Data Source=school.accdb;');
    console.log('Database connection established.');
} catch (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Setup database
async function setupDatabase() {
    try {
        // Create users table
        await connection.query("SELECT TOP 1 * FROM users").catch(async () => {
            await connection.execute(`
                CREATE TABLE users (
                    id AUTOINCREMENT PRIMARY KEY,
                    name VARCHAR(255),
                    email VARCHAR(255),
                    password VARCHAR(255),
                    school VARCHAR(255),
                    role VARCHAR(50)
                )
            `);
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.execute(`
                INSERT INTO users (name, email, password, school, role)
                VALUES ('Admin User', 'admin@school.com', '${hashedPassword}', 'G & J Schools', 'admin');
                INSERT INTO users (name, email, password, school, role)
                VALUES ('Account User', 'account@school.com', '${hashedPassword}', 'G & J Schools', 'accountant');
                INSERT INTO users (name, email, password, school, role)
                VALUES ('Teacher User', 'teacher@school.com', '${hashedPassword}', 'G & J Schools', 'teacher');
                INSERT INTO users (name, email, password, school, role)
                VALUES ('Student User', 'student@school.com', '${hashedPassword}', 'G & J Schools', 'student');
            `);
            console.log('Users table created and populated.');
        });

        // Create students table
        await connection.query("SELECT TOP 1 * FROM students").catch(async () => {
            await connection.execute(`
                CREATE TABLE students (
                    id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(255),
                    email VARCHAR(255),
                    phone VARCHAR(50),
                    dob DATETIME,
                    class VARCHAR(50),
                    parent VARCHAR(255),
                    parentPhone VARCHAR(50),
                    address LONGTEXT,
                    status VARCHAR(50)
                )
            `);
            await connection.execute(`
                INSERT INTO students (id, name, email, phone, dob, class, parent, parentPhone, address, status)
                VALUES 
                    ('ST2023001', 'John Smith', 'john@example.com', '555-1234', #2012-03-12#, 'Grade 5A', 'Robert Smith', '555-4321', 'Accra, Ghana', 'Active');
            `);
            console.log('Students table created and populated.');
        });

        // Create staff table
        await connection.query("SELECT TOP 1 * FROM staff").catch(async () => {
            await connection.execute(`
                CREATE TABLE staff (
                    id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(255),
                    email VARCHAR(255),
                    phone VARCHAR(50),
                    subjects VARCHAR(255),
                    classes VARCHAR(255),
                    status VARCHAR(50)
                )
            `);
            await connection.execute(`
                INSERT INTO staff (id, name, email, phone, subjects, classes, status)
                VALUES ('SF2023001', 'Ms. Johnson', 'johnson@school.com', '555-5678', 'Mathematics,Science', 'Grade 5A,Grade 6B', 'Active');
            `);
            console.log('Staff table created and populated.');
        });

        // Create fees table
        await connection.query("SELECT TOP 1 * FROM fees").catch(async () => {
            await connection.execute(`
                CREATE TABLE fees (
                    id VARCHAR(50) PRIMARY KEY,
                    studentId VARCHAR(50),
                    amount DOUBLE,
                    dueDate DATETIME,
                    status VARCHAR(50)
                )
            `);
            await connection.execute(`
                INSERT INTO fees (id, studentId, amount, dueDate, status)
                VALUES ('INV001', 'ST2023001', 500, #2025-03-01#, 'paid');
            `);
            console.log('Fees table created and populated.');
        });

        // Create attendance table
        await connection.query("SELECT TOP 1 * FROM attendance").catch(async () => {
            await connection.execute(`
                CREATE TABLE attendance (
                    id AUTOINCREMENT PRIMARY KEY,
                    studentId VARCHAR(50),
                    date DATETIME,
                    status VARCHAR(50)
                )
            `);
            console.log('Attendance table created.');
        });

        // Create grades table
        await connection.query("SELECT TOP 1 * FROM grades").catch(async () => {
            await connection.execute(`
                CREATE TABLE grades (
                    id AUTOINCREMENT PRIMARY KEY,
                    studentId VARCHAR(50),
                    subject VARCHAR(50),
                    grade VARCHAR(10),
                    term VARCHAR(50)
                )
            `);
            await connection.execute(`
                INSERT INTO grades (studentId, subject, grade, term)
                VALUES ('ST2023001', 'Mathematics', 'A', 'Term 1');
            `);
            console.log('Grades table created and populated.');
        });

        // Create announcements table
        await connection.query("SELECT TOP 1 * FROM announcements").catch(async () => {
            await connection.execute(`
                CREATE TABLE announcements (
                    id AUTOINCREMENT PRIMARY KEY,
                    title VARCHAR(255),
                    message LONGTEXT,
                    datePosted DATETIME,
                    postedBy VARCHAR(255)
                )
            `);
            await connection.execute(`
                INSERT INTO announcements (title, message, datePosted, postedBy)
                VALUES ('Welcome Back', 'School resumes on Sept 1, 2025.', #2025-08-07#, 'Admin User');
            `);
            console.log('Announcements table created and populated.');
        });
    } catch (err) {
        console.error('Error setting up database:', err.message);
    }
}
setupDatabase();

// Register user
app.post('/register', async (req, res) => {
    const { name, email, password, school, role } = req.body;
    try {
        const rows = await connection.query(`SELECT * FROM users WHERE email = '${email}'`);
        if (rows.length > 0) {
            res.status(400).send('Email already registered');
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            await connection.execute(`
                INSERT INTO users (name, email, password, school, role)
                VALUES ('${name}', '${email}', '${hashedPassword}', '${school}', '${role}')
            `);
            res.send('User registered successfully');
        }
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).send(err.message);
    }
});

// Login user
app.post('/login', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        const rows = await connection.query(`SELECT * FROM users WHERE email = '${email}' AND role = '${role}'`);
        if (rows.length > 0) {
            const user = rows[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                res.json({ success: true, user: { name: user.name, email: user.email, school: user.school, role: user.role } });
            } else {
                res.json({ success: false, message: 'Invalid email, password, or role' });
            }
        } else {
            res.json({ success: false, message: 'Invalid email, password, or role' });
        }
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).send(err.message);
    }
});

// Add/Edit/View student
app.post('/add-student', async (req, res) => {
    const { id, name, email, phone, dob, class: studentClass, parent, parentPhone, address, status } = req.body;
    try {
        const rows = await connection.query(`SELECT * FROM students WHERE id = '${id}'`);
        if (rows.length > 0) {
            res.status(400).send('Student ID already exists');
        } else {
            await connection.execute(`
                INSERT INTO students (id, name, email, phone, dob, class, parent, parentPhone, address, status)
                VALUES ('${id}', '${name}', '${email}', '${phone}', #${dob}#, '${studentClass}', '${parent}', '${parentPhone}', '${address}', '${status}')
            `);
            res.send('Student added successfully');
        }
    } catch (err) {
        console.error('Add student error:', err.message);
        res.status(500).send(err.message);
    }
});

app.get('/students', async (req, res) => {
    try {
        const rows = await connection.query(`SELECT * FROM students`);
        res.json(rows);
    } catch (err) {
        console.error('Fetch students error:', err.message);
        res.status(500).send(err.message);
    }
});

// Add/Edit/View staff
app.post('/add-staff', async (req, res) => {
    const { id, name, email, phone, subjects, classes, status } = req.body;
    try {
        const rows = await connection.query(`SELECT * FROM staff WHERE id = '${id}'`);
        if (rows.length > 0) {
            res.status(400).send('Staff ID already exists');
        } else {
            await connection.execute(`
                INSERT INTO staff (id, name, email, phone, subjects, classes, status)
                VALUES ('${id}', '${name}', '${email}', '${phone}', '${subjects}', '${classes}', '${status}')
            `);
            res.send('Staff added successfully');
        }
    } catch (err) {
        console.error('Add staff error:', err.message);
        res.status(500).send(err.message);
    }
});

app.get('/staff', async (req, res) => {
    try {
        const rows = await connection.query(`SELECT * FROM staff`);
        res.json(rows);
    } catch (err) {
        console.error('Fetch staff error:', err.message);
        res.status(500).send(err.message);
    }
});

// Record fee payment
app.post('/add-fee', async (req, res) => {
    const { id, studentId, amount, dueDate, status } = req.body;
    try {
        const rows = await connection.query(`SELECT * FROM fees WHERE id = '${id}'`);
        if (rows.length > 0) {
            res.status(400).send('Fee ID already exists');
        } else {
            await connection.execute(`
                INSERT INTO fees (id, studentId, amount, dueDate, status)
                VALUES ('${id}', '${studentId}', ${amount}, #${dueDate}#, '${status}')
            `);
            res.send('Fee recorded successfully');
        }
    } catch (err) {
        console.error('Add fee error:', err.message);
        res.status(500).send(err.message);
    }
});

app.get('/fees', async (req, res) => {
    try {
        const rows = await connection.query(`SELECT * FROM fees`);
        res.json(rows);
    } catch (err) {
        console.error('Fetch fees error:', err.message);
        res.status(500).send(err.message);
    }
});

// Record attendance
app.post('/add-attendance', async (req, res) => {
    const { studentId, date, status } = req.body;
    try {
        await connection.execute(`
            INSERT INTO attendance (studentId, date, status)
            VALUES ('${studentId}', #${date}#, '${status}')
        `);
        res.send('Attendance recorded successfully');
    } catch (err) {
        console.error('Add attendance error:', err.message);
        res.status(500).send(err.message);
    }
});

app.get('/attendance', async (req, res) => {
    try {
        const rows = await connection.query(`SELECT * FROM attendance`);
        res.json(rows);
    } catch (err) {
        console.error('Fetch attendance error:', err.message);
        res.status(500).send(err.message);
    }
});

// Record grades
app.post('/add-grade', async (req, res) => {
    const { studentId, subject, grade, term } = req.body;
    try {
        await connection.execute(`
            INSERT INTO grades (studentId, subject, grade, term)
            VALUES ('${studentId}', '${subject}', '${grade}', '${term}')
        `);
        res.send('Grade recorded successfully');
    } catch (err) {
        console.error('Add grade error:', err.message);
        res.status(500).send(err.message);
    }
});

app.get('/grades', async (req, res) => {
    try {
        const rows = await connection.query(`SELECT * FROM grades`);
        res.json(rows);
    } catch (err) {
        console.error('Fetch grades error:', err.message);
        res.status(500).send(err.message);
    }
});

// Post announcement
app.post('/add-announcement', async (req, res) => {
    const { title, message, postedBy } = req.body;
    try {
        await connection.execute(`
            INSERT INTO announcements (title, message, datePosted, postedBy)
            VALUES ('${title}', '${message}', #${new Date().toISOString().split('T')[0]}#, '${postedBy}')
        `);
        res.send('Announcement posted successfully');
    } catch (err) {
        console.error('Add announcement error:', err.message);
        res.status(500).send(err.message);
    }
});

app.get('/announcements', async (req, res) => {
    try {
        const rows = await connection.query(`SELECT * FROM announcements ORDER BY datePosted DESC`);
        res.json(rows);
    } catch (err) {
        console.error('Fetch announcements error:', err.message);
        res.status(500).send(err.message);
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));