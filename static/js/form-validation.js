// التحقق من صحة البيانات في نماذج التعديل والتقييم

$(document).ready(function() {
    // تفعيل التحقق من صحة البيانات في Bootstrap
    enableFormValidation();
    
    // تحقق من صحة الرقم القومي
    $('#national_id').on('input', function() {
        validateNationalId($(this));
    });
    
    // تحقق من صحة كود الطالب
    $('#code').on('input', function() {
        validateStudentCode($(this));
    });
    
    // تحقق من صحة اسم الطالب
    $('#name').on('input', function() {
        validateStudentName($(this));
    });
    
    // تحقق من صحة قيم التقييم
    $('input[type="number"]').on('input', function() {
        validateEvaluationValue($(this));
    });
    
    // تحديث المعاهد عند تغيير المنطقة
    $('#region').change(function() {
        var regionId = $(this).val();
        if (regionId) {
            $.ajax({
                url: '/get_institutes/' + regionId,
                type: 'GET',
                success: function(data) {
                    updateInstitutes(data);
                }
            });
        } else {
            resetInstitutes();
        }
    });
});

// تفعيل التحقق من صحة البيانات في Bootstrap
function enableFormValidation() {
    // تعطيل التحقق الافتراضي للمتصفح
    $('form').attr('novalidate', true);
    
    // إضافة التحقق عند تقديم النموذج
    $('form').submit(function(event) {
        if (!this.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        $(this).addClass('was-validated');
    });
}

// التحقق من صحة الرقم القومي
function validateNationalId(input) {
    var value = input.val();
    var isValid = /^\d{14}$/.test(value);
    
    if (isValid) {
        input.removeClass('is-invalid').addClass('is-valid');
    } else {
        input.removeClass('is-valid').addClass('is-invalid');
    }
    
    return isValid;
}

// التحقق من صحة كود الطالب
function validateStudentCode(input) {
    var value = input.val();
    var isValid = value.length > 0;
    
    if (isValid) {
        input.removeClass('is-invalid').addClass('is-valid');
    } else {
        input.removeClass('is-valid').addClass('is-invalid');
    }
    
    return isValid;
}

// التحقق من صحة اسم الطالب
function validateStudentName(input) {
    var value = input.val();
    var isValid = value.length >= 3;
    
    if (isValid) {
        input.removeClass('is-invalid').addClass('is-valid');
    } else {
        input.removeClass('is-valid').addClass('is-invalid');
    }
    
    return isValid;
}

// التحقق من صحة قيم التقييم
function validateEvaluationValue(input) {
    var value = parseFloat(input.val());
    var min = parseFloat(input.attr('min'));
    var isValid = !isNaN(value) && value >= min;
    
    if (isValid) {
        input.removeClass('is-invalid').addClass('is-valid');
    } else {
        input.removeClass('is-valid').addClass('is-invalid');
    }
    
    return isValid;
}

// تحديث قائمة المعاهد
function updateInstitutes(data) {
    $('#institute').empty();
    $('#institute').append('<option value="">اختر المعهد...</option>');
    
    $.each(data, function(key, value) {
        $('#institute').append('<option value="' + value.id + '">' + value.name + '</option>');
    });
    
    $('#institute').prop('disabled', false);
}

// إعادة تعيين قائمة المعاهد
function resetInstitutes() {
    $('#institute').empty();
    $('#institute').append('<option value="">اختر المعهد...</option>');
    $('#institute').prop('disabled', true);
}