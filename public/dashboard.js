// Check authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
}

const user = JSON.parse(localStorage.getItem('user') || '{}');
const isAdmin = user.account_type === 'Administrator';

// Display user info
document.getElementById('userName').textContent = user.full_name || 'User';
document.getElementById('userRole').textContent = user.account_type || '';

// API helper function
async function apiCall(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return;
    }
    
    return response;
}

// Tab switching
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Load data based on tab
    if (tabName === 'dashboard') {
        loadDashboardStats();
    } else if (tabName === 'students') {
        loadStudents();
    } else if (tabName === 'staff') {
        loadStaff();
    } else if (tabName === 'fees') {
        loadFees();
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ============ DASHBOARD FUNCTIONS ============

async function loadDashboardStats() {
    try {
        const response = await apiCall('/api/dashboard/stats');
        const data = await response.json();
        
        if (data.stats) {
            document.getElementById('totalStudents').textContent = data.stats.totalStudents;
            document.getElementById('totalStaff').textContent = data.stats.totalStaff;
            document.getElementById('monthlyRevenue').textContent = `GH₵ ${data.stats.monthlyRevenue.toFixed(2)}`;
            document.getElementById('pendingBalances').textContent = `GH₵ ${data.stats.pendingBalances.toFixed(2)}`;
            
            // Display enrollment distribution
            let enrollmentHTML = '<div style="display: flex; gap: 20px; flex-wrap: wrap;">';
            data.stats.enrollmentDistribution.forEach(item => {
                enrollmentHTML += `
                    <div style="flex: 1; min-width: 200px; padding: 20px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 8px;">
                        <h3 style="font-size: 18px; margin-bottom: 10px;">${item.enrollment_category}</h3>
                        <p style="font-size: 32px; font-weight: bold; color: #4169E1;">${item.count}</p>
                        <p style="color: #666;">Students</p>
                    </div>
                `;
            });
            enrollmentHTML += '</div>';
            document.getElementById('enrollmentDistribution').innerHTML = enrollmentHTML;
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// ============ STUDENT FUNCTIONS ============

async function loadStudents() {
    const search = document.getElementById('studentSearch').value;
    const enrollment = document.getElementById('enrollmentFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    let url = '/api/students?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (enrollment) url += `enrollment_category=${enrollment}&`;
    if (status) url += `status=${status}&`;
    
    try {
        const response = await apiCall(url);
        const data = await response.json();
        
        if (data.students && data.students.length > 0) {
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Full Name</th>
                            <th>Enrollment Category</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.students.forEach(student => {
                let statusClass = 'success';
                if (student.status === 'Inactive') statusClass = 'danger';
                if (student.status === 'Graduated') statusClass = 'info';
                
                html += `
                    <tr>
                        <td>${student.student_id}</td>
                        <td>${student.full_name}</td>
                        <td><span class="badge badge-warning">${student.enrollment_category}</span></td>
                        <td><span class="badge badge-${statusClass}">${student.status}</span></td>
                        <td class="action-buttons">
                            <button class="btn btn-sm btn-primary" onclick="viewStudent(${student.id})">View</button>
                            ${isAdmin ? `
                                <button class="btn btn-sm btn-warning" onclick="editStudent(${student.id})">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id})">Delete</button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            document.getElementById('studentsList').innerHTML = html;
        } else {
            document.getElementById('studentsList').innerHTML = `
                <div class="empty-state">
                    <p>No students found</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading students:', error);
        document.getElementById('studentsList').innerHTML = '<p>Error loading students</p>';
    }
}

function searchStudents() {
    loadStudents();
}

function showAddStudentModal() {
    if (!isAdmin) {
        alert('Only administrators can add students');
        return;
    }
    
    document.getElementById('studentModalTitle').textContent = 'Add Student';
    document.getElementById('studentForm').reset();
    document.getElementById('studentId').value = '';
    document.getElementById('studentStatusGroup').style.display = 'none';
    document.getElementById('studentModal').classList.add('show');
}

async function viewStudent(id) {
    try {
        const response = await apiCall(`/api/students/${id}`);
        const data = await response.json();
        
        if (data.student) {
            const s = data.student;
            alert(`
Student Details:
----------------
Student ID: ${s.student_id}
Name: ${s.full_name}
Date of Birth: ${s.date_of_birth || 'N/A'}
Gender: ${s.gender || 'N/A'}
Email: ${s.email || 'N/A'}
Phone: ${s.phone || 'N/A'}
Address: ${s.address || 'N/A'}
Parent/Guardian: ${s.parent_guardian_name || 'N/A'}
Parent Phone: ${s.parent_guardian_phone || 'N/A'}
Parent Email: ${s.parent_guardian_email || 'N/A'}
Enrollment: ${s.enrollment_category}
Enrollment Date: ${s.enrollment_date || 'N/A'}
Status: ${s.status}
            `);
        }
    } catch (error) {
        console.error('Error viewing student:', error);
    }
}

async function editStudent(id) {
    if (!isAdmin) {
        alert('Only administrators can edit students');
        return;
    }
    
    try {
        const response = await apiCall(`/api/students/${id}`);
        const data = await response.json();
        
        if (data.student) {
            const s = data.student;
            document.getElementById('studentModalTitle').textContent = 'Edit Student';
            document.getElementById('studentId').value = s.id;
            document.getElementById('student_id').value = s.student_id;
            document.getElementById('student_full_name').value = s.full_name;
            document.getElementById('date_of_birth').value = s.date_of_birth || '';
            document.getElementById('gender').value = s.gender || '';
            document.getElementById('student_email').value = s.email || '';
            document.getElementById('student_phone').value = s.phone || '';
            document.getElementById('student_address').value = s.address || '';
            document.getElementById('parent_guardian_name').value = s.parent_guardian_name || '';
            document.getElementById('parent_guardian_phone').value = s.parent_guardian_phone || '';
            document.getElementById('parent_guardian_email').value = s.parent_guardian_email || '';
            document.getElementById('enrollment_category').value = s.enrollment_category;
            document.getElementById('enrollment_date').value = s.enrollment_date || '';
            document.getElementById('student_status').value = s.status;
            document.getElementById('studentStatusGroup').style.display = 'block';
            document.getElementById('studentModal').classList.add('show');
        }
    } catch (error) {
        console.error('Error loading student:', error);
    }
}

async function deleteStudent(id) {
    if (!isAdmin) {
        alert('Only administrators can delete students');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this student?')) {
        return;
    }
    
    try {
        const response = await apiCall(`/api/students/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Student deleted successfully');
            loadStudents();
        } else {
            alert('Failed to delete student');
        }
    } catch (error) {
        console.error('Error deleting student:', error);
    }
}

document.getElementById('studentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const studentId = document.getElementById('studentId').value;
    const formData = {
        student_id: document.getElementById('student_id').value,
        full_name: document.getElementById('student_full_name').value,
        date_of_birth: document.getElementById('date_of_birth').value,
        gender: document.getElementById('gender').value,
        email: document.getElementById('student_email').value,
        phone: document.getElementById('student_phone').value,
        address: document.getElementById('student_address').value,
        parent_guardian_name: document.getElementById('parent_guardian_name').value,
        parent_guardian_phone: document.getElementById('parent_guardian_phone').value,
        parent_guardian_email: document.getElementById('parent_guardian_email').value,
        enrollment_category: document.getElementById('enrollment_category').value,
        enrollment_date: document.getElementById('enrollment_date').value,
        status: document.getElementById('student_status').value || 'Active'
    };
    
    try {
        const url = studentId ? `/api/students/${studentId}` : '/api/students';
        const method = studentId ? 'PUT' : 'POST';
        
        const response = await apiCall(url, {
            method: method,
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('studentAlertContainer', 'Student saved successfully!', 'success');
            setTimeout(() => {
                closeModal('studentModal');
                loadStudents();
            }, 1500);
        } else {
            showAlert('studentAlertContainer', data.error || 'Failed to save student');
        }
    } catch (error) {
        console.error('Error saving student:', error);
        showAlert('studentAlertContainer', 'An error occurred');
    }
});

// ============ STAFF FUNCTIONS ============

async function loadStaff() {
    const search = document.getElementById('staffSearch').value;
    const status = document.getElementById('staffStatusFilter').value;
    
    let url = '/api/staff?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (status) url += `status=${status}&`;
    
    try {
        const response = await apiCall(url);
        const data = await response.json();
        
        if (data.staff && data.staff.length > 0) {
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Staff ID</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.staff.forEach(staff => {
                let statusClass = 'success';
                if (staff.status === 'Inactive') statusClass = 'danger';
                if (staff.status === 'On Leave') statusClass = 'warning';
                
                html += `
                    <tr>
                        <td>${staff.staff_id}</td>
                        <td>${staff.full_name}</td>
                        <td>${staff.email}</td>
                        <td>${staff.phone || 'N/A'}</td>
                        <td><span class="badge badge-${statusClass}">${staff.status}</span></td>
                        <td class="action-buttons">
                            <button class="btn btn-sm btn-primary" onclick="viewStaff(${staff.id})">View</button>
                            ${isAdmin ? `
                                <button class="btn btn-sm btn-warning" onclick="editStaff(${staff.id})">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteStaff(${staff.id})">Delete</button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            document.getElementById('staffList').innerHTML = html;
        } else {
            document.getElementById('staffList').innerHTML = `
                <div class="empty-state">
                    <p>No staff members found</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading staff:', error);
        document.getElementById('staffList').innerHTML = '<p>Error loading staff</p>';
    }
}

function searchStaff() {
    loadStaff();
}

function showAddStaffModal() {
    if (!isAdmin) {
        alert('Only administrators can add staff');
        return;
    }
    
    document.getElementById('staffModalTitle').textContent = 'Add Staff';
    document.getElementById('staffForm').reset();
    document.getElementById('staffId').value = '';
    document.getElementById('staffStatusGroup').style.display = 'none';
    document.getElementById('staffModal').classList.add('show');
}

async function viewStaff(id) {
    try {
        const response = await apiCall(`/api/staff/${id}`);
        const data = await response.json();
        
        if (data.staff) {
            const s = data.staff;
            let subjectsText = 'None';
            if (s.subjects && s.subjects.length > 0) {
                subjectsText = s.subjects.map(sub => sub.subject_name).join(', ');
            }
            
            alert(`
Staff Details:
--------------
Staff ID: ${s.staff_id}
Name: ${s.full_name}
Email: ${s.email}
Phone: ${s.phone || 'N/A'}
Address: ${s.address || 'N/A'}
Date of Birth: ${s.date_of_birth || 'N/A'}
Gender: ${s.gender || 'N/A'}
Qualification: ${s.qualification || 'N/A'}
Hire Date: ${s.hire_date || 'N/A'}
Status: ${s.status}
Subjects: ${subjectsText}
            `);
        }
    } catch (error) {
        console.error('Error viewing staff:', error);
    }
}

async function editStaff(id) {
    if (!isAdmin) {
        alert('Only administrators can edit staff');
        return;
    }
    
    try {
        const response = await apiCall(`/api/staff/${id}`);
        const data = await response.json();
        
        if (data.staff) {
            const s = data.staff;
            document.getElementById('staffModalTitle').textContent = 'Edit Staff';
            document.getElementById('staffId').value = s.id;
            document.getElementById('staff_id').value = s.staff_id;
            document.getElementById('staff_full_name').value = s.full_name;
            document.getElementById('staff_email').value = s.email;
            document.getElementById('staff_phone').value = s.phone || '';
            document.getElementById('staff_address').value = s.address || '';
            document.getElementById('staff_date_of_birth').value = s.date_of_birth || '';
            document.getElementById('staff_gender').value = s.gender || '';
            document.getElementById('qualification').value = s.qualification || '';
            document.getElementById('hire_date').value = s.hire_date || '';
            document.getElementById('staff_status').value = s.status;
            document.getElementById('staffStatusGroup').style.display = 'block';
            document.getElementById('staffModal').classList.add('show');
        }
    } catch (error) {
        console.error('Error loading staff:', error);
    }
}

async function deleteStaff(id) {
    if (!isAdmin) {
        alert('Only administrators can delete staff');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this staff member?')) {
        return;
    }
    
    try {
        const response = await apiCall(`/api/staff/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Staff member deleted successfully');
            loadStaff();
        } else {
            alert('Failed to delete staff member');
        }
    } catch (error) {
        console.error('Error deleting staff:', error);
    }
}

document.getElementById('staffForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const staffId = document.getElementById('staffId').value;
    const formData = {
        staff_id: document.getElementById('staff_id').value,
        full_name: document.getElementById('staff_full_name').value,
        email: document.getElementById('staff_email').value,
        phone: document.getElementById('staff_phone').value,
        address: document.getElementById('staff_address').value,
        date_of_birth: document.getElementById('staff_date_of_birth').value,
        gender: document.getElementById('staff_gender').value,
        qualification: document.getElementById('qualification').value,
        hire_date: document.getElementById('hire_date').value,
        status: document.getElementById('staff_status').value || 'Active'
    };
    
    try {
        const url = staffId ? `/api/staff/${staffId}` : '/api/staff';
        const method = staffId ? 'PUT' : 'POST';
        
        const response = await apiCall(url, {
            method: method,
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('staffAlertContainer', 'Staff member saved successfully!', 'success');
            setTimeout(() => {
                closeModal('staffModal');
                loadStaff();
            }, 1500);
        } else {
            showAlert('staffAlertContainer', data.error || 'Failed to save staff member');
        }
    } catch (error) {
        console.error('Error saving staff:', error);
        showAlert('staffAlertContainer', 'An error occurred');
    }
});

// ============ FEES FUNCTIONS ============

async function loadFees() {
    try {
        const response = await apiCall('/api/fees');
        const data = await response.json();
        
        if (data.fees && data.fees.length > 0) {
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Receipt No.</th>
                            <th>Student</th>
                            <th>Amount</th>
                            <th>Payment Date</th>
                            <th>Method</th>
                            <th>Academic Year</th>
                            <th>Term</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.fees.forEach(fee => {
                html += `
                    <tr>
                        <td>${fee.receipt_number}</td>
                        <td>${fee.student_name} (${fee.student_number})</td>
                        <td>GH₵ ${parseFloat(fee.amount).toFixed(2)}</td>
                        <td>${new Date(fee.payment_date).toLocaleDateString()}</td>
                        <td><span class="badge badge-info">${fee.payment_method}</span></td>
                        <td>${fee.academic_year}</td>
                        <td>${fee.term}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="viewReceipt('${fee.receipt_number}')">View Receipt</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            document.getElementById('feesList').innerHTML = html;
        } else {
            document.getElementById('feesList').innerHTML = `
                <div class="empty-state">
                    <p>No payment records found</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading fees:', error);
        document.getElementById('feesList').innerHTML = '<p>Error loading payments</p>';
    }
}

function searchFees() {
    loadFees();
}

async function showRecordPaymentModal() {
    document.getElementById('paymentForm').reset();
    document.getElementById('balanceInfo').style.display = 'none';
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('payment_date').value = today;
    
    // Load students for dropdown
    try {
        const response = await apiCall('/api/students?status=Active');
        const data = await response.json();
        
        let options = '<option value="">Select a student</option>';
        if (data.students) {
            data.students.forEach(student => {
                options += `<option value="${student.id}">${student.full_name} (${student.student_id})</option>`;
            });
        }
        document.getElementById('payment_student_id').innerHTML = options;
    } catch (error) {
        console.error('Error loading students:', error);
    }
    
    document.getElementById('paymentModal').classList.add('show');
}

async function loadStudentBalance() {
    const studentId = document.getElementById('payment_student_id').value;
    const academicYear = document.getElementById('academic_year').value;
    const term = document.getElementById('term').value;
    
    if (!studentId || !academicYear || !term) {
        document.getElementById('balanceInfo').style.display = 'none';
        return;
    }
    
    try {
        const response = await apiCall(`/api/fees/balance/${studentId}?academic_year=${academicYear}&term=${term}`);
        const data = await response.json();
        
        document.getElementById('currentBalance').textContent = (data.balance || 0).toFixed(2);
        document.getElementById('balanceInfo').style.display = 'block';
    } catch (error) {
        console.error('Error loading balance:', error);
    }
}

document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        student_id: document.getElementById('payment_student_id').value,
        amount: parseFloat(document.getElementById('payment_amount').value),
        payment_date: document.getElementById('payment_date').value,
        payment_method: document.getElementById('payment_method').value,
        academic_year: document.getElementById('academic_year').value,
        term: document.getElementById('term').value,
        description: document.getElementById('payment_description').value
    };
    
    try {
        const response = await apiCall('/api/fees', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('paymentAlertContainer', `Payment recorded successfully! Receipt No: ${data.receipt_number}`, 'success');
            setTimeout(() => {
                closeModal('paymentModal');
                loadFees();
            }, 2000);
        } else {
            showAlert('paymentAlertContainer', data.error || 'Failed to record payment');
        }
    } catch (error) {
        console.error('Error recording payment:', error);
        showAlert('paymentAlertContainer', 'An error occurred');
    }
});

async function viewReceipt(receiptNumber) {
    try {
        const response = await apiCall(`/api/fees/receipt/${receiptNumber}`);
        const data = await response.json();
        
        if (data.receipt) {
            const r = data.receipt;
            const receiptHTML = `
                <div style="border: 2px solid #4169E1; padding: 30px; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #4169E1; margin-bottom: 10px;">🎓 Assurance Remedial School</h2>
                        <h3>Payment Receipt</h3>
                    </div>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                        <p><strong>Receipt No:</strong> ${r.receipt_number}</p>
                        <p><strong>Date:</strong> ${new Date(r.payment_date).toLocaleDateString()}</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="border-bottom: 2px solid #4169E1; padding-bottom: 10px; margin-bottom: 15px;">Student Information</h4>
                        <p><strong>Name:</strong> ${r.student_name}</p>
                        <p><strong>Student ID:</strong> ${r.student_number}</p>
                        <p><strong>Enrollment:</strong> ${r.enrollment_category}</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="border-bottom: 2px solid #4169E1; padding-bottom: 10px; margin-bottom: 15px;">Payment Details</h4>
                        <p><strong>Amount Paid:</strong> <span style="font-size: 24px; color: #28a745; font-weight: bold;">GH₵ ${parseFloat(r.amount).toFixed(2)}</span></p>
                        <p><strong>Payment Method:</strong> ${r.payment_method}</p>
                        <p><strong>Academic Year:</strong> ${r.academic_year}</p>
                        <p><strong>Term:</strong> ${r.term}</p>
                        <p><strong>Description:</strong> ${r.description || 'N/A'}</p>
                    </div>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                        <p><strong>Recorded By:</strong> ${r.recorded_by_name}</p>
                        <p><strong>Date & Time:</strong> ${new Date(r.created_at).toLocaleString()}</p>
                    </div>
                    <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
                        <p>This is a computer-generated receipt</p>
                        <p>Assurance Remedial School Management System</p>
                    </div>
                </div>
            `;
            
            document.getElementById('receiptContent').innerHTML = receiptHTML;
            document.getElementById('receiptModal').classList.add('show');
        }
    } catch (error) {
        console.error('Error loading receipt:', error);
        alert('Failed to load receipt');
    }
}

function printReceipt() {
    window.print();
}

// ============ HELPER FUNCTIONS ============

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function showAlert(containerId, message, type = 'error') {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
}

// Load dashboard on page load
loadDashboardStats();
