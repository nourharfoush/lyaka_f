$(document).ready(function() {
    // تحديث قائمة المعاهد عند اختيار منطقة
    $('#region').change(function() {
        var regionId = $(this).val();
        if (regionId) {
            $.ajax({
                url: '/get_institutes/' + regionId,
                type: 'GET',
                success: function(data) {
                    $('#institute').empty();
                    $('#institute').append('<option value="">اختر المعهد...</option>');
                    $.each(data, function(key, value) {
                        $('#institute').append('<option value="' + value.id + '">' + value.name + '</option>');
                    });
                }
            });
        } else {
            $('#institute').empty();
            $('#institute').append('<option value="">اختر المعهد...</option>');
        }
    });
    
    // تأكيد قبل الحذف
    $('.delete-btn').click(function() {
        return confirm('هل أنت متأكد من حذف هذا السجل؟');
    });
    
    // إدارة علامات التبويب في صفحة التقييم
    $('.nav-tabs a').click(function(e) {
        e.preventDefault();
        $(this).tab('show');
    });
});