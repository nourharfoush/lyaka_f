// Fitness Test Data System - Main Application Logic

// Global data storage
let studentsData = [];
let currentStudent = {};
let currentStudentIndex = 0;

// Test definitions for each education level
const tests = {
    primary: [
        { id: 'runInPlace', name: 'الجرى في المكان (١٥ث)', isCore: true },
        { id: 'sitUp', name: 'الجلوس من الرقود (٣٠ث)', isCore: true },
        { id: 'jumpInCircle', name: 'الوثب داخل الدوائر المرقمة', isCore: false },
        { id: 'shuttleRun', name: 'الجرى الإرتدادى', isCore: false },
        { id: 'pushUp', name: 'الانبطاح المائل', isCore: true }
    ],
    middle: [
        { id: 'runInPlace', name: 'الجرى في المكان (١٥ث)', isCore: true },
        { id: 'sitUp', name: 'الجلوس من الرقود (٣٠ث)', isCore: true },
        { id: 'jumpFromStability', name: 'الوثب من الثبات', isCore: false },
        { id: 'zigzagRun', name: 'الجرى الزجزاجى', isCore: false },
        { id: 'pushUp', name: 'الانبطاح المائل', isCore: true }
    ],
    high: [
        { id: 'runInPlace', name: 'الجرى في المكان', isCore: true },
        { id: 'sitUp', name: 'الجلوس من الرقود', isCore: true },
        { id: 'trunkBend', name: 'ثنى الجذع', isCore: false },
        { id: 'multiRun', name: 'الجرى المتعدد', isCore: false },
        { id: 'pushUp', name: 'الانبطاح المائل', isCore: true }
    ]
};

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the database
    fitnessDB.init();
    
    // Load data from localStorage if available
    loadSavedData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update year display in the header
    updateYearDisplay();
});

// Update year display in the header and report section
function updateYearDisplay() {
    // Get the active year from the database
    const currentYear = fitnessDB.getActiveYear();
    
    // Update year badge in the header
    const yearBadge = document.getElementById('yearBadge');
    if (yearBadge) {
        yearBadge.textContent = currentYear;
    }
    
    // Update report year badge
    const reportYearBadge = document.getElementById('reportYearBadge');
    if (reportYearBadge) {
        reportYearBadge.textContent = currentYear;
    }
    
    // Set report year dropdown to match current year
    const reportYearSelect = document.getElementById('reportYear');
    if (reportYearSelect) {
        reportYearSelect.value = currentYear;
    }
    
    console.log(`Updated year display to: ${currentYear}`);
}

// Set up all event listeners
function setupEventListeners() {
    // Education level change event
    document.getElementById('educationLevel').addEventListener('change', function() {
        loadTestsForLevel(this.value);
    });
    
    // Year selection change event
    document.getElementById('testYear').addEventListener('change', function() {
        const selectedYear = this.value;
        if (selectedYear) {
            // Set the active year in the database
            fitnessDB.setActiveYear(selectedYear);
            
            // Load data for the selected year
            studentsData = fitnessDB.getStudentsByYear(selectedYear);
            
            // Recalculate all core tests scores to ensure they're correct
            recalculateCoreTestsScores();
            
            // Update rankings
            updateRankings();
            
            // Load first student if available
            if (studentsData.length > 0) {
                currentStudentIndex = 0;
                loadStudentData(studentsData[0]);
            } else {
                // Clear form if no students in this year
                resetForm();
                currentStudentIndex = 0;
            }
            
            // Update navigation buttons
            updateNavigationButtons();
            
            // Update year display in the header
            updateYearDisplay();
        }
    });
    
    // Report year selection change event
    document.getElementById('reportYear').addEventListener('change', function() {
        const selectedReportYear = this.value;
        if (selectedReportYear) {
            // Update report year badge
            document.getElementById('reportYearBadge').textContent = selectedReportYear;
        }
    });
    
    // Save buttons click events
    document.getElementById('saveButton').addEventListener('click', saveStudentData);
    document.getElementById('saveButtonAlt').addEventListener('click', saveStudentData);
    
    // Update buttons click events
    document.getElementById('updateButton').addEventListener('click', updateStudentData);
    document.getElementById('updateButtonAlt').addEventListener('click', updateStudentData);
    
    // Clear form button
    document.getElementById('clearButton').addEventListener('click', resetForm);
    
    // Report buttons click events
    document.getElementById('regionReportBtn').addEventListener('click', function() {
        showReport('region');
    });
    
    document.getElementById('topStudentsBtn').addEventListener('click', function() {
        showReport('topStudents');
    });
    
    document.getElementById('printReportBtn').addEventListener('click', printAllReports);
    
    // Print modal button
    document.getElementById('printModalBtn').addEventListener('click', function() {
        window.print();
    });
    
    // Search and navigation buttons
    document.getElementById('searchButton').addEventListener('click', searchStudentByCode);
    document.getElementById('searchCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchStudentByCode();
            e.preventDefault();
        }
    });
    
    document.getElementById('firstButton').addEventListener('click', navigateToFirst);
    document.getElementById('prevButton').addEventListener('click', navigateToPrevious);
    document.getElementById('nextButton').addEventListener('click', navigateToNext);
    document.getElementById('lastButton').addEventListener('click', navigateToLast);
    
    // Excel export/import buttons
    document.getElementById('exportExcelBtn').addEventListener('click', exportExcelTemplate);
    document.getElementById('importExcelBtn').addEventListener('click', importExcelData);
    
    // Database backup/restore buttons
    document.getElementById('exportDatabaseBtn').addEventListener('click', exportDatabase);
    document.getElementById('importDatabaseBtn').addEventListener('click', importDatabase);
    document.getElementById('restoreBackupBtn').addEventListener('click', restoreDatabase);
    
    // Auto-save on window close
    window.addEventListener('beforeunload', function() {
        // Save database
        fitnessDB.saveDatabase();
    });
    
    // Note: Add/Delete student buttons are already set up with onclick in HTML
}

// Load tests based on selected education level
function loadTestsForLevel(level) {
    const testsContainer = document.getElementById('testsContainer');
    
    // Clear previous tests
    testsContainer.innerHTML = '';
    
    if (!level || !tests[level]) {
        testsContainer.innerHTML = '<div class="alert alert-info">الرجاء اختيار المرحلة التعليمية أولاً</div>';
        return;
    }
    
    try {
        // Create test tables for the selected level
        tests[level].forEach(test => {
            try {
                const testTable = createTestTable(test);
                testsContainer.appendChild(testTable);
            } catch (testError) {
                console.error(`Error creating test table for ${test.id}:`, testError);
                // Add a placeholder for the failed test
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger';
                errorDiv.textContent = `خطأ في تحميل اختبار ${test.name}`;
                testsContainer.appendChild(errorDiv);
            }
        });
        
        // Add event listeners to score inputs
        addScoreInputListeners();
        
        console.log(`Successfully loaded tests for level: ${level}`);
    } catch (error) {
        console.error('Error in loadTestsForLevel:', error);
        testsContainer.innerHTML = '<div class="alert alert-danger">حدث خطأ أثناء تحميل الاختبارات</div>';
    }
}

// Create a test table for a specific test
function createTestTable(test) {
    const tableDiv = document.createElement('div');
    tableDiv.className = 'test-table';
    
    // All tests now use two referees only
    tableDiv.innerHTML = `
        <h4>${test.name}</h4>
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>الحكم الأول</th>
                    <th>الحكم الثاني</th>
                    <th>المتوسط</th>
                    <th>الدرجة (0-10)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><input type="number" class="form-control judge1" data-test="${test.id}" min="0"></td>
                    <td><input type="number" class="form-control judge2" data-test="${test.id}" min="0"></td>
                    <td><span class="average" id="${test.id}Average">0</span></td>
                    <td><span class="score" id="${test.id}Score">0</span></td>
                </tr>
            </tbody>
        </table>
    `;
    
    return tableDiv;
}

// Add event listeners to score inputs
function addScoreInputListeners() {
    const scoreInputs = document.querySelectorAll('.judge1, .judge2');
    
    scoreInputs.forEach(input => {
        input.addEventListener('input', function() {
            const testId = this.getAttribute('data-test');
            calculateTestScore(testId);
            updateTotalScores();
        });
    });
}


// Calculate score for a specific test
function calculateTestScore(testId) {
    const judge1Input = document.querySelector(`.judge1[data-test="${testId}"]`);
    const judge2Input = document.querySelector(`.judge2[data-test="${testId}"]`);
    
    const judge1Value = parseFloat(judge1Input.value) || 0;
    const judge2Value = parseFloat(judge2Input.value) || 0;
    
    // Calculate average
    let average = 0;
    
    // All tests now use two referees only
    average = (judge1Value + judge2Value) / 2;
    
    // Update average display
    document.getElementById(`${testId}Average`).textContent = average.toFixed(2);
    
    // Calculate score (0-10 scale) using standardized threshold-based scoring
    let score = 0;
    
    // Get education level
    const level = document.getElementById('educationLevel').value;
    
    // Apply standardized threshold-based scoring criteria
    // These thresholds can be easily adjusted for each test later
    const thresholds = getTestThresholds(testId, level);
    
    // Apply thresholds to determine score
    for (let i = 0; i < thresholds.length; i++) {
        // For timed tests (jumpInCircle, Multi-run, Zigzag Run, and shuttleRun), lower times are better
        // so we use 'less than' comparison instead of 'greater than'
        if (testId === 'jumpInCircle' || testId === 'multiRun' || testId === 'zigzagRun' || testId === 'shuttleRun') {
            if (average < thresholds[i]) {
                // تحديد الدرجة بناءً على الفهرس في المصفوفة
                // إذا كان طول المصفوفة 20، فإن الدرجات ستكون من 10 إلى 1
                // وإذا كان طول المصفوفة 10، فإن الدرجات ستكون من 10 إلى 1 أيضًا
                score = thresholds.length >= 20 ? (20 - i) / 2 : 10 - i;
                break;
            }
        } 
        // للاختبارات الأخرى، القيم الأعلى هي الأفضل
        else {
            // For other tests, higher values are better, so we use 'greater than' comparison
            if (average > thresholds[i]) {
                // تحديد الدرجة بناءً على الفهرس في المصفوفة
                // إذا كان طول المصفوفة 20، فإن الدرجات ستكون من 10 إلى 1
                // وإذا كان طول المصفوفة 10، فإن الدرجات ستكون من 10 إلى 1 أيضًا
                score = thresholds.length >= 20 ? (20 - i) / 2 : 10 - i;
                break;
            }
        }
    }
    
    // Update score display
    document.getElementById(`${testId}Score`).textContent = score.toFixed(2);
    
    // Return both average and score
    return { average, score };
}

// Get test-specific thresholds based on test ID and education level
function getTestThresholds(testId, level) {
    // Test-specific thresholds for all education levels
    const testThresholds = {
        // Primary School (ابتدائي) thresholds - تم تحديثها وفقاً للجداول المعيارية الجديدة
        'primary_runInPlace': [  29,  27,  25,  23,  21,  19,  17,  15, 13, 11],
        'primary_sitUp': [  26,  24, 22, 20, 18,  16, 14,  12,  10, 8],
        'primary_jumpInCircle': [ 5.60,6 , 6.40,8.80, 7.20 , 7.60 ,8 , 8.40 , 8.80 , 9.20  ],
        'primary_shuttleRun': [ 10.50 , 11 , 11.50 , 12 , 12.50 , 13 , 13.50 , 14 , 14.50 , 15],
        'primary_pushUp': [37,  35, 33, 31, 29, 27, 25, 23, 21, 19],
        
        // Middle School (إعدادي) thresholds - تم تحديثها وفقاً للجداول المعيارية الجديدة
        'middle_runInPlace': [ 31, 29 , 27 , 25 , 23 , 21 , 19 , 17 , 15 , 13],
        'middle_sitUp': [28, 26,  24, 22,  20,  18,  16,  14, 12, 10],
        'middle_jumpFromStability': [179 ,174 , 169 , 164 , 159 , 154 , 149 , 144 ,139 , 134 , 129 ],
        'middle_zigzagRun': [9 , 9.50 , 10 , 10.50 , 11 , 11.50 , 12 , 12.50 , 13 , 13.49 ],
        'middle_pushUp': [ 34,  32,  30, 28,  26,  24,  22, 20, 18, 16],
        
        // High School (ثانوي) thresholds
        'high_runInPlace': [34, 33, 32, 31, 30, 29, 28, 27, 26, 25],
        'high_sitUp': [33, 32, 31, 30, 29, 28, 27, 26, 25, 24],
        'high_trunkBend': [19, 17, 15, 13, 11, 9, 7, 5, 3, 0],
        'high_multiRun': [13.01, 13.21, 13.41, 13.61, 13.81, 14.01, 14.21, 14.41, 14.61, 14.81],
        'high_pushUp': [51, 49, 47, 45, 43, 41, 39, 37, 35, 33]
    };
    
    // Return test-specific thresholds if available, otherwise use default thresholds
    const key = `${level}_${testId}`;
    
    // Default thresholds if no specific thresholds are defined
    const defaultThresholds = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    
    return testThresholds[key] || defaultThresholds;
}

// Update total scores
function updateTotalScores() {
    const level = document.getElementById('educationLevel').value;
    if (!level || !tests[level]) return;
    
    let totalScore = 0;
    let coreTestsTotal = 0;
    
    tests[level].forEach(test => {
        const scoreElement = document.getElementById(`${test.id}Score`);
        const averageElement = document.getElementById(`${test.id}Average`);
        
        const score = parseFloat(scoreElement.textContent) || 0;
        const average = parseFloat(averageElement.textContent) || 0;
        
        totalScore += score;
        
        // للاختبارات الأساسية فقط (الجري في المكان، الجلوس من الرقود، الانبطاح المائل)
        if (test.isCore) {
            // جمع متوسط الاختبار (القيمة الخام) وليس الدرجة
            coreTestsTotal += average;
        }
    });
    
    // Update displays
    document.getElementById('totalScore').textContent = totalScore.toFixed(2);
    document.getElementById('coreTestsScore').textContent = coreTestsTotal.toFixed(2);
    
    // تخزين قيمة مجموع متوسطات الاختبارات الأساسية في متغير عام للاستخدام لاحقاً
    window.currentCoreTestsScore = coreTestsTotal;
}

// Save student data
function saveStudentData() {
    const level = document.getElementById('educationLevel').value;
    if (!level || !tests[level]) {
        alert('الرجاء اختيار المرحلة التعليمية أولاً');
        return;
    }
    
    // Get selected year
    const year = document.getElementById('testYear').value;
    if (!year) {
        alert('الرجاء اختيار سنة الاختبار');
        return;
    }
    
    // Collect student info
    const studentInfo = {
        id: Date.now(), // Generate a unique ID
        code: document.getElementById('studentCode').value,
        name: document.getElementById('studentName').value,
        nationalId: document.getElementById('nationalId').value,
        region: document.getElementById('region').value,
        administration: document.getElementById('administration').value,
        institute: document.getElementById('institute').value,
        educationLevel: level,
        testYear: year,
        tests: {},
        totalScore: parseFloat(document.getElementById('totalScore').textContent) || 0,
        coreTestsScore: 0 // سيتم حسابها من مجموع متوسطات الاختبارات الأساسية
    };
    
    // Validate required fields
    if (!studentInfo.code || !studentInfo.name || !studentInfo.nationalId || 
        !studentInfo.region || !studentInfo.administration || !studentInfo.institute) {
        alert('الرجاء إدخال جميع البيانات المطلوبة');
        return;
    }
    
    // التحقق من عدم تكرار الكود
    const existingStudents = fitnessDB.getStudentsByYear(year);
    const studentWithSameCode = existingStudents.find(student => 
        student.code === studentInfo.code && 
        (!currentStudent.id || student.id !== currentStudent.id)
    );
    
    if (studentWithSameCode) {
        alert(`الكود ${studentInfo.code} مستخدم بالفعل للطالب ${studentWithSameCode.name}. الرجاء استخدام كود آخر.`);
        return;
    }
    
    let coreTestsTotal = 0;
    
    tests[level].forEach(test => {
        const judge1 = parseFloat(document.querySelector(`.judge1[data-test="${test.id}"]`).value) || 0;
        const judge2 = parseFloat(document.querySelector(`.judge2[data-test="${test.id}"]`).value) || 0;
        const average = parseFloat(document.getElementById(`${test.id}Average`).textContent) || 0;
        const score = parseFloat(document.getElementById(`${test.id}Score`).textContent) || 0;
        
        // All tests now use two referees only
        studentInfo.tests[test.id] = { judge1, judge2, average, score };
        
        // جمع متوسطات الاختبارات الأساسية فقط
        if (test.isCore) {
            // جمع متوسط الاختبار (القيمة الخام) وليس الدرجة
            coreTestsTotal += average;
        }
    });
    
    // تحديث مجموع متوسطات الاختبارات الأساسية
    studentInfo.coreTestsScore = coreTestsTotal;
    
    // الحفاظ على الـ ID الحالي للطالب إذا كنا نقوم بتحديث طالب موجود
    if (currentStudent && currentStudent.id) {
        studentInfo.id = currentStudent.id;
    }
    
    // Save to database by year
    fitnessDB.saveStudent(studentInfo, year);
    
    // Get updated students data for the current year
    studentsData = fitnessDB.getStudentsByYear(year);
    
    // Find the index of the saved student
    const savedIndex = studentsData.findIndex(student => student.code === studentInfo.code);
    if (savedIndex >= 0) {
        currentStudentIndex = savedIndex;
    } else {
        currentStudentIndex = studentsData.length - 1;
    }
    
    // Update rankings
    updateRankings();
    
    // Update current student
    currentStudent = studentInfo;
    updateNavigationButtons();
    
    alert('تم حفظ بيانات الطالب بنجاح');
}

// Recalculate core tests scores for all students
function recalculateCoreTestsScores() {
    // Only process if we have data
    if (!studentsData || !studentsData.length) return;
    
    console.log("Recalculating core tests scores for all students...");
    
    // Process each student in the current data set
    studentsData.forEach(student => {
        let coreTestsTotal = 0;
        
        if (student.tests && student.educationLevel && tests[student.educationLevel]) {
            // Get all core tests for this education level
            const coreTests = tests[student.educationLevel].filter(test => test.isCore);
            
            // Calculate sum of core test averages
            coreTests.forEach(test => {
                if (student.tests[test.id] && typeof student.tests[test.id].average === 'number') {
                    coreTestsTotal += student.tests[test.id].average;
                }
            });
            
            // Only log and update if there's a difference
            if (student.coreTestsScore !== coreTestsTotal) {
                console.log(`Student ${student.name} (${student.code}): Updating coreTestsScore from ${student.coreTestsScore} to ${coreTestsTotal}`);
                student.coreTestsScore = coreTestsTotal;
            }
        }
    });
    
    // Save the updated data to the database
    fitnessDB.saveDatabase();
}

// Load saved data from localStorage
function loadSavedData() {
    // Get the active year from the database
    const currentYear = fitnessDB.getActiveYear();
    
    // Get data for current year
    studentsData = fitnessDB.getStudentsByYear(currentYear);
    
    // Recalculate all core tests scores to ensure they're correct
    recalculateCoreTestsScores();
    
    // Update rankings
    updateRankings();
    
    // Load first student if available
    if (studentsData.length > 0) {
        loadStudentData(studentsData[0]);
        currentStudentIndex = 0;
        updateNavigationButtons();
    }
    
    // Set current year in the dropdown
    const yearSelect = document.getElementById('testYear');
    if (yearSelect) {
        yearSelect.value = currentYear;
    }
    
    // Update year display in the header
    updateYearDisplay();
}

// Update rankings for all students
function updateRankings() {
    // Get current selected year
    const selectedYear = document.getElementById('testYear').value;
    if (!selectedYear) return;
    
    try {
        // Group students by education level
        const studentsByLevel = {};
        
        tests.primary.forEach(test => studentsByLevel.primary = []);
        tests.middle.forEach(test => studentsByLevel.middle = []);
        tests.high.forEach(test => studentsByLevel.high = []);
        
        studentsData.forEach(student => {
            if (studentsByLevel[student.educationLevel]) {
                studentsByLevel[student.educationLevel].push(student);
            }
        });
        
        // Sort and assign rankings within each level
        Object.keys(studentsByLevel).forEach(level => {
            studentsByLevel[level].sort((a, b) => {
                // First sort by total score (descending)
                if (b.totalScore !== a.totalScore) {
                    return b.totalScore - a.totalScore;
                }
                // If tied, sort by core tests score (descending)
                return b.coreTestsScore - a.coreTestsScore;
            });
            
            // Assign rankings
            studentsByLevel[level].forEach((student, index) => {
                student.ranking = index + 1;
            });
        });
        
        // Save updated data to the database
        fitnessDB.saveDatabase();
        
        // Update current student's ranking display
        if (currentStudent && currentStudent.code) {
            const student = studentsData.find(s => s.code === currentStudent.code);
            if (student) {
                const rankingElement = document.getElementById('ranking');
                if (rankingElement) {
                    rankingElement.textContent = student.ranking !== undefined ? student.ranking : '0';
                }
            }
        }
        
        console.log('Rankings updated successfully');
    } catch (error) {
        console.error('Error updating rankings:', error);
    }
}

// Load student data into form
function loadStudentData(student) {
    if (!student) return;
    
    // Set form fields
    document.getElementById('studentCode').value = student.code || '';
    document.getElementById('studentName').value = student.name || '';
    document.getElementById('nationalId').value = student.nationalId || '';
    document.getElementById('region').value = student.region || '';
    document.getElementById('administration').value = student.administration || '';
    document.getElementById('institute').value = student.institute || '';
    
    const educationLevel = student.educationLevel;
    document.getElementById('educationLevel').value = educationLevel;
    
    // Load tests for this level
    loadTestsForLevel(educationLevel);
    
    // Increase timeout to ensure UI elements are loaded
    setTimeout(() => {
        try {
            if (student.tests) {
                Object.keys(student.tests).forEach(testId => {
                    try {
                        const testData = student.tests[testId];
                        const judge1Input = document.querySelector(`.judge1[data-test="${testId}"]`);
                        const judge2Input = document.querySelector(`.judge2[data-test="${testId}"]`);
                        
                        if (judge1Input && judge2Input) {
                            judge1Input.value = testData.judge1;
                            judge2Input.value = testData.judge2;
                            
                            // For push-up test, set the third referee value if it exists
                            if (testId === 'pushUp') {
                                const judge3Input = document.querySelector(`.judge3[data-test="${testId}"]`);
                                if (judge3Input && testData.judge3 !== undefined) {
                                    judge3Input.value = testData.judge3;
                                }
                            }
                            
                            calculateTestScore(testId);
                        } else {
                            console.warn(`Test inputs for ${testId} not found in the DOM`);
                        }
                    } catch (testError) {
                        console.error(`Error setting test data for ${testId}:`, testError);
                    }
                });
            }
            
            // Update total scores
            updateTotalScores();
            
            // Update ranking display
            const foundStudent = studentsData.find(s => s.code === student.code);
            if (foundStudent && foundStudent.ranking !== undefined) {
                document.getElementById('ranking').textContent = foundStudent.ranking;
            } else if (student.ranking !== undefined) {
                document.getElementById('ranking').textContent = student.ranking;
            } else {
                document.getElementById('ranking').textContent = '0';
            }
            
            // Set current student
            currentStudent = student;
        } catch (error) {
            console.error('Error in loadStudentData timeout callback:', error);
        }
    }, 300); // Increased timeout from 100ms to 300ms for better reliability
}

// Update navigation buttons state
function updateNavigationButtons() {
    try {
        const firstButton = document.getElementById('firstButton');
        const prevButton = document.getElementById('prevButton');
        const nextButton = document.getElementById('nextButton');
        const lastButton = document.getElementById('lastButton');
        
        if (!firstButton || !prevButton || !nextButton || !lastButton) {
            console.warn('Navigation buttons not found in the DOM');
            return;
        }
        
        // Disable/enable buttons based on current position
        firstButton.disabled = prevButton.disabled = (currentStudentIndex <= 0 || studentsData.length === 0);
        nextButton.disabled = lastButton.disabled = (currentStudentIndex >= studentsData.length - 1 || studentsData.length === 0);
        
        // Update position indicator
        const positionIndicator = document.getElementById('positionIndicator');
        if (positionIndicator) {
            if (studentsData.length > 0) {
                positionIndicator.textContent = `${currentStudentIndex + 1} / ${studentsData.length}`;
            } else {
                positionIndicator.textContent = '0 / 0';
            }
        }
        
        console.log(`Navigation updated: position ${currentStudentIndex + 1}/${studentsData.length}`);
    } catch (error) {
        console.error('Error updating navigation buttons:', error);
    }
}

// Navigation functions

// Navigation functions
function navigateToFirst() {
    if (studentsData.length > 0) {
        currentStudentIndex = 0;
        loadStudentData(studentsData[currentStudentIndex]);
        updateNavigationButtons();
    }
}

function navigateToPrevious() {
    if (currentStudentIndex > 0) {
        currentStudentIndex--;
        loadStudentData(studentsData[currentStudentIndex]);
        updateNavigationButtons();
    }
}

function navigateToNext() {
    if (currentStudentIndex < studentsData.length - 1) {
        currentStudentIndex++;
        loadStudentData(studentsData[currentStudentIndex]);
        updateNavigationButtons();
    }
}

function navigateToLast() {
    if (studentsData.length > 0) {
        currentStudentIndex = studentsData.length - 1;
        loadStudentData(studentsData[currentStudentIndex]);
        updateNavigationButtons();
    }
}

// Reset form for next student
function resetForm() {
    // Clear student info fields but keep the year selection
    const selectedYear = document.getElementById('testYear').value;
    
    document.getElementById('studentCode').value = '';
    document.getElementById('studentName').value = '';
    document.getElementById('nationalId').value = '';
    document.getElementById('region').value = '';
    document.getElementById('administration').value = '';
    document.getElementById('institute').value = '';
    
    // Reset education level but don't clear the year
    document.getElementById('educationLevel').value = '';
    
    // Clear tests container
    document.getElementById('testsContainer').innerHTML = 
        '<div class="alert alert-info">الرجاء اختيار المرحلة التعليمية أولاً</div>';
    
    // Reset scores
    document.getElementById('totalScore').textContent = '0';
    document.getElementById('coreTestsScore').textContent = '0';
    document.getElementById('ranking').textContent = '0';
    
    // Reset current student
    currentStudent = {};
}

function addNewStudent() {
    resetForm();
    loadTestsForLevel('');
    currentStudentIndex = -1;
    studentsData = [];
    localStorage.removeItem('fitnessTestData');
    updateNavigationButtons();
    
    // Create new student object
    const newStudent = {
        code: '',
        name: '',
        nationalId: '',
        region: '',
        administration: '',
        institute: '',
        educationLevel: ''
    };
    
    // Add to students array
    studentsData.push(newStudent);
    currentStudentIndex = studentsData.length - 1;
    
    updateNavigationButtons();
    updatePositionIndicator();
    document.getElementById('studentCode').focus();
    alert('تم إضافة طالب جديد - الرجاء ملء البيانات وحفظها');
}

function deleteAllStudents() {
    if (confirm('هل أنت متأكد من حذف جميع الطلاب؟ سيتم فقدان جميع البيانات بشكل دائم!')) {
        studentsData = [];
        localStorage.removeItem('fitnessTestData');
        resetForm();
        currentStudentIndex = -1;
        updateNavigationButtons();
        document.getElementById('positionIndicator').textContent = '0 / 0';
        alert('تم حذف جميع البيانات بنجاح');
    }
}

function deleteStudent() {
    if (studentsData.length === 0 || currentStudentIndex < 0) {
        alert('لا يوجد طالب لحذفه');
        return;
    }
    
    // Get the currently selected year
    const selectedYear = document.getElementById('testYear').value;
    if (!selectedYear) {
        alert('الرجاء اختيار سنة الاختبار أولاً');
        return;
    }
    
    const student = studentsData[currentStudentIndex];
    
    if (confirm(`هل أنت متأكد من حذف الطالب ${student.name}؟`)) {
        // Delete from database
        fitnessDB.deleteStudent(student.code, selectedYear);
        
        // Get updated data
        studentsData = fitnessDB.getStudentsByYear(selectedYear);
        
        // Update navigation
        if (studentsData.length > 0) {
            currentStudentIndex = Math.min(currentStudentIndex, studentsData.length - 1);
            loadStudentData(studentsData[currentStudentIndex]);
        } else {
            resetForm();
            currentStudentIndex = -1;
        }
        
        updateNavigationButtons();
        alert('تم حذف الطالب بنجاح');
    }
}

// Delete all students for the current year
function deleteAllStudents() {
    // Get the currently selected year
    const selectedYear = document.getElementById('testYear').value;
    if (!selectedYear) {
        alert('الرجاء اختيار سنة الاختبار أولاً');
        return;
    }
    
    if (confirm(`هل أنت متأكد من حذف جميع الطلاب لسنة ${selectedYear}؟`)) {
        // Clear year data
        fitnessDB.clearYear(selectedYear);
        
        // Update local data
        studentsData = [];
        resetForm();
        currentStudentIndex = -1;
        updateNavigationButtons();
        
        alert(`تم حذف جميع بيانات طلاب سنة ${selectedYear} بنجاح`);
    }
}

function deleteStudent() {
    if (currentStudentIndex === -1) {
        alert('الرجاء اختيار طالب للحذف');
        return;
    }

    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
        studentsData.splice(currentStudentIndex, 1);
        localStorage.setItem('fitnessTestData', JSON.stringify(studentsData));
        
        if (currentStudentIndex >= studentsData.length) {
            currentStudentIndex = studentsData.length - 1;
        }
        
        if (studentsData.length === 0) {
            clearForm();
            currentStudentIndex = -1;
        } else {
            loadStudentData(studentsData[currentStudentIndex]);
        }
        
        updateRankings();
        updateNavigationButtons();
        document.getElementById('positionIndicator').textContent = studentsData.length > 0 ? `${currentStudentIndex + 1} / ${studentsData.length}` : '0 / 0';
        alert('تم حذف الطالب بنجاح');
    }
}

// Load student data into form
function loadStudentData(student) {
    if (!student) return;
    
    // Set form fields
    document.getElementById('studentCode').value = student.code || '';
    document.getElementById('studentName').value = student.name || '';
    document.getElementById('nationalId').value = student.nationalId || '';
    document.getElementById('region').value = student.region || '';
    document.getElementById('administration').value = student.administration || '';
    document.getElementById('institute').value = student.institute || '';
    
    const educationLevel = student.educationLevel;
    document.getElementById('educationLevel').value = educationLevel;
    
    // Load tests for this level
    loadTestsForLevel(educationLevel);
    
    // Set test scores
    setTimeout(() => {
        if (student.tests) {
            Object.keys(student.tests).forEach(testId => {
                const testData = student.tests[testId];
                const judge1Input = document.querySelector(`.judge1[data-test="${testId}"]`);
                const judge2Input = document.querySelector(`.judge2[data-test="${testId}"]`);
                
                if (judge1Input && judge2Input) {
                    judge1Input.value = testData.judge1;
                    judge2Input.value = testData.judge2;
                    
                    // Note: We no longer use the third referee for push-up test
                    // but we keep compatibility with older data
                    
                    calculateTestScore(testId);
                }
            });
        }
        
        // Update total scores
        updateTotalScores();
        
        // Set current student
        currentStudent = student;
    }, 100);
}

// Navigation functions

// Navigation functions
function navigateToFirst() {
    if (studentsData.length > 0) {
        currentStudentIndex = 0;
        loadStudentData(studentsData[currentStudentIndex]);
        updateNavigationButtons();
    }
}

function navigateToPrevious() {
    if (currentStudentIndex > 0) {
        currentStudentIndex--;
        loadStudentData(studentsData[currentStudentIndex]);
        updateNavigationButtons();
    }
}

function navigateToNext() {
    if (currentStudentIndex < studentsData.length - 1) {
        currentStudentIndex++;
        loadStudentData(studentsData[currentStudentIndex]);
        updateNavigationButtons();
    }
}

function navigateToLast() {
    if (studentsData.length > 0) {
        currentStudentIndex = studentsData.length - 1;
        loadStudentData(studentsData[currentStudentIndex]);
        updateNavigationButtons();
    }
}

// Update navigation buttons state
function updateNavigationButtons() {
    const firstButton = document.getElementById('firstButton');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const lastButton = document.getElementById('lastButton');
    
    // Disable/enable buttons based on current position
    firstButton.disabled = prevButton.disabled = (currentStudentIndex <= 0 || studentsData.length === 0);
    nextButton.disabled = lastButton.disabled = (currentStudentIndex >= studentsData.length - 1 || studentsData.length === 0);
    
    // Update position indicator
    const positionIndicator = document.getElementById('positionIndicator');
    if (studentsData.length > 0) {
        positionIndicator.textContent = `${currentStudentIndex + 1} / ${studentsData.length}`;
    } else {
        positionIndicator.textContent = '0 / 0';
    }
}

// Show reports
function showReport(reportType) {
    try {
        console.log(`Showing report: ${reportType}`);
        
        const modalTitle = document.getElementById('reportsModalTitle');
        const modalBody = document.getElementById('reportsModalBody');
        
        if (!modalTitle || !modalBody) {
            console.error('Reports modal elements not found', {
                modalTitle: modalTitle ? 'Found' : 'Not found',
                modalBody: modalBody ? 'Found' : 'Not found'
            });
            alert('حدث خطأ في عرض التقرير. الرجاء التأكد من وجود عناصر التقرير في الصفحة.');
            return;
        }
        
        // Get the selected report year
        const reportYear = document.getElementById('reportYear').value;
        
        if (!reportYear) {
            alert('الرجاء اختيار السنة أولاً');
            return;
        }

        // Clear previous content
        modalBody.innerHTML = '';
        
        // Add header template
        modalBody.innerHTML = `
            <header class="text-center my-4">
                <h1>المشروع القومى للياقة البدنية بالازهر الشريف <span class="year-badge">"فتيات"</span></h1>
                <p class="text-muted">العام الدراسي ${reportYear}</p>
            </header>
        `;
        
        // Get data for the selected report year
        const reportData = fitnessDB.getStudentsByYear(reportYear);
        
        // Check if we have data
        if (!reportData || reportData.length === 0) {
            modalBody.innerHTML += '<div class="alert alert-warning">لا توجد بيانات متاحة للسنة المختارة</div>';
            // Show the modal
            try {
                const reportsModal = new bootstrap.Modal(document.getElementById('reportsModal'));
                reportsModal.show();
            } catch (modalError) {
                console.error('Error showing modal', modalError);
                alert('لا توجد بيانات متاحة للسنة المختارة');
            }
            return;
        }
        
        // Log data for debugging
        console.log(`Report data for year ${reportYear}:`, {
            total: reportData.length,
            firstStudent: reportData[0] ? reportData[0].name : 'No data'
        });
        
        if (reportType === 'region') {
            modalTitle.textContent = `تقرير المناطق - ${reportYear}`;
            generateRegionReport(modalBody, reportData);
        } else if (reportType === 'topStudents') {
            modalTitle.textContent = `أفضل 10 طلاب - ${reportYear}`;
            generateTopStudentsReport(modalBody, reportData);
        }
        
        // Show the modal
        try {
            const reportsModal = new bootstrap.Modal(document.getElementById('reportsModal'));
            reportsModal.show();
        } catch (modalError) {
            console.error('Error showing modal:', modalError);
            
            // Fallback - try jQuery method if available
            try {
                if (window.jQuery && jQuery('#reportsModal').modal) {
                    jQuery('#reportsModal').modal('show');
                } else {
                    alert('حدث خطأ في عرض التقرير. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
                }
            } catch (jqueryError) {
                console.error('Fallback error:', jqueryError);
                alert('حدث خطأ في عرض التقرير. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
            }
        }
    } catch (error) {
        console.error('Error showing report:', error);
        alert('حدث خطأ أثناء عرض التقرير. يرجى المحاولة مرة أخرى.');
    }
}

// Generate region report
function generateRegionReport(container, reportData) {
    // Group students by region
    const regionData = {};
    
    reportData.forEach(student => {
        if (!regionData[student.region]) {
            regionData[student.region] = {
                students: [],
                totalScore: 0
            };
        }
        
        regionData[student.region].students.push(student);
        regionData[student.region].totalScore += student.totalScore;
    });
    
    // Sort students within each region by individual ranking (ascending)
    Object.keys(regionData).forEach(region => {
        regionData[region].students.sort((a, b) => a.ranking - b.ranking);
    });
    
    // Sort regions by total score
    const sortedRegions = Object.keys(regionData).sort((a, b) => {
        return regionData[b].totalScore - regionData[a].totalScore;
    });
    
    // Create report
    sortedRegions.forEach((region, index) => {
        const regionDiv = document.createElement('div');
        regionDiv.className = 'mb-4 region-report-page';
        
        regionDiv.innerHTML = `
            <h3>المنطقة: ${region} (الترتيب: ${index + 1})</h3>
            <p>المجموع الكلي للمنطقة: ${regionData[region].totalScore.toFixed(2)}</p>
            <div class="table-responsive">
                <table class="table table-striped report-table">
                    <thead>
                        <tr>
                            <th>الكود</th>
                            <th>الاسم</th>
                            <th>الرقم القومي</th>
                            <th>الإدارة</th>
                            <th>المعهد</th>
                            <th>المرحلة</th>
                            ${getTestHeadersHTML(regionData[region].students[0]?.educationLevel || 'primary')}
                            <th>المجموع</th>
                            <th>المجموع الأساسي</th>
                            <th>الترتيب</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${regionData[region].students.map(student => `
                            <tr>
                                <td>${student.code}</td>
                                <td>${student.name}</td>
                                <td>${student.nationalId}</td>
                                <td>${student.administration}</td>
                                <td>${student.institute}</td>
                                <td>${getEducationLevelName(student.educationLevel)}</td>
                                ${getTestScoresHTML(student)}
                                <td>${student.totalScore.toFixed(2)}</td>
                                <td>${student.coreTestsScore.toFixed(2)}</td>
                                <td>${student.ranking}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.appendChild(regionDiv);
    });
    
    // If no data
    if (sortedRegions.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">لا توجد بيانات متاحة</div>';
    }
}

// Generate top students report
function generateTopStudentsReport(container, reportData) {
    // Create a copy of students data for sorting
    const allStudents = [...reportData];
    
    // Sort all students by total score (descending)
    allStudents.sort((a, b) => {
        // First sort by total score (descending)
        if (b.totalScore !== a.totalScore) {
            return b.totalScore - a.totalScore;
        }
        // If tied, sort by core tests score (descending)
        return b.coreTestsScore - a.coreTestsScore;
    });
    
    // Take top 10 (or less if not enough data)
    const topStudents = allStudents.slice(0, 10);
    
    // Create report
    const reportDiv = document.createElement('div');
    reportDiv.className = 'individual-report-page';
    
    reportDiv.innerHTML = `
        <h3>أفضل 10 طلاب</h3>
        <div class="table-responsive">
            <table class="table table-striped report-table">
                <thead>
                    <tr>
                        <th>الكود</th>
                        <th>الاسم</th>
                        <th>الرقم القومي</th>
                        <th>المنطقة</th>
                        <th>الإدارة</th>
                        <th>المعهد</th>
                        <th>المرحلة</th>
                        ${getTestHeadersHTML(topStudents[0]?.educationLevel || 'primary')}
                        <th>المجموع</th>
                        <th>المجموع الأساسي</th>
                        <th>الترتيب</th>
                    </tr>
                </thead>
                <tbody>
                    ${topStudents.map((student, index) => `
                        <tr>
                            <td>${student.code}</td>
                            <td>${student.name}</td>
                            <td>${student.nationalId}</td>
                            <td>${student.region}</td>
                            <td>${student.administration}</td>
                            <td>${student.institute}</td>
                            <td>${getEducationLevelName(student.educationLevel)}</td>
                            ${getTestScoresHTML(student)}
                            <td>${student.totalScore.toFixed(2)}</td>
                            <td>${student.coreTestsScore.toFixed(2)}</td>
                            <td>${index + 1}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.appendChild(reportDiv);
    
    // If no data
    if (topStudents.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">لا توجد بيانات متاحة</div>';
    }
}

// Helper function to generate HTML for test headers
function getTestHeadersHTML(level) {
    if (!level || !tests[level]) return '';
    
    let headers = '';
    
    const testOrder = {
        'primary': ['runInPlace', 'sitUp', 'pushUp', 'jumpInCircle', 'shuttleRun'],
        'middle': ['runInPlace', 'sitUp', 'pushUp', 'jumpFromStability', 'zigzagRun'],
        'high': ['runInPlace', 'sitUp', 'pushUp', 'trunkBend', 'multiRun']
    };
    
    // استخدام الترتيب المحدد للمرحلة التعليمية
    const orderedTestIds = testOrder[level] || [];
    
    // إضافة عناوين الاختبارات بالترتيب المحدد
    orderedTestIds.forEach(testId => {
        // البحث عن الاختبار في مصفوفة الاختبارات للحصول على الاسم الصحيح
        const test = tests[level].find(t => t.id === testId);
        if (test) {
            headers += `<th>${test.name} - متوسط</th><th>${test.name} - درجة</th>`;
        }
    });
    
    return headers;
}

// Helper function to generate HTML for test scores
function getTestScoresHTML(student) {
    if (!student || !student.educationLevel || !tests[student.educationLevel]) return '';
    
    let scoresHTML = '';
    
    // منطقي أن يكون لكل طالب معلومات لجميع الاختبارات الخاصة بالمرحلة التعليمية
    const level = student.educationLevel;
    
    const testOrder = {
        'primary': ['runInPlace', 'sitUp', 'pushUp', 'jumpInCircle', 'shuttleRun'],
        'middle': ['runInPlace', 'sitUp', 'pushUp', 'jumpFromStability', 'zigzagRun'],
        'high': ['runInPlace', 'sitUp', 'pushUp', 'trunkBend', 'multiRun']
    };
    
    // استخدام الترتيب المحدد للمرحلة التعليمية
    const orderedTestIds = testOrder[level] || [];
    
    // إضافة درجات الاختبارات بالترتيب المحدد
    orderedTestIds.forEach(testId => {
        if (student.tests[testId]) {
            const testData = student.tests[testId];
            scoresHTML += `<td>${testData.average.toFixed(2)}</td><td>${testData.score.toFixed(2)}</td>`;
        } else {
            // إذا لم تكن معلومات الاختبار متوفرة
            scoresHTML += `<td>0.00</td><td>0.00</td>`;
        }
    });
    
    return scoresHTML;
}

// Print all reports
function printAllReports() {
    try {
        console.log('Starting print reports function');
        
        // Get the selected report year
        const reportYear = document.getElementById('reportYear').value;
        if (!reportYear) {
            alert('الرجاء اختيار السنة أولاً');
            return;
        }
        
        // Get data for the selected report year
        const reportData = fitnessDB.getStudentsByYear(reportYear);
        
        if (!reportData || reportData.length === 0) {
            alert('لا توجد بيانات متاحة للسنة المختارة');
            return;
        }
        
        console.log(`Preparing print data for year ${reportYear}, found ${reportData.length} students`);
        
        // Group students by region
        const regionData = {};
        reportData.forEach(student => {
            if (!regionData[student.region]) {
                regionData[student.region] = {
                    students: [],
                    totalScore: 0,
                    coreTestsTotal: 0
                };
            }
            regionData[student.region].students.push(student);
            regionData[student.region].totalScore += student.totalScore;
            regionData[student.region].coreTestsTotal += student.coreTestsScore;
        });
        
        // Sort regions by total score
        const sortedRegions = Object.keys(regionData).sort((a, b) => {
            return regionData[b].totalScore - regionData[a].totalScore;
        });
        
        // Sort students within each region
        Object.keys(regionData).forEach(region => {
            regionData[region].students.sort((a, b) => a.ranking - b.ranking);
        });
        
        // Prepare top 10 students
        const allStudents = [...reportData];
        
        // Sort all students by total score (descending)
        allStudents.sort((a, b) => {
            // First sort by total score (descending)
            if (b.totalScore !== a.totalScore) {
                return b.totalScore - a.totalScore;
            }
            // If tied, sort by core tests score (descending)
            return b.coreTestsScore - a.coreTestsScore;
        });
        
        // Take top 10 (or less if not enough data)
        const topStudents = allStudents.slice(0, 10);
        
        // Create a new window for printing
        let printWindow = null;
        try {
            printWindow = window.open('', '_blank', 'width=1200,height=800');
        } catch (windowError) {
            console.error('Error opening print window:', windowError);
            alert('فشل في فتح نافذة الطباعة. يرجى التأكد من السماح بفتح النوافذ المنبثقة في المتصفح.');
            return;
        }
        
        if (!printWindow) {
            alert('يرجى السماح بفتح النوافذ المنبثقة لعرض التقرير');
            return;
        }
        
        // Generate HTML content for the print window
        let printContent = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>تقارير اختبارات اللياقة البدنية - ${reportYear}</title>
                <style>
                    @page { 
                        size: landscape; 
                        margin: 1.5cm 1cm;
                    }
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 0;
                        margin: 0;
                        direction: rtl;
                    }
                    .page-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 20px;
                    }
                    .header-content {
                        text-align: right;
                        flex-grow: 1;
                        margin-right: 20px;
                    }
                    .azhar-logo {
                        width: 60px;
                        height: 60px;
                        order: 2;
                    }
                    .summary-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        direction: rtl;
                    }
                    .summary-table td {
                        border: 1px solid #000;
                        padding: 8px;
                        text-align: center;
                    }
                    .summary-table tr td:first-child {
                        border-right: 2px solid #000;
                    }
                    .summary-table tr td:last-child {
                        border-left: 2px solid #000;
                    }
                    .boys-cell {
                        background-color: #f8d7b4;
                        width: 15%;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 20px;
                        direction: rtl;
                    }
                    th, td { 
                        border: 1px solid #000; 
                        padding: 6px; 
                        text-align: center; 
                        font-size: 12px;
                    }
                    th { 
                        background-color: #f2f2f2; 
                    }
                    .region-report, .top-students-report { 
                        page-break-before: always;
                    }
                    .region-report:first-of-type {
                        page-break-before: avoid;
                    }
                    @media print {
                        thead {
                            display: table-header-group;
                        }
                        tr {
                            page-break-inside: avoid;
                        }
                    }
                </style>
            </head>
            <body>
                <!-- Summary Page -->
                <div class="summary-page">
                    <div class="page-header">
                        <div class="header-content">
                            <div>الأزهر الشريف</div>
                            <div>الإدارة المركزية لرعاية الطلاب</div>
                            <div>الإدارة العامة للرعاية الرياضية</div>
                            <div>اللياقة البدنية</div>
                        </div>
                        <img src="logo.png" alt="شعار الأزهر" class="azhar-logo">
                    </div>
                    <table class="summary-table">
                        <tr>
                            <td class="boys-cell">فتيات</td>
                            <td colspan="3">نتيجة المشروع القومى للياقة البدنية بالأزهر الشريف للعام الدراسى ${reportYear}</td>
                        </tr>
                        <tr>
                            <td>المنطقة</td>
                            <td>الترتيب</td>
                            <td>المجموع</td>
                            <td>مجموع الاختبارات الأساسية</td>
                        </tr>
                        ${sortedRegions.map((region, index) => `
                            <tr>
                                <td>${region}</td>
                                <td>${index + 1}</td>
                                <td>${regionData[region].totalScore.toFixed(2)}</td>
                                <td>${regionData[region].coreTestsTotal.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>`;
        
        // Add each region to the print content
        sortedRegions.forEach((region, index) => {
            const regionTotalScore = regionData[region].totalScore;
            const regionCoreTestsTotal = regionData[region].coreTestsTotal;
            
            printContent += `
                <div class="region-report">
                    <div class="page-header">
                        <div class="header-content">
                            <div>الأزهر الشريف</div>
                            <div>الإدارة المركزية لرعاية الطلاب</div>
                            <div>الإدارة العامة للرعاية الرياضية</div>
                            <div>اللياقة البدنية</div>
                        </div>
                        <img src="logo.png" alt="شعار الأزهر" class="azhar-logo">
                    </div>
                    
                    <table class="summary-table">
                        <tr>
                            <td class="boys-cell">فتيات</td>
                            <td colspan="3">نتيجة المشروع القومى للياقة البدنية بالأزهر الشريف للعام الدراسى ${reportYear}</td>
                        </tr>
                        <tr>
                            <td>المنطقة</td>
                            <td>الترتيب</td>
                            <td>المجموع</td>
                            <td>مجموع الاختبارات الأساسية</td>
                        </tr>
                        <tr>
                            <td>${region}</td>
                            <td>${index + 1}</td>
                            <td>${regionTotalScore.toFixed(2)}</td>
                            <td>${regionCoreTestsTotal.toFixed(2)}</td>
                        </tr>
                    </table>

                    <table>
                        <thead>
                            <tr>
                                <th>الكود</th>
                                <th>الاسم</th>
                                <th>الرقم القومي</th>
                                <th>الإدارة</th>
                                <th>المعهد</th>
                                <th>المرحلة</th>
                                ${getTestHeadersHTML(regionData[region].students[0]?.educationLevel || 'primary')}
                                <th>المجموع</th>
                                <th>المجموع الأساسي</th>
                                <th>الترتيب</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${regionData[region].students.map(student => `
                                <tr>
                                    <td>${student.code}</td>
                                    <td>${student.name}</td>
                                    <td>${student.nationalId}</td>
                                    <td>${student.administration}</td>
                                    <td>${student.institute}</td>
                                    <td>${getEducationLevelName(student.educationLevel)}</td>
                                    ${getTestScoresHTML(student)}
                                    <td>${student.totalScore.toFixed(2)}</td>
                                    <td>${student.coreTestsScore.toFixed(2)}</td>
                                    <td>${student.ranking}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`;
        });
        
        // Add top 10 students report at the end
        printContent += `
            <div class="top-students-report">
                <div class="page-header">
                    <div class="header-content">
                        <div>الأزهر الشريف</div>
                        <div>الإدارة المركزية لرعاية الطلاب</div>
                        <div>الإدارة العامة للرعاية الرياضية</div>
                        <div>اللياقة البدنية</div>
                    </div>
                    <img src="logo.png" alt="شعار الأزهر" class="azhar-logo">
                </div>
                
                <table class="summary-table">
                    <tr>
                        <td class="boys-cell">فتيات</td>
                        <td colspan="3">نتيجة المشروع القومى للياقة البدنية بالأزهر الشريف للعام الدراسى ${reportYear}</td>
                    </tr>
                    <tr>
                        <td colspan="4">أفضل 10 طلاب على مستوى الجمهورية</td>
                    </tr>
                </table>

                <table>
                    <thead>
                        <tr>
                            <th>الكود</th>
                            <th>الاسم</th>
                            <th>الرقم القومي</th>
                            <th>المنطقة</th>
                            <th>الإدارة</th>
                            <th>المعهد</th>
                            <th>المرحلة</th>
                            ${topStudents.length > 0 ? getTestHeadersHTML(topStudents[0]?.educationLevel || 'primary') : ''}
                            <th>المجموع</th>
                            <th>المجموع الأساسي</th>
                            <th>الترتيب</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topStudents.map((student, index) => `
                            <tr>
                                <td>${student.code}</td>
                                <td>${student.name}</td>
                                <td>${student.nationalId}</td>
                                <td>${student.region}</td>
                                <td>${student.administration}</td>
                                <td>${student.institute}</td>
                                <td>${getEducationLevelName(student.educationLevel)}</td>
                                ${getTestScoresHTML(student)}
                                <td>${student.totalScore.toFixed(2)}</td>
                                <td>${student.coreTestsScore.toFixed(2)}</td>
                                <td>${index + 1}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
        
        printContent += `
                <script>
                    window.onload = function() {
                        console.log('Print window loaded, preparing to print...');
                        setTimeout(function() {
                            try {
                                window.print();
                                console.log('Print command executed');
                            } catch(e) {
                                console.error('Error during print:', e);
                                alert('حدث خطأ أثناء الطباعة: ' + e.message);
                            }
                        }, 1500);
                    };
                </script>
            </body>
            </html>`;
        
        // Write to the print window
        try {
            printWindow.document.open();
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            console.log('Print window content written successfully');
        } catch (writeError) {
            console.error('Error writing to print window:', writeError);
            alert('حدث خطأ أثناء إعداد نافذة الطباعة. يرجى المحاولة مرة أخرى.');
            
            // Try to close the window if it was opened
            if (printWindow) {
                try {
                    printWindow.close();
                } catch (closeError) {
                    console.error('Error closing print window:', closeError);
                }
            }
        }
    } catch (error) {
        console.error('Error in print function:', error);
        alert('حدث خطأ أثناء إنشاء التقرير. يرجى المحاولة مرة أخرى.');
    }
}

// Excel export/import functions
function exportExcelTemplate() {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Get the current education level and year
    const level = document.getElementById('educationLevel').value || 'primary';
    const selectedYear = document.getElementById('testYear').value;
    
    console.log(`Exporting Excel template for level: ${level}, year: ${selectedYear}`);
    
    // Create headers for student info
    const studentInfoHeaders = [
        'الكود', 'الاسم', 'الرقم القومي', 'المنطقة', 'الإدارة', 'المعهد', 'المرحلة التعليمية'
    ];
    
    // Create headers for test results based on education level
    const testHeaders = [];
    if (tests[level]) {
        // ترتيب الاختبارات حسب المرحلة التعليمية
        const testOrder = {
            'primary': ['runInPlace', 'sitUp', 'pushUp', 'jumpInCircle', 'shuttleRun'],
            'middle': ['runInPlace', 'sitUp', 'pushUp', 'jumpFromStability', 'zigzagRun'],
            'high': ['runInPlace', 'sitUp', 'pushUp', 'trunkBend', 'multiRun']
        };
        
        // استخدام الترتيب المحدد للمرحلة التعليمية
        const orderedTestIds = testOrder[level] || [];
        
        // إضافة عناوين الاختبارات بالترتيب المحدد
        orderedTestIds.forEach(testId => {
            // البحث عن الاختبار في مصفوفة الاختبارات
            const test = tests[level].find(t => t.id === testId);
            if (test) {
                if (test.id === 'pushUp') {
                    // For push-up test, include three referees
                    testHeaders.push(`${test.name} - الحكم الأول`);
                    testHeaders.push(`${test.name} - الحكم الثاني`);
                    testHeaders.push(`${test.name} - الحكم الثالث`);
                } else {
                    // For other tests, include two referees
                    testHeaders.push(`${test.name} - الحكم الأول`);
                    testHeaders.push(`${test.name} - الحكم الثاني`);
                }
            }
        });
    }
    
    // Combine all headers
    const headers = [...studentInfoHeaders, ...testHeaders];
    
    // Create an empty row as an example
    const exampleRow = [
        '12345', 'اسم الطالب', '1234567890123', 'المنطقة', 'الإدارة', 'المعهد', level
    ];
    
    // Add empty cells for test results
    for (let i = 0; i < testHeaders.length; i++) {
        exampleRow.push('');
    }
    
    // Create worksheet with headers and example row
    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'بيانات الطلاب');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, 'نموذج_بيانات_اللياقة_البدنية.xlsx');
}

// Import data from Excel file
function importExcelData() {
    console.log('Starting Excel import function');
    
    try {
        const fileInput = document.getElementById('excelFileInput');
        
        if (!fileInput) {
            console.error('Excel file input not found');
            alert('عنصر إدخال ملف الإكسل غير موجود في الصفحة');
            return;
        }
        
        if (!fileInput.files.length) {
            alert('الرجاء اختيار ملف إكسل أولاً');
            return;
        }
        
        // Check if XLSX is available
        if (typeof XLSX === 'undefined') {
            console.error('XLSX library is not available');
            alert('مكتبة XLSX غير متوفرة. يرجى تحديث الصفحة أو التحقق من تحميل المكتبة بشكل صحيح.');
            return;
        }
        
        // Get the currently selected year
        const selectedYear = document.getElementById('testYear').value;
        if (!selectedYear) {
            alert('الرجاء اختيار سنة الاختبار أولاً');
            return;
        }
        
        console.log(`Importing Excel data for year: ${selectedYear}`);
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            let importedCount = 0;
            let success = false;
            
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Get the first sheet
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (jsonData.length < 2) {
                    alert('الملف لا يحتوي على بيانات كافية');
                    return;
                }
                
                // Get headers
                const headers = jsonData[0];
                console.log('Excel headers:', headers);
                
                // Process each row (skip header row)
                let importedStudents = [];
                
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row.length < 7) {
                        console.warn(`Skipping row ${i+1} as it has insufficient data (${row.length} columns)`);
                        continue; // Skip incomplete rows
                    }
                    
                    // Create student object
                    const studentInfo = {
                        id: Date.now() + i, // Generate a unique ID
                        code: row[0] ? String(row[0]).trim() : '',
                        name: row[1] ? String(row[1]).trim() : '',
                        nationalId: row[2] ? String(row[2]).trim() : '',
                        region: row[3] ? String(row[3]).trim() : '',
                        administration: row[4] ? String(row[4]).trim() : '',
                        institute: row[5] ? String(row[5]).trim() : '',
                        educationLevel: row[6] ? String(row[6]).trim() : 'primary',
                        testYear: selectedYear,
                        tests: {},
                        totalScore: 0,
                        coreTestsScore: 0
                    };
                    
                    // Skip if required fields are missing
                    if (!studentInfo.code || !studentInfo.name) {
                        console.warn(`Skipping row ${i+1} due to missing required fields (code or name)`);
                        continue;
                    }
                    
                    // Validate education level
                    if (!['primary', 'middle', 'high'].includes(studentInfo.educationLevel)) {
                        console.warn(`Fixing invalid education level '${studentInfo.educationLevel}' to 'primary' for student ${studentInfo.name}`);
                        studentInfo.educationLevel = 'primary';
                    }
                    
                    // Process test scores
                    if (tests[studentInfo.educationLevel]) {
                        let columnIndex = 7; // Start index after the student info (7 columns)
                        let coreTestsTotal = 0;
                        
                        tests[studentInfo.educationLevel].forEach(test => {
                            // For push-up test, we need 3 columns (3 referees)
                            // For other tests, we need 2 columns (2 referees)
                            if (test.id === 'pushUp') {
                                const judge1Index = columnIndex;
                                const judge2Index = columnIndex + 1;
                                const judge3Index = columnIndex + 2;
                                
                                if (row[judge1Index] !== undefined && row[judge2Index] !== undefined) {
                                    const judge1 = parseFloat(row[judge1Index]) || 0;
                                    const judge2 = parseFloat(row[judge2Index]) || 0;
                                    
                                    // Check if third referee data exists
                                    if (row[judge3Index] !== undefined) {
                                        const judge3 = parseFloat(row[judge3Index]) || 0;
                                        const average = (judge1 + judge2 + judge3) / 3;
                                        
                                        // Calculate score
                                        const thresholds = getTestThresholds(test.id, studentInfo.educationLevel);
                                        let score = 0;
                                        
                                        // Push-up scores are higher = better
                                        for (let j = 0; j < thresholds.length; j++) {
                                            if (average > thresholds[j]) {
                                                // تحديد الدرجة بناءً على طول المصفوفة
                                                score = thresholds.length >= 20 ? (20 - j) / 2 : 10 - j;
                                                break;
                                            }
                                        }
                                        
                                        // Save with three referees
                                        studentInfo.tests[test.id] = { 
                                            judge1, 
                                            judge2, 
                                            judge3, 
                                            average, 
                                            score 
                                        };
                                        
                                        studentInfo.totalScore += score;
                                        if (test.isCore) {
                                            coreTestsTotal += average;
                                        }
                                    } else {
                                        // If third referee is missing, fall back to two referees
                                        const average = (judge1 + judge2) / 2;
                                        
                                        // Calculate score
                                        const thresholds = getTestThresholds(test.id, studentInfo.educationLevel);
                                        let score = 0;
                                        
                                        // Push-up scores are higher = better
                                        for (let j = 0; j < thresholds.length; j++) {
                                            if (average > thresholds[j]) {
                                                // تحديد الدرجة بناءً على طول المصفوفة
                                                score = thresholds.length >= 20 ? (20 - j) / 2 : 10 - j;
                                                break;
                                            }
                                        }
                                        
                                        studentInfo.tests[test.id] = { 
                                            judge1, 
                                            judge2, 
                                            average, 
                                            score 
                                        };
                                        
                                        studentInfo.totalScore += score;
                                        if (test.isCore) {
                                            coreTestsTotal += average;
                                        }
                                    }
                                }
                                
                                // Move column index by 3 for push-up test
                                columnIndex += 3;
                            } else {
                                // Regular tests with 2 referees
                                const judge1Index = columnIndex;
                                const judge2Index = columnIndex + 1;
                                
                                if (row[judge1Index] !== undefined && row[judge2Index] !== undefined) {
                                    const judge1 = parseFloat(row[judge1Index]) || 0;
                                    const judge2 = parseFloat(row[judge2Index]) || 0;
                                    const average = (judge1 + judge2) / 2;
                                    
                                    // Calculate score
                                    const thresholds = getTestThresholds(test.id, studentInfo.educationLevel);
                                    let score = 0;
                                    
                                    // For timed tests, lower times are better
                                    if (test.id === 'jumpInCircle' || test.id === 'multiRun' || 
                                        test.id === 'zigzagRun' || test.id === 'shuttleRun') {
                                        for (let j = 0; j < thresholds.length; j++) {
                                            if (average < thresholds[j]) {
                                                // تحديد الدرجة بناءً على طول المصفوفة
                                                score = thresholds.length >= 20 ? (20 - j) / 2 : 10 - j;
                                                break;
                                            }
                                        }
                                    } else {
                                        // For other tests, higher values are better
                                        for (let j = 0; j < thresholds.length; j++) {
                                            if (average > thresholds[j]) {
                                                // تحديد الدرجة بناءً على طول المصفوفة
                                                score = thresholds.length >= 20 ? (20 - j) / 2 : 10 - j;
                                                break;
                                            }
                                        }
                                    }
                                    
                                    studentInfo.tests[test.id] = { 
                                        judge1, 
                                        judge2, 
                                        average, 
                                        score 
                                    };
                                    
                                    studentInfo.totalScore += score;
                                    if (test.isCore) {
                                        coreTestsTotal += average;
                                    }
                                }
                                
                                // Move column index by 2 for regular tests
                                columnIndex += 2;
                            }
                        });
                        
                        // تحديث مجموع متوسطات الاختبارات الأساسية
                        studentInfo.coreTestsScore = coreTestsTotal;
                        console.log(`Processed student ${studentInfo.name} (${studentInfo.code}): totalScore=${studentInfo.totalScore}, coreTestsScore=${coreTestsTotal}`);
                    }
                    
                    // Add to imported students array
                    importedStudents.push(studentInfo);
                    importedCount++;
                }
                
                if (importedCount === 0) {
                    alert('لم يتم استيراد أي بيانات من الملف. يرجى التحقق من تنسيق الملف.');
                    return;
                }
                
                console.log(`Successfully processed ${importedCount} students from Excel file`);
                
                // Save each student to the database
                importedStudents.forEach(student => {
                    try {
                        fitnessDB.saveStudent(student, selectedYear);
                    } catch (dbError) {
                        console.error('Error saving student to database:', dbError);
                    }
                });
                
                success = true;
                
            } catch (error) {
                console.error('Error importing Excel file:', error);
                alert('حدث خطأ أثناء قراءة ملف الإكسل: ' + error.message);
                return;
            }
            
            if (success && importedCount > 0) {
                // Get updated students data from the database for the current year
                studentsData = fitnessDB.getStudentsByYear(selectedYear);
                
                // Recalculate core test scores to ensure they're correct
                recalculateCoreTestsScores();
                
                // Update rankings
                updateRankings();
                
                try {
                    // Load first student if available
                    if (studentsData.length > 0) {
                        currentStudentIndex = 0;
                        loadStudentData(studentsData[0]);
                        updateNavigationButtons();
                    }
                    
                    // Update year display in the header
                    updateYearDisplay();
                    
                    // Clear file input
                    fileInput.value = '';
                    
                    alert(`تم استيراد ${importedCount} طالب بنجاح`);
                } catch (uiUpdateError) {
                    console.error('Error updating UI components:', uiUpdateError);
                    alert(`تم استيراد ${importedCount} طالب بنجاح، ولكن حدث خطأ في تحديث الواجهة. يرجى تحديث الصفحة.`);
                }
            }
        };
        
        reader.onerror = function(error) {
            console.error('Error reading file:', error);
            alert('حدث خطأ أثناء قراءة الملف');
        };
        
        reader.readAsArrayBuffer(file);
        
    } catch (mainError) {
        console.error('Critical error in Excel import function:', mainError);
        alert('حدث خطأ في وظيفة استيراد الإكسل: ' + mainError.message);
    }
}

// Helper function to get education level name in Arabic
function getEducationLevelName(level) {
    const levelNames = {
        'primary': 'ابتدائي',
        'middle': 'إعدادي',
        'high': 'ثانوي'
    };
    return levelNames[level] || level;
}

// تحديث بيانات الطالب
function updateStudentData() {
    // التحقق من وجود طالب حالي
    if (!currentStudent || !currentStudent.id) {
        alert('الرجاء اختيار طالب أولاً ليتم تحديث بياناته');
        return;
    }
    
    const level = document.getElementById('educationLevel').value;
    if (!level || !tests[level]) {
        alert('الرجاء اختيار المرحلة التعليمية أولاً');
        return;
    }
    
    // الحصول على السنة المختارة
    const year = document.getElementById('testYear').value;
    if (!year) {
        alert('الرجاء اختيار سنة الاختبار');
        return;
    }
    
    // جمع بيانات الطالب
    const studentInfo = {
        id: currentStudent.id, // الحفاظ على الـ ID الأصلي
        code: document.getElementById('studentCode').value,
        name: document.getElementById('studentName').value,
        nationalId: document.getElementById('nationalId').value,
        region: document.getElementById('region').value,
        administration: document.getElementById('administration').value,
        institute: document.getElementById('institute').value,
        educationLevel: level,
        testYear: year,
        tests: {},
        totalScore: parseFloat(document.getElementById('totalScore').textContent) || 0,
        coreTestsScore: 0 // سيتم حسابها من مجموع متوسطات الاختبارات الأساسية
    };
    
    // التحقق من الحقول المطلوبة
    if (!studentInfo.code || !studentInfo.name || !studentInfo.nationalId || 
        !studentInfo.region || !studentInfo.administration || !studentInfo.institute) {
        alert('الرجاء إدخال جميع البيانات المطلوبة');
        return;
    }
    
    // التحقق من عدم تكرار الكود (إذا تم تغييره)
    if (studentInfo.code !== currentStudent.code) {
        const existingStudents = fitnessDB.getStudentsByYear(year);
        const studentWithSameCode = existingStudents.find(student => 
            student.code === studentInfo.code && student.id !== currentStudent.id
        );
        
        if (studentWithSameCode) {
            alert(`الكود ${studentInfo.code} مستخدم بالفعل للطالب ${studentWithSameCode.name}. الرجاء استخدام كود آخر.`);
            return;
        }
    }
    
    let coreTestsTotal = 0;
    
    tests[level].forEach(test => {
        const judge1 = parseFloat(document.querySelector(`.judge1[data-test="${test.id}"]`).value) || 0;
        const judge2 = parseFloat(document.querySelector(`.judge2[data-test="${test.id}"]`).value) || 0;
        const average = parseFloat(document.getElementById(`${test.id}Average`).textContent) || 0;
        const score = parseFloat(document.getElementById(`${test.id}Score`).textContent) || 0;
        
        // All tests now use two referees only
        studentInfo.tests[test.id] = { judge1, judge2, average, score };
        
        // جمع متوسطات الاختبارات الأساسية فقط
        if (test.isCore) {
            // جمع متوسط الاختبار (القيمة الخام) وليس الدرجة
            coreTestsTotal += average;
        }
    });
    
    // تحديث مجموع متوسطات الاختبارات الأساسية
    studentInfo.coreTestsScore = coreTestsTotal;
    
    // حفظ في قاعدة البيانات حسب السنة
    fitnessDB.saveStudent(studentInfo, year);
    
    // الحصول على بيانات الطلاب المحدثة للسنة الحالية
    studentsData = fitnessDB.getStudentsByYear(year);
    
    // البحث عن فهرس الطالب المحفوظ
    const savedIndex = studentsData.findIndex(student => student.id === studentInfo.id);
    if (savedIndex >= 0) {
        currentStudentIndex = savedIndex;
    }
    
    // تحديث الترتيب
    updateRankings();
    
    // تحديث الطالب الحالي
    currentStudent = studentInfo;
    updateNavigationButtons();
    
    alert('تم تحديث بيانات الطالب بنجاح');
}

// Search student by code
function searchStudentByCode() {
    const searchCode = document.getElementById('searchCode').value.trim();
    if (!searchCode) {
        alert('الرجاء إدخال الكود للبحث');
        return;
    }
    
    const selectedYear = document.getElementById('testYear').value;
    if (!selectedYear) {
        alert('الرجاء اختيار سنة الاختبار أولاً');
        return;
    }
    
    // Search for student in current year's data
    const foundIndex = studentsData.findIndex(student => student.code === searchCode);
    
    if (foundIndex >= 0) {
        currentStudentIndex = foundIndex;
        loadStudentData(studentsData[foundIndex]);
        updateNavigationButtons();
    } else {
        alert(`لم يتم العثور على طالب بكود: ${searchCode}`);
    }
}

// Export entire database as JSON file
function exportDatabase() {
    try {
        fitnessDB.downloadDatabase();
        alert('تم تصدير البيانات بنجاح. يرجى الاحتفاظ بهذا الملف كنسخة احتياطية.');
    } catch (error) {
        console.error('Error exporting database:', error);
        alert('حدث خطأ أثناء تصدير البيانات.');
    }
}

// Import database from JSON file
function importDatabase() {
    try {
        const fileInput = document.getElementById('databaseFileInput');
        
        if (!fileInput.files || fileInput.files.length === 0) {
            alert('الرجاء اختيار ملف البيانات أولاً');
            return;
        }
        
        const file = fileInput.files[0];
        if (!file.name.endsWith('.json')) {
            alert('الرجاء اختيار ملف JSON صالح');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const result = fitnessDB.importDatabase(e.target.result);
                
                if (result) {
                    // Reload data for current year
                    const currentYear = document.getElementById('testYear').value;
                    if (currentYear) {
                        studentsData = fitnessDB.getStudentsByYear(currentYear);
                        recalculateCoreTestsScores();
                        updateRankings();
                        
                        // Load first student if available
                        if (studentsData.length > 0) {
                            currentStudentIndex = 0;
                            loadStudentData(studentsData[0]);
                        } else {
                            resetForm();
                            currentStudentIndex = 0;
                        }
                        
                        updateNavigationButtons();
                    }
                    
                    alert('تم استيراد البيانات بنجاح');
                    fileInput.value = ''; // Clear the file input
                } else {
                    alert('فشل استيراد البيانات. الرجاء التأكد من صحة الملف.');
                }
            } catch (error) {
                console.error('Error in file reading callback:', error);
                alert('حدث خطأ أثناء قراءة الملف. الرجاء التأكد من صحة الملف.');
            }
        };
        
        reader.onerror = function() {
            alert('حدث خطأ أثناء قراءة الملف');
        };
        
        reader.readAsText(file);
    } catch (error) {
        console.error('Error importing database:', error);
        alert('حدث خطأ أثناء استيراد البيانات.');
    }
}

// Restore database from backup
function restoreDatabase() {
    try {
        const result = fitnessDB.restoreFromBackup();
        
        if (result) {
            // Reload data for current year
            const currentYear = document.getElementById('testYear').value;
            if (currentYear) {
                studentsData = fitnessDB.getStudentsByYear(currentYear);
                recalculateCoreTestsScores();
                updateRankings();
                
                // Load first student if available
                if (studentsData.length > 0) {
                    currentStudentIndex = 0;
                    loadStudentData(studentsData[0]);
                } else {
                    resetForm();
                    currentStudentIndex = 0;
                }
                
                updateNavigationButtons();
            }
            
            alert('تم استعادة البيانات من النسخة الاحتياطية بنجاح');
        } else {
            alert('لم يتم العثور على نسخة احتياطية أو حدث خطأ أثناء الاستعادة');
        }
    } catch (error) {
        console.error('Error restoring database:', error);
        alert('حدث خطأ أثناء استعادة البيانات.');
    }
}