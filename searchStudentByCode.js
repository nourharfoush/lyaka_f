// Search student by code function
function searchStudentByCode() {
    const searchCode = document.getElementById('searchCode').value.trim();
    if (!searchCode) {
        alert('الرجاء إدخال كود الطالب للبحث');
        return;
    }
    
    // Get the currently selected year
    const selectedYear = document.getElementById('testYear').value;
    if (!selectedYear) {
        alert('الرجاء اختيار سنة الاختبار أولاً');
        return;
    }

    
    // Debug log to check search code
    console.log('Searching for code:', searchCode, 'in year:', selectedYear);
    console.log('Available students:', studentsData.length);
    
    // Improved search to handle case insensitivity and trim whitespace
    // Also convert codes to string to ensure proper comparison
    const foundIndex = studentsData.findIndex(student => {
        // Debug log to check each student code during search
        console.log('Comparing with:', student.code, typeof student.code);
        return student.code && student.code.toString().trim().toLowerCase() === searchCode.toLowerCase();
    });
    
    console.log('Found index:', foundIndex);
    
    if (foundIndex >= 0) {
        currentStudentIndex = foundIndex;
        const student = studentsData[foundIndex];
        
        // Load the student data
        loadStudentData(student);
        
        // Update navigation buttons
        updateNavigationButtons();
        
        // Update ranking display
        document.getElementById('ranking').textContent = student.ranking || '';
    } else {
        // Log for debugging
        console.log('Search failed for code:', searchCode, 'in year:', selectedYear);
        console.log('Available codes:', studentsData.map(s => s.code));
        
        // Clear any previous student data to avoid confusion
        resetForm();
        
        // Show alert message
        alert('لم يتم العثور على طالب بهذا الكود في سنة ' + selectedYear);
    }
}