// Global variables
let currentUser = null;
let currentRole = 'admin';
let students = [];
let fees = [];

// Sample data
const sampleStudents = [
    {
        id: 'ST2023001',
        name: 'John Smith',
        class: 'Grade 5A',
        parent: 'Robert Smith',
        email: 'john@example.com',
        phone: '555-1234',
        status: 'Active',
        dob: '2012-03-12'
    },
    {
        id: 'ST2023002',
        name: 'Emma Johnson',
        class: 'Grade 6B',
        parent: 'Sarah Johnson',
        email: 'emma@example.com',
        phone: '555-5678',
        status: 'Active',
        dob: '2011-07-24'
    },
    {
        id: 'ST2023003',
        name: 'Michael Brown',
        class: 'Grade 7C',
        parent: 'James Brown',
        email: 'michael@example.com',
        phone: '555-9012',
        status: 'Inactive',
        dob: '2010-11-05'
    },
    {
        id: 'ST2023004',
        name: 'Sophia Davis',
        class: 'Grade 8A',
        parent: 'Thomas Davis',
        email: 'sophia@example.com',
        phone: '555-3456',
        status: 'Active',
        dob: '2009-05-18'
    },
    {
        id: 'ST2023005',
        name: 'William Wilson',
        class: 'Grade 9B',
        parent: 'Jennifer Wilson',
        email: 'william@example.com',
        phone: '555-7890',
        status: 'Pending',
        dob: '2008-09-30'
    }
];

const sampleFees = [
    {
        id: 'INV2023001',
        student: 'John Smith',
        class: 'Grade 5A',
        amount: 450.00,
        dueDate: '2023-08-15',
        status: 'paid'
    },
    {
        id: 'INV2023002',
        student: 'Emma Johnson',
        class: 'Grade 6B',
        amount: 450.00,
        dueDate: '2023-08-15',
        status: 'paid'
    },
    {
        id: 'INV2023003',
        student: 'Michael Brown',
        class: 'Grade 7C',
        amount: 450.00,
        dueDate: '2023-08-15',
        status: 'pending'
    },
    {
        id: 'INV2023004',
        student: 'Sophia Davis',
        class: 'Grade 8A',
        amount: 450.00,
        dueDate: '2023-08-15',
        status: 'overdue'
    },
    {
        id: 'INV2023005',
        student: 'William Wilson',
        class: 'Grade 9B',
        amount: 450.00,
        dueDate: '2023-08-15',
        status: 'paid'
    }
];

// DOM Elements
const signupPage = document.getElementById('signupPage');
const loginPage = document.getElementById('loginPage');
const dashboard = document.getElementById('dashboard');
const roleBadge = document.getElementById('roleBadge');
const signupBtn = document.getElementById('signupBtn');
const loginBtn = document.getElementById('loginBtn');
const showLogin = document.getElementById('showLogin');
const showSignup = document.getElementById('showSignup');
const logoutBtn = document.getElementById('logoutBtn');
const userProfileBtn = document.getElementById('userProfileBtn');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const viewAllStudents = document.getElementById('viewAllStudents');
const studentModal = document.getElementById('studentModal');
const paymentModal = document.getElementById('paymentModal');
const closeStudentModal = document.getElementById('closeStudentModal');
const closeStudentModalBtn = document.getElementById('closeStudentModalBtn');
const closePaymentModal = document.getElementById('closePaymentModal');
const closePaymentModalBtn = document.getElementById('closePaymentModalBtn');
const confirmPayment = document.getElementById('confirmPayment');
const toastNotification = document.getElementById('toastNotification');
const toastMessage = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');
const globalSearch = document.getElementById('globalSearch');
const feeTableBody = document.getElementById('feeTableBody');
const studentsTableBody = document.getElementById('studentsTableBody');
const saveStudentBtn = document.getElementById('saveStudentBtn');
const resetStudentForm = document.getElementById('resetStudentForm');
const totalStudents = document.getElementById('totalStudents');
const totalFees = document.getElementById('totalFees');
const receiptSection = document.getElementById('receiptSection');
const closeReceipt = document.getElementById('closeReceipt');
const printReceiptBtn = document.getElementById('printReceiptBtn');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check for logged-in user
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        signupPage.style.display = 'none';
        loginPage.style.display = 'none';
        dashboard.style.display = 'block';
        roleBadge.textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
        roleBadge.className = 'role-badge ' + currentUser.role;
        userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
        userName.textContent = currentUser.name;
    }

    // Initialize sample data
    students = [...sampleStudents];
    fees = [...sampleFees];
    
    // Populate students table
    populateStudentsTable();
    
    // Populate fees table
    populateFeesTable();
    
    // Update stats
    updateDashboardStats();
    
    // Role selection
    const roleOptions = document.querySelectorAll('.role-option');
    
    roleOptions.forEach(option => {
        option.addEventListener('click', function() {
            roleOptions.forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            currentRole = this.dataset.role;
        });
    });
    
    // Set admin as default
    document.querySelector('.role-option.admin').classList.add('selected');
    
    // Auth buttons
    signupBtn.addEventListener('click', handleSignup);
    loginBtn.addEventListener('click', handleLogin);
    
    // Show login/signup
    showLogin.addEventListener('click', () => {
        signupPage.style.display = 'none';
        loginPage.style.display = 'flex';
    });
    
    showSignup.addEventListener('click', () => {
        loginPage.style.display = 'none';
        signupPage.style.display = 'flex';
    });
    
    // Logout button
    logoutBtn.addEventListener('click', handleLogout);
    
    // View student details
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-student')) {
            const row = e.target.closest('tr');
            const studentId = row.cells[0].textContent;
            showStudentDetails(studentId);
        }
    });
    
    // Pay fee button
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('pay-fee') && !e.target.disabled) {
            const row = e.target.closest('tr');
            const feeId = row.cells[0].textContent;
            showPaymentForm(feeId);
        }
    });
    
    // Close modals
    closeStudentModal.addEventListener('click', () => studentModal.style.display = 'none');
    closeStudentModalBtn.addEventListener('click', () => studentModal.style.display = 'none');
    closePaymentModal.addEventListener('click', () => paymentModal.style.display = 'none');
    closePaymentModalBtn.addEventListener('click', () => paymentModal.style.display = 'none');
    
    // Confirm payment
    confirmPayment.addEventListener('click', handlePayment);
    
    // View all students
    viewAllStudents.addEventListener('click', () => {
        showToast('Loading all students...', 'info');
    });
    
    // Global search
    globalSearch.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.toLowerCase();
            if (searchTerm) {
                filterStudents(searchTerm);
                showToast(`Searching for: ${searchTerm}`, 'info');
            } else {
                populateStudentsTable();
            }
        }
    });
    
    // Save student
    saveStudentBtn.addEventListener('click', addNewStudent);
    
    // Reset student form
    resetStudentForm.addEventListener('click', () => {
        document.getElementById('addStudentForm').reset();
    });
    
    // Receipt actions
    closeReceipt.addEventListener('click', () => {
        receiptSection.style.display = 'none';
    });
    
    printReceiptBtn.addEventListener('click', printReceipt);
    
    // Initialize Charts
    initCharts();
    
    // Tab switching functionality
    initTabs();
    
    // Navigation functionality
    initNavigation();
});

// Functions
function handleSignup() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const school = document.getElementById('signupSchool').value;
    const role = document.querySelector('.role-option.selected').dataset.role;

    if (!name || !email || !password || !school) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, school, role })
    })
    .then(response => response.text())
    .then(text => {
        if (text === 'User registered successfully') {
            showToast('Account created successfully! Please sign in.', 'success');
            signupPage.style.display = 'none';
            loginPage.style.display = 'flex';
            document.getElementById('loginEmail').value = email;
        } else {
            showToast(text, 'error');
        }
    })
    .catch(err => {
        console.error(err);
        showToast('Error during signup', 'error');
    });
}

function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.querySelector('.role-option.selected').dataset.role;

    if (!email || !password) {
        showToast('Please enter both email and password', 'error');
        return;
    }

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            loginPage.style.display = 'none';
            dashboard.style.display = 'block';
            roleBadge.textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
            roleBadge.className = 'role-badge ' + currentUser.role;
            userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
            userName.textContent = currentUser.name;
            showToast(`Welcome, ${currentUser.name}!`, 'success');
            setRolePermissions();
        } else {
            showToast(data.message, 'error');
        }
    })
    .catch(err => {
        console.error(err);
        showToast('Error during login', 'error');
    });
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    loginPage.style.display = 'flex';
    dashboard.style.display = 'none';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    showToast('You have been logged out', 'info');
}

function handlePayment() {
    const paymentAmount = document.getElementById('paymentAmount').value;
    const paymentMethod = document.getElementById('paymentMethod').value;

    // Update fee status
    const overdueFee = feeTableBody.querySelector('tr:nth-child(4)');
    const statusCell = overdueFee.querySelector('.status');
    const payButton = overdueFee.querySelector('.pay-fee');

    statusCell.textContent = 'Paid';
    statusCell.className = 'status paid';
    payButton.textContent = 'Paid';
    payButton.disabled = true;

    // Update fee record in array
    const feeId = overdueFee.cells[0].textContent;
    const feeIndex = fees.findIndex(f => f.id === feeId);
    if (feeIndex !== -1) {
        fees[feeIndex].status = 'paid';
    }

    // Close modal
    paymentModal.style.display = 'none';

    // Show receipt
    showReceipt(feeId);

    // Update fees collected stat
    const feesStat = document.querySelector('.stat-card.fees .stat-info h3');
    const currentFees = parseFloat(feesStat.textContent.replace('GHS ', '').replace(',', ''));
    const newFees = currentFees + parseFloat(paymentAmount);
    feesStat.textContent = 'GHS ' + newFees.toLocaleString();

    // Show success message
    showToast(`Payment of GHS ${paymentAmount} recorded successfully!`, 'success');
}

function addNewStudent() {
    const name = document.getElementById('studentName').value;
    const email = document.getElementById('studentEmail').value;
    const phone = document.getElementById('studentPhone').value;
    const dob = document.getElementById('studentDOB').value;
    const studentClass = document.getElementById('studentClass').value;
    const parent = document.getElementById('parentName').value;
    const parentPhone = document.getElementById('parentPhone').value;
    const address = document.getElementById('studentAddress').value;

    if (!name || !email || !phone || !dob || !studentClass || !parent || !parentPhone) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    // Create new student
    const newStudent = {
        id: 'ST' + new Date().getTime().toString().substring(5),
        name: name,
        class: studentClass,
        parent: parent,
        email: email,
        phone: phone,
        status: 'Active',
        dob: dob,
        address: address
    };

    // Add to students array
    students.unshift(newStudent);

    // Update table
    populateStudentsTable();

    // Reset form
    document.getElementById('addStudentForm').reset();

    // Update stats
    updateDashboardStats();

    // Show success
    showToast(`Student ${name} added successfully!`, 'success');
}

function populateStudentsTable() {
    studentsTableBody.innerHTML = '';

    students.forEach(student => {
        const row = document.createElement('tr');

        // Determine status class
        let statusClass = 'paid';
        if (student.status === 'Inactive') statusClass = 'pending';
        if (student.status === 'Pending') statusClass = 'overdue';

        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.class}</td>
            <td>${student.parent}</td>
            <td>${student.email}</td>
            <td><span class="status ${statusClass}">${student.status}</span></td>
            <td><button class="action-btn outline view-student">View</button></td>
        `;

        studentsTableBody.appendChild(row);
    });
}

function populateFeesTable() {
    feeTableBody.innerHTML = '';

    fees.forEach(fee => {
        const row = document.createElement('tr');

        // Format date
        const dueDate = new Date(fee.dueDate);
        const formattedDate = dueDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        row.innerHTML = `
            <td>${fee.id}</td>
            <td>${fee.student}</td>
            <td>${fee.class}</td>
            <td>GHS ${fee.amount.toFixed(2)}</td>
            <td>${formattedDate}</td>
            <td><span class="status ${fee.status}">${fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}</span></td>
            <td>
                <button class="action-btn pay-fee" ${fee.status === 'paid' ? 'disabled' : ''}>
                    ${fee.status === 'paid' ? 'Paid' : 'Pay'}
                </button>
            </td>
        `;

        feeTableBody.appendChild(row);
    });
}

function updateDashboardStats() {
    totalStudents.textContent = students.length;

    // Calculate total fees
    const total = fees.reduce((sum, fee) => {
        return fee.status === 'paid' ? sum + fee.amount : sum;
    }, 0);

    totalFees.textContent = 'GHS ' + total.toLocaleString();
}

function showStudentDetails(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const modalBody = document.querySelector('#studentModal .modal-body');

    modalBody.innerHTML = `
        <div class="student-profile">
            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                <div class="user-avatar" style="width: 80px; height: 80px; font-size: 24px;">${student.name.charAt(0)}</div>
                <div>
                    <h2 style="margin-bottom: 5px;">${student.name}</h2>
                    <p>Student ID: ${student.id}</p>
                    <p>${student.class}</p>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Date of Birth</label>
                    <p>${new Date(student.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <p>${student.email}</p>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <p>${student.phone}</p>
                </div>
                <div class="form-group">
                    <label>Parent/Guardian</label>
                    <p>${student.parent}</p>
                </div>
                <div class="form-group">
                    <label>Parent Phone</label>
                    <p>${student.parentPhone || 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <p>${student.address || 'N/A'}</p>
                </div>
            </div>
            
            <div class="section-header" style="margin-top: 20px;">
                <div class="section-title">Academic Performance</div>
            </div>
            
            <table style="width: 100%; margin-top: 10px;">
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Grade</th>
                        <th>Attendance</th>
                        <th>Teacher</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Mathematics</td>
                        <td>A</td>
                        <td>95%</td>
                        <td>Ms. Johnson</td>
                    </tr>
                    <tr>
                        <td>English</td>
                        <td>B+</td>
                        <td>92%</td>
                        <td>Mr. Davis</td>
                    </tr>
                    <tr>
                        <td>Science</td>
                        <td>A-</td>
                        <td>98%</td>
                        <td>Dr. Wilson</td>
                    </tr>
                    <tr>
                        <td>History</td>
                        <td>B</td>
                        <td>90%</td>
                        <td>Mr. Thompson</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    studentModal.style.display = 'flex';
}

function showPaymentForm(feeId) {
    const fee = fees.find(f => f.id === feeId);
    if (!fee) return;

    const modalBody = document.querySelector('#paymentModal .modal-body');

    // Format due date
    const dueDate = new Date(fee.dueDate);
    const formattedDate = dueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    modalBody.innerHTML = `
        <div class="form-group">
            <label>Invoice ID</label>
            <p>${fee.id}</p>
        </div>
        <div class="form-group">
            <label>Student</label>
            <p>${fee.student} (${fee.class})</p>
        </div>
        <div class="form-group">
            <label>Amount Due</label>
            <p>GHS ${fee.amount.toFixed(2)}</p>
        </div>
        <div class="form-group">
            <label>Due Date</label>
            <p>${formattedDate} <span class="status ${fee.status}">${fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}</span></p>
        </div>
        
        <div class="form-group">
            <label for="paymentAmount">Payment Amount (GHS)</label>
            <input type="number" id="paymentAmount" class="form-control" value="${fee.amount.toFixed(2)}">
        </div>
        
        <div class="form-group">
            <label for="paymentMethod">Payment Method</label>
            <select id="paymentMethod" class="form-control">
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="credit">Credit Card</option>
                <option value="bank">Bank Transfer</option>
                <option value="mobile">Mobile Payment</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="paymentDate">Payment Date</label>
            <input type="date" id="paymentDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
        </div>
        
        <div class="form-group">
            <label for="paymentNotes">Notes</label>
            <textarea id="paymentNotes" class="form-control" rows="3" placeholder="Enter any additional notes"></textarea>
        </div>
    `;

    paymentModal.style.display = 'flex';
}

function showReceipt(feeId) {
    const fee = fees.find(f => f.id === feeId);
    if (!fee) return;

    // Set receipt details
    document.getElementById('receiptNumber').textContent = '#RC' + new Date().getTime().toString().substring(5);
    document.getElementById('receiptDate').textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('issuedBy').textContent = currentUser.name;
    document.getElementById('studentReceiptName').textContent = fee.student;
    document.getElementById('studentReceiptId').textContent = fee.id.replace('INV', 'ST');
    document.getElementById('studentReceiptClass').textContent = fee.class;
    document.getElementById('receiptTotal').textContent = 'GHS ' + fee.amount.toFixed(2);

    // Show receipt section
    receiptSection.style.display = 'block';

    // Scroll to receipt
    receiptSection.scrollIntoView({ behavior: 'smooth' });
}

function printReceipt() {
    const receiptContent = receiptSection.innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = receiptContent;
    window.print();

    document.body.innerHTML = originalContent;
    location.reload();
}

function filterStudents(searchTerm) {
    const filtered = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm) ||
        student.id.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm) ||
        student.class.toLowerCase().includes(searchTerm)
    );

    studentsTableBody.innerHTML = '';

    filtered.forEach(student => {
        const row = document.createElement('tr');

        // Determine status class
        let statusClass = 'paid';
        if (student.status === 'Inactive') statusClass = 'pending';
        if (student.status === 'Pending') statusClass = 'overdue';

        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.class}</td>
            <td>${student.parent}</td>
            <td>${student.email}</td>
            <td><span class="status ${statusClass}">${student.status}</span></td>
            <td><button class="action-btn outline view-student">View</button></td>
        `;

        studentsTableBody.appendChild(row);
    });
}

function showToast(message, type) {
    toastMessage.textContent = message;
    toastNotification.className = `toast ${type}`;
    toastIcon.className = `fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}`;
    toastNotification.classList.add('show');

    setTimeout(() => {
        toastNotification.classList.remove('show');
    }, 3000);
}

function initCharts() {
    // Enrollment Chart
    const enrollmentCtx = document.getElementById('enrollmentChart').getContext('2d');
    new Chart(enrollmentCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: '2023 Enrollment',
                data: [120, 190, 150, 200, 180, 220, 250, 280, 300, 320, 350, 380],
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Fee Collection Chart
    const feeCtx = document.getElementById('feeChart').getContext('2d');
    new Chart(feeCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [{
                label: 'Fee Collection (in GHS)',
                data: [12500, 14200, 11800, 15600, 17200, 16500, 18000],
                backgroundColor: 'rgba(76, 201, 240, 0.6)',
                borderColor: 'rgba(76, 201, 240, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            return 'GHS ' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.tab;
            if (filter === 'all') {
                populateFeesTable();
            } else {
                const filteredFees = fees.filter(fee => fee.status === filter);
                feeTableBody.innerHTML = '';
                filteredFees.forEach(fee => {
                    const row = document.createElement('tr');
                    const dueDate = new Date(fee.dueDate);
                    const formattedDate = dueDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    row.innerHTML = `
                        <td>${fee.id}</td>
                        <td>${fee.student}</td>
                        <td>${fee.class}</td>
                        <td>GHS ${fee.amount.toFixed(2)}</td>
                        <td>${formattedDate}</td>
                        <td><span class="status ${fee.status}">${fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}</span></td>
                        <td>
                            <button class="action-btn pay-fee" ${fee.status === 'paid' ? 'disabled' : ''}>
                                ${fee.status === 'paid' ? 'Paid' : 'Pay'}
                            </button>
                        </td>
                    `;
                    feeTableBody.appendChild(row);
                });
            }
        });
    });
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item:not(#logoutBtn)');
    const contentArea = document.getElementById('contentArea');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            const page = this.dataset.page;
            document.querySelector('.header-left .page-title').textContent = page.charAt(0).toUpperCase() + page.slice(1);
            
            if (page === 'dashboard') {
                contentArea.innerHTML = `
                    <div class="dashboard-overview">
                        <div class="stat-card students">
                            <div class="stat-icon">
                                <i class="fas fa-user-graduate"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="totalStudents">${students.length}</h3>
                                <p>Total Students</p>
                            </div>
                        </div>
                        <div class="stat-card teachers">
                            <div class="stat-icon">
                                <i class="fas fa-chalkboard-teacher"></i>
                            </div>
                            <div class="stat-info">
                                <h3>68</h3>
                                <p>Teachers</p>
                            </div>
                        </div>
                        <div class="stat-card fees">
                            <div class="stat-icon">
                                <i class="fas fa-money-bill-wave"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="totalFees">GHS ${fees.reduce((sum, fee) => fee.status === 'paid' ? sum + fee.amount : sum, 0).toLocaleString()}</h3>
                                <p>Total Fees Collected</p>
                            </div>
                        </div>
                        <div class="stat-card attendance">
                            <div class="stat-icon">
                                <i class="fas fa-clipboard-check"></i>
                            </div>
                            <div class="stat-info">
                                <h3>92%</h3>
                                <p>Attendance Rate</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="charts-container">
                        <div class="chart-card">
                            <div class="chart-header">
                                <div class="chart-title">Student Enrollment</div>
                                <div class="chart-actions">
                                    <button><i class="fas fa-sync"></i></button>
                                    <button><i class="fas fa-expand"></i></button>
                                </div>
                            </div>
                            <div class="chart-container">
                                <canvas id="enrollmentChart"></canvas>
                            </div>
                        </div>
                        <div class="chart-card">
                            <div class="chart-header">
                                <div class="chart-title">Fee Collection</div>
                                <div class="chart-actions">
                                    <button><i class="fas fa-sync"></i></button>
                                    <button><i class="fas fa-expand"></i></button>
                                </div>
                            </div>
                            <div class="chart-container">
                                <canvas id="feeChart"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <div class="recent-section">
                        <div class="section-header">
                            <div class="section-title">Recent Students</div>
                            <div class="view-all" id="viewAllStudents">View All</div>
                        </div>
                        <div class="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student ID</th>
                                        <th>Name</th>
                                        <th>Class</th>
                                        <th>Parent</th>
                                        <th>Contact</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody id="studentsTableBody"></tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="recent-section">
                        <div class="section-header">
                            <div class="section-title">Fee Records</div>
                            <div class="tabs">
                                <div class="tab active" data-tab="all">All Fees</div>
                                <div class="tab" data-tab="paid">Paid</div>
                                <div class="tab" data-tab="pending">Pending</div>
                                <div class="tab" data-tab="overdue">Overdue</div>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Invoice ID</th>
                                        <th>Student</th>
                                        <th>Class</th>
                                        <th>Amount</th>
                                        <th>Due Date</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody id="feeTableBody"></tbody>
                            </table>
                        </div>
                    </div>
                `;
                
                // Reinitialize tables and charts
                populateStudentsTable();
                populateFeesTable();
                initCharts();
                initTabs();
                
                // Reattach event listeners
                document.getElementById('viewAllStudents').addEventListener('click', () => {
                    showToast('Loading all students...', 'info');
                });
            } else if (page === 'students') {
                contentArea.innerHTML = `
                    <div class="form-container" id="addStudentForm">
                        <div class="form-title">Add New Student</div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="studentName">Full Name</label>
                                <input type="text" id="studentName" class="form-control" placeholder="Enter full name">
                            </div>
                            <div class="form-group">
                                <label for="studentEmail">Email Address</label>
                                <input type="email" id="studentEmail" class="form-control" placeholder="Enter email">
                            </div>
                            <div class="form-group">
                                <label for="studentPhone">Phone Number</label>
                                <input type="tel" id="studentPhone" class="form-control" placeholder="Enter phone number">
                            </div>
                            <div class="form-group">
                                <label for="studentDOB">Date of Birth</label>
                                <input type="date" id="studentDOB" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="studentClass">Class/Grade</label>
                                <select id="studentClass" class="form-control">
                                    <option value="">Select Class</option>
                                    <option value="grade5">Grade 5</option>
                                    <option value="grade6">Grade 6</option>
                                    <option value="grade7">Grade 7</option>
                                    <option value="grade8">Grade 8</option>
                                    <option value="grade9">Grade 9</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="parentName">Parent/Guardian Name</label>
                                <input type="text" id="parentName" class="form-control" placeholder="Enter parent/guardian name">
                            </div>
                            <div class="form-group">
                                <label for="parentPhone">Parent Phone</label>
                                <input type="tel" id="parentPhone" class="form-control" placeholder="Enter parent phone">
                            </div>
                            <div class="form-group">
                                <label for="studentAddress">Address</label>
                                <textarea id="studentAddress" class="form-control" rows="2" placeholder="Enter address"></textarea>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button class="action-btn outline" id="resetStudentForm">Reset</button>
                            <button class="action-btn" id="saveStudentBtn">Add Student</button>
                        </div>
                    </div>
                    
                    <div class="recent-section">
                        <div class="section-header">
                            <div class="section-title">All Students</div>
                        </div>
                        <div class="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student ID</th>
                                        <th>Name</th>
                                        <th>Class</th>
                                        <th>Parent</th>
                                        <th>Contact</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody id="studentsTableBody"></tbody>
                            </table>
                        </div>
                    </div>
                `;
                
                // Reinitialize student table
                populateStudentsTable();
                
                // Reattach event listeners
                document.getElementById('saveStudentBtn').addEventListener('click', addNewStudent);
                document.getElementById('resetStudentForm').addEventListener('click', () => {
                    document.getElementById('addStudentForm').reset();
                });
            } else {
                contentArea.innerHTML = `<div class="recent-section"><div class="section-title">${page.charAt(0).toUpperCase() + page.slice(1)} Page</div><p>Content for ${page} page is under construction.</p></div>`;
            }
            
            // Apply role-based permissions
            setRolePermissions();
        });
    });
}

function setRolePermissions() {
    if (!currentUser) return;

    const addStudentForm = document.getElementById('addStudentForm');
    const feeTableBody = document.getElementById('feeTableBody');

    if (currentUser.role === 'teacher') {
        // Hide add student form for teachers
        if (addStudentForm) {
            addStudentForm.style.display = 'none';
        }
        
        // Disable payment buttons for teachers
        if (feeTableBody) {
            const payButtons = feeTableBody.querySelectorAll('.pay-fee');
            payButtons.forEach(button => {
                button.disabled = true;
                button.classList.add('disabled');
            });
        }
    } else {
        // Show add student form for admin and accountant
        if (addStudentForm) {
            addStudentForm.style.display = 'block';
        }
        
        // Enable payment buttons for admin and accountant
        if (feeTableBody) {
            const payButtons = feeTableBody.querySelectorAll('.pay-fee');
            payButtons.forEach(button => {
                if (!fees.find(fee => fee.id === button.closest('tr').cells[0].textContent).status === 'paid') {
                    button.disabled = false;
                    button.classList.remove('disabled');
                }
            });
        }
    }
}