// Database management for Fitness Test Data System

// Main database object to store data by year
let fitnessDatabase = {};

// Current active year for the application
let currentActiveYear = new Date().getFullYear().toString();

// Initialize database from localStorage
function initDatabase() {
    const savedDatabase = localStorage.getItem('fitnessDatabase');
    if (savedDatabase) {
        fitnessDatabase = JSON.parse(savedDatabase);
    }
    
    // Ensure we have an entry for the current year
    if (!fitnessDatabase[currentActiveYear]) {
        fitnessDatabase[currentActiveYear] = [];
    }
    
    return fitnessDatabase;
}

// Save database to localStorage
function saveDatabase() {
    try {
        // تعريف الاختبارات الأساسية مباشرة هنا بدلاً من الاعتماد على متغير tests العام
        const coreTests = {
            'primary': ['runInPlace', 'sitUp', 'pushUp'],
            'middle': ['runInPlace', 'sitUp', 'pushUp'],
            'high': ['runInPlace', 'sitUp', 'pushUp']
        };
        
        // تصحيح قيم coreTestsScore إذا لزم الأمر
        Object.keys(fitnessDatabase).forEach(year => {
            fitnessDatabase[year].forEach(student => {
                if (student.tests && student.educationLevel) {
                    let coreTestsTotal = 0;
                    
                    // إذا كان المستوى التعليمي للطالب له اختبارات أساسية محددة
                    if (coreTests[student.educationLevel]) {
                        coreTests[student.educationLevel].forEach(testId => {
                            if (student.tests[testId] && student.tests[testId].average !== undefined) {
                                coreTestsTotal += student.tests[testId].average;
                            }
                        });
                        
                        // تحديث قيمة coreTestsScore إذا كانت مختلفة عن المجموع المحسوب
                        if (student.coreTestsScore !== coreTestsTotal) {
                            console.log(`Fixing student ${student.name} (${student.code}): coreTestsScore from ${student.coreTestsScore} to ${coreTestsTotal}`);
                            student.coreTestsScore = coreTestsTotal;
                        }
                    }
                }
            });
        });
        
        localStorage.setItem('fitnessDatabase', JSON.stringify(fitnessDatabase));
        console.log('Database saved successfully');
        
        // حفظ نسخة احتياطية في ملف
        createBackupFile();
    } catch (error) {
        console.error('Error saving database:', error);
        // محاولة الحفظ بدون تصحيح البيانات في حالة وجود خطأ
        try {
            localStorage.setItem('fitnessDatabase', JSON.stringify(fitnessDatabase));
        } catch (fallbackError) {
            console.error('Critical error saving database:', fallbackError);
            // محاولة تنزيل البيانات كملف في حالة فشل الحفظ في localStorage
            downloadDatabaseAsFile();
        }
    }
}

// تصدير البيانات كملف JSON للتخزين الدائم
function downloadDatabaseAsFile() {
    try {
        const dataStr = JSON.stringify(fitnessDatabase);
        const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `database_${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        console.log('Database exported as file successfully');
    } catch (error) {
        console.error('Error exporting database:', error);
        alert('حدث خطأ أثناء تصدير البيانات. يرجى المحاولة مرة أخرى.');
    }
}

// إنشاء نسخة احتياطية تلقائيًا كل فترة زمنية
function createBackupFile() {
    try {
        // التحقق من تاريخ آخر نسخة احتياطية
        const lastBackupDate = localStorage.getItem('lastBackupDate');
        const currentDate = new Date().toISOString().slice(0, 10);
        
        // إنشاء نسخة احتياطية إذا لم يتم عمل نسخة احتياطية اليوم أو إذا لم تكن هناك نسخة احتياطية سابقة
        if (!lastBackupDate || lastBackupDate !== currentDate) {
            // تحديث تاريخ آخر نسخة احتياطية
            localStorage.setItem('lastBackupDate', currentDate);
            
            // تخزين البيانات في ملف JSON في مجلد البيانات المحلية للمتصفح
            // لا يمكن عمل ذلك مباشرة بسبب قيود الأمان، لذا نقوم بتخزين نسخة إضافية في localStorage
            const compressedData = LZString.compressToUTF16(JSON.stringify(fitnessDatabase));
            localStorage.setItem('fitnessDatabase_backup_' + currentDate, compressedData);
            
            console.log('Automatic backup created successfully');
        }
    } catch (error) {
        console.error('Error creating backup:', error);
    }
}

// استيراد البيانات من ملف JSON
function importDatabaseFromFile(fileContent) {
    try {
        const importedData = JSON.parse(fileContent);
        
        // فحص صحة البيانات المستوردة
        if (typeof importedData === 'object') {
            // دمج البيانات المستوردة مع البيانات الحالية
            Object.keys(importedData).forEach(year => {
                if (!fitnessDatabase[year]) {
                    fitnessDatabase[year] = [];
                }
                
                // دمج الطلاب من البيانات المستوردة
                importedData[year].forEach(importedStudent => {
                    // البحث عن الطالب في البيانات الحالية
                    const existingIndex = fitnessDatabase[year].findIndex(s => s.code === importedStudent.code);
                    
                    if (existingIndex >= 0) {
                        // تحديث بيانات الطالب الموجود
                        fitnessDatabase[year][existingIndex] = importedStudent;
                    } else {
                        // إضافة طالب جديد
                        fitnessDatabase[year].push(importedStudent);
                    }
                });
            });
            
            // حفظ البيانات بعد الدمج
            saveDatabase();
            
            console.log('Database imported successfully');
            return true;
        } else {
            console.error('Invalid data format in the imported file');
            return false;
        }
    } catch (error) {
        console.error('Error importing database:', error);
        return false;
    }
}

// استرجاع البيانات من النسخ الاحتياطية المخزنة في localStorage
function restoreFromBackup() {
    try {
        // الحصول على قائمة النسخ الاحتياطية المتاحة
        const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('fitnessDatabase_backup_'));
        
        if (backupKeys.length === 0) {
            console.log('No backups found');
            return false;
        }
        
        // استرجاع أحدث نسخة احتياطية
        const latestBackupKey = backupKeys.sort().reverse()[0];
        const compressedData = localStorage.getItem(latestBackupKey);
        
        if (!compressedData) {
            console.log('Backup data not found');
            return false;
        }
        
        // فك ضغط البيانات واستيرادها
        const decompressedData = LZString.decompressFromUTF16(compressedData);
        const importedData = JSON.parse(decompressedData);
        
        if (typeof importedData === 'object') {
            fitnessDatabase = importedData;
            saveDatabase();
            console.log('Database restored from backup successfully');
            return true;
        } else {
            console.error('Invalid data format in the backup');
            return false;
        }
    } catch (error) {
        console.error('Error restoring from backup:', error);
        return false;
    }
}

// Get students data for a specific year
function getStudentsByYear(year) {
    if (!fitnessDatabase[year]) {
        fitnessDatabase[year] = [];
    }
    return fitnessDatabase[year];
}

// Save student data to the database for a specific year
function saveStudentToDatabase(student, year) {
    if (!fitnessDatabase[year]) {
        fitnessDatabase[year] = [];
    }
    
    // Check if student already exists in this year's data
    const existingIndex = fitnessDatabase[year].findIndex(s => s.id === student.id || s.code === student.code);
    
    if (existingIndex >= 0) {
        // Update existing student
        fitnessDatabase[year][existingIndex] = student;
    } else {
        // Add new student
        fitnessDatabase[year].push(student);
    }
    
    // Save to localStorage
    saveDatabase();
    
    return fitnessDatabase[year];
}

// Delete a student from the database for a specific year
function deleteStudentFromDatabase(studentCode, year) {
    if (!fitnessDatabase[year]) return false;
    
    const initialLength = fitnessDatabase[year].length;
    fitnessDatabase[year] = fitnessDatabase[year].filter(student => student.code !== studentCode);
    
    // Check if a student was actually removed
    if (fitnessDatabase[year].length < initialLength) {
        saveDatabase();
        return true;
    }
    
    return false;
}

// Delete all students for a specific year
function clearYearData(year) {
    if (fitnessDatabase[year]) {
        fitnessDatabase[year] = [];
        saveDatabase();
        return true;
    }
    return false;
}

// Get list of all years in the database
function getAvailableYears() {
    return Object.keys(fitnessDatabase).sort();
}

// Set the current active year for the application
function setActiveYear(year) {
    currentActiveYear = year;
    // Ensure we have an entry for this year
    if (!fitnessDatabase[year]) {
        fitnessDatabase[year] = [];
        saveDatabase();
    }
    return currentActiveYear;
}

// Get the current active year
function getActiveYear() {
    return currentActiveYear;
}

// إضافة مكتبة LZString لضغط البيانات
// من المفترض أن يتم تحميل المكتبة في ملف HTML
if (typeof LZString === 'undefined') {
    console.log('LZString library not found, creating a basic implementation');
    // تنفيذ أساسي في حالة عدم وجود المكتبة
    window.LZString = {
        compressToUTF16: function(input) {
            return input;
        },
        decompressFromUTF16: function(input) {
            return input;
        }
    };
}

// تحقق من وجود بيانات في localStorage عند بدء التشغيل
window.addEventListener('load', function() {
    if (!localStorage.getItem('fitnessDatabase')) {
        console.log('No database found in localStorage, checking for backups...');
        restoreFromBackup();
    }
});

// Export functions
window.fitnessDB = {
    init: initDatabase,
    getStudentsByYear,
    saveStudent: saveStudentToDatabase,
    deleteStudent: deleteStudentFromDatabase,
    clearYear: clearYearData,
    getYears: getAvailableYears,
    setActiveYear,
    getActiveYear,
    saveDatabase,
    downloadDatabase: downloadDatabaseAsFile,
    importDatabase: importDatabaseFromFile,
    restoreFromBackup
};