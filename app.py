from flask import Flask, render_template, request, redirect, url_for, flash, send_file
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
import os
import pandas as pd
from io import BytesIO

app = Flask(__name__)
app.config.from_object('config.Config')
app.secret_key = app.config['SECRET_KEY']

# تكوين قاعدة البيانات
from database.models import db, Student, Evaluation, Region, Institute
db.init_app(app)

with app.app_context():
    db.create_all()

# دعم اللغة العربية و RTL
app.jinja_env.globals.update(dir='rtl')
app.jinja_env.globals.update(lang='ar')

# المسارات الرئيسية
@app.route('/')
def index():
    return render_template('index.html')

# مسارات إدارة الطلاب
@app.route('/students/add', methods=['GET', 'POST'])
def add_student():
    if request.method == 'POST':
        try:
            # جمع بيانات الطالب من النموذج
            student_data = {
                'code': request.form['code'],
                'name': request.form['name'],
                'region_id': request.form['region'],
                'administration': request.form['administration'],
                'institute_id': request.form['institute'],
                'national_id': request.form['national_id'],
                'stage': request.form['stage']
            }
            
            # إنشاء سجل الطالب
            new_student = Student(**student_data)
            db.session.add(new_student)
            db.session.commit()
            
            flash('تم إضافة الطالب بنجاح', 'success')
            return redirect(url_for('list_students'))
        
        except Exception as e:
            db.session.rollback()
            flash(f'حدث خطأ أثناء إضافة الطالب: {str(e)}', 'danger')
    
    # جلب المناطق والمعاهد لعرضها في النموذج
    regions = Region.query.all()
    institutes = Institute.query.all()
    return render_template('students/add.html', regions=regions, institutes=institutes)

@app.route('/students')
def list_students():
    students = Student.query.all()
    return render_template('students/list.html', students=students)

@app.route('/students/delete/<int:student_id>', methods=['POST'])
def delete_student(student_id):
    try:
        student = Student.query.get_or_404(student_id)
        
        # حذف تقييمات الطالب أولاً
        Evaluation.query.filter_by(student_id=student_id).delete()
        
        # ثم حذف الطالب
        db.session.delete(student)
        db.session.commit()
        
        flash('تم حذف الطالب بنجاح', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'حدث خطأ أثناء حذف الطالب: {str(e)}', 'danger')
    
    return redirect(url_for('list_students'))

@app.route('/students/delete-all', methods=['POST'])
def delete_all_students():
    try:
        # حذف جميع التقييمات أولاً
        Evaluation.query.delete()
        
        # ثم حذف جميع الطلاب
        Student.query.delete()
        
        db.session.commit()
        
        flash('تم حذف جميع الطلاب بنجاح', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'حدث خطأ أثناء حذف الطلاب: {str(e)}', 'danger')
    
    return redirect(url_for('list_students'))

@app.route('/students/edit/<int:student_id>', methods=['GET', 'POST'])
def edit_student(student_id):
    student = Student.query.get_or_404(student_id)
    
    if request.method == 'POST':
        try:
            # تحديث بيانات الطالب
            student.code = request.form['code']
            student.name = request.form['name']
            student.region_id = request.form['region']
            student.administration = request.form['administration']
            student.institute_id = request.form['institute']
            student.national_id = request.form['national_id']
            student.stage = request.form['stage']
            
            db.session.commit()
            
            flash('تم تحديث بيانات الطالب بنجاح', 'success')
            return redirect(url_for('view_student', student_id=student_id))
        
        except Exception as e:
            db.session.rollback()
            flash(f'حدث خطأ أثناء تحديث بيانات الطالب: {str(e)}', 'danger')
    
    # جلب المناطق والمعاهد لعرضها في النموذج
    regions = Region.query.all()
    institutes = Institute.query.all()
    
    return render_template('students/edit.html', 
                          student=student, 
                          regions=regions, 
                          institutes=institutes)

@app.route('/students/<int:student_id>')
def view_student(student_id):
    student = Student.query.get_or_404(student_id)
    evaluations = Evaluation.query.filter_by(student_id=student_id).all()
    
    # حساب المتوسطات والدرجات
    tests = [
        'running_in_place', 'sit_from_lying', 'zigzag_run', 
        'jump_in_circles', 'oblique_prostration'
    ] if student.stage == 'primary' else [
        'running_in_place', 'sit_from_lying', 'zigzag_run', 
        'jump_from_stationary', 'oblique_prostration'
    ]
    
    results = {}
    total_score = 0
    basic_tests_score = 0
    
    for test in tests:
        # جمع تقييمات الحكام
        judge1_evals = Evaluation.query.filter_by(student_id=student.id, judge_id=1).all()
        judge2_evals = Evaluation.query.filter_by(student_id=student.id, judge_id=2).all()
        
        judge1_value = 0
        judge2_value = 0
        
        # الحصول على آخر تقييم للحكم الأول
        for eval in judge1_evals:
            if getattr(eval, test) is not None:
                judge1_value = getattr(eval, test)
        
        # الحصول على آخر تقييم للحكم الثاني
        for eval in judge2_evals:
            if getattr(eval, test) is not None:
                judge2_value = getattr(eval, test)
        
        # حساب المتوسط والدرجة
        average = (judge1_value + judge2_value) / 2 if judge1_value and judge2_value else 0
        score = calculate_score(test, average, student.stage)
        
        results[test] = {
            'judge1': judge1_value,
            'judge2': judge2_value,
            'average': average,
            'score': score
        }
        
        total_score += score
        
        # إضافة إلى الاختبارات الأساسية إذا كان من الاختبارات الأساسية
        if test in ['running_in_place', 'sit_from_lying', 'oblique_prostration']:
            basic_tests_score += average
    
    return render_template('students/view.html', 
                         student=student, 
                         results=results,
                         total_score=total_score,
                         basic_tests_score=basic_tests_score)

def calculate_score(test, average, stage):
    # تحويل المتوسط إلى درجة من 10 حسب المرحلة الدراسية والاختبار
    if stage == 'primary':
        if test == 'running_in_place':
            # الجري في المكان - المرحلة الابتدائية
            if average >= 31: return 10
            elif average >= 30: return 9
            elif average >= 27: return 8
            elif average >= 24: return 7
            elif average >= 21: return 6
            elif average >= 19: return 5
            elif average >= 17: return 4
            elif average >= 15: return 3
            elif average >= 13: return 2
            elif average >= 12: return 1
            else: return 0
        elif test == 'sit_from_lying':
            # الجلوس من الرقود - المرحلة الابتدائية
            if average >= 28: return 10
            elif average >= 27: return 9
            elif average >= 23: return 8
            elif average >= 21: return 7
            elif average >= 19: return 6
            elif average >= 17: return 5
            elif average >= 15: return 4
            elif average >= 13: return 3
            elif average >= 11: return 2
            elif average >= 9: return 1
            else: return 0
        elif test == 'zigzag_run':
            # الجري الارتدادي - المرحلة الابتدائية
            if average <= 10: return 10
            elif average <= 10.49: return 9
            elif average <= 11.49: return 8
            elif average <= 11.99: return 7
            elif average <= 12.49: return 6
            elif average <= 12.99: return 5
            elif average <= 13.49: return 4
            elif average <= 13.99: return 3
            elif average <= 14.49: return 2
            elif average <= 14.99: return 1
            else: return 0
        elif test == 'jump_in_circles':
            # الوثب داخل الدوائر المرقمة - المرحلة الابتدائية
            if average <= 5.20: return 10
            elif average <= 5.99: return 9
            elif average <= 6.39: return 8
            elif average <= 6.79: return 7
            elif average <= 7.19: return 6
            elif average <= 7.59: return 5
            elif average <= 7.99: return 4
            elif average <= 8.39: return 3
            elif average <= 8.79: return 2
            elif average <= 9.19: return 1
            else: return 0
        elif test == 'oblique_prostration':
            # الانبطاح المائل - المرحلة الابتدائية
            if average >= 39: return 10
            elif average >= 37: return 9
            elif average >= 34: return 8
            elif average >= 32: return 7
            elif average >= 29: return 6
            elif average >= 27: return 5
            elif average >= 25: return 4
            elif average >= 23: return 3
            elif average >= 20: return 2
            elif average >= 19: return 1
            else: return 0
    else:  # stage == 'middle'
        if test == 'running_in_place':
            # الجري في المكان - المرحلة الإعدادية
            if average >= 33: return 10
            elif average >= 31: return 9
            elif average >= 29: return 8
            elif average >= 27: return 7
            elif average >= 24: return 6
            elif average >= 22: return 5
            elif average >= 20: return 4
            elif average >= 18: return 3
            elif average >= 16: return 2
            elif average >= 14: return 1
            else: return 0
        elif test == 'sit_from_lying':
            # الجلوس من الرقود - المرحلة الإعدادية
            if average >= 30: return 10
            elif average >= 28: return 9
            elif average >= 26: return 8
            elif average >= 24: return 7
            elif average >= 21: return 6
            elif average >= 19: return 5
            elif average >= 17: return 4
            elif average >= 15: return 3
            elif average >= 13: return 2
            elif average >= 11: return 1
            else: return 0
        elif test == 'zigzag_run':
            # الجري الزجزاجي - المرحلة الإعدادية
            if average <= 8.50: return 10
            elif average <= 9.00: return 9
            elif average <= 9.50: return 8
            elif average <= 10.00: return 7
            elif average <= 10.99: return 6
            elif average <= 11.49: return 5
            elif average <= 11.99: return 4
            elif average <= 12.49: return 3
            elif average <= 12.99: return 2
            elif average <= 13.50: return 1
            else: return 0
        elif test == 'jump_from_stationary':
            # الوثب من الثبات - المرحلة الإعدادية
            if average >= 185: return 10
            elif average >= 179: return 9
            elif average >= 174: return 8
            elif average >= 169: return 7
            elif average >= 164: return 6
            elif average >= 159: return 5
            elif average >= 149: return 4
            elif average >= 144: return 3
            elif average >= 139: return 2
            elif average >= 130: return 1
            else: return 0
        elif test == 'oblique_prostration':
            # الانبطاح المائل - المرحلة الإعدادية
            if average >= 36: return 10
            elif average >= 34: return 9
            elif average >= 31: return 8
            elif average >= 29: return 7
            elif average >= 27: return 6
            elif average >= 25: return 5
            elif average >= 23: return 4
            elif average >= 20: return 3
            elif average >= 18: return 2
            elif average >= 16: return 1
            else: return 0
    return 0  # في حالة عدم تطابق أي شرط

# مسارات التقييم
@app.route('/evaluate/<int:student_id>', methods=['GET', 'POST'])
def evaluate_student(student_id):
    student = Student.query.get_or_404(student_id)
    
    if request.method == 'POST':
        try:
            # جمع بيانات التقييم
            evaluation_data = {
                'student_id': student_id,
                'judge_id': request.form['judge_id'],
                'running_in_place': request.form.get('running_in_place', 0),
                'sit_from_lying': request.form.get('sit_from_lying', 0),
                'zigzag_run': request.form.get('zigzag_run', 0),
                'jump_in_circles': request.form.get('jump_in_circles', 0),
                'jump_from_stationary': request.form.get('jump_from_stationary', 0),
                'oblique_prostration': request.form.get('oblique_prostration', 0)
            }
            
            # حفظ التقييم
            new_evaluation = Evaluation(**evaluation_data)
            db.session.add(new_evaluation)
            db.session.commit()
            
            flash('تم تسجيل التقييم بنجاح', 'success')
            return redirect(url_for('view_student', student_id=student_id))
        
        except Exception as e:
            db.session.rollback()
            flash(f'حدث خطأ أثناء تسجيل التقييم: {str(e)}', 'danger')
    
    return render_template('judges/evaluation.html', student=student)

# مسارات التقارير
@app.route('/reports/regions')
def regions_report():
    # حساب تصنيف المناطق
    regions = Region.query.all()
    region_scores = []
    
    for region in regions:
        students = Student.query.filter_by(region_id=region.id).all()
        total_score = 0
        basic_score = 0
        student_count = len(students)
        
        for student in students:
            # حساب درجات الطالب
            tests = [
                'running_in_place', 'sit_from_lying', 'zigzag_run', 
                'jump_in_circles', 'oblique_prostration'
            ] if student.stage == 'primary' else [
                'running_in_place', 'sit_from_lying', 'zigzag_run', 
                'jump_from_stationary', 'oblique_prostration'
            ]
            
            student_total = 0
            student_basic = 0
            
            for test in tests:
                # جمع تقييمات الحكام
                judge1_evals = Evaluation.query.filter_by(student_id=student.id, judge_id=1).all()
                judge2_evals = Evaluation.query.filter_by(student_id=student.id, judge_id=2).all()
                
                judge1_value = 0
                judge2_value = 0
                
                # الحصول على آخر تقييم للحكم الأول
                for eval in judge1_evals:
                    if getattr(eval, test) is not None:
                        judge1_value = getattr(eval, test)
                
                # الحصول على آخر تقييم للحكم الثاني
                for eval in judge2_evals:
                    if getattr(eval, test) is not None:
                        judge2_value = getattr(eval, test)
                
                # حساب المتوسط والدرجة
                average = (judge1_value + judge2_value) / 2 if judge1_value and judge2_value else 0
                score = calculate_score(test, average, student.stage)
                
                student_total += score
                
                # إضافة إلى الاختبارات الأساسية إذا كان من الاختبارات الأساسية
                if test in ['running_in_place', 'sit_from_lying', 'oblique_prostration']:
                    student_basic += average
            
            total_score += student_total
            basic_score += student_basic
        
        # تخزين المجموع الكلي للمنطقة بدلاً من المتوسط
        region_scores.append({
            'region': region,
            'student_count': student_count,
            'total_score': total_score,
            'basic_score': basic_score
        })
    
    # ترتيب المناطق
    region_scores.sort(key=lambda x: (-x['total_score'], -x['basic_score']))
    
    return render_template('reports/regions.html', region_scores=region_scores)

# دالة مساعدة لحساب درجات الطلاب
def calculate_student_scores(students):
    student_scores = []
    
    for student in students:
        # حساب درجات الطالب
        tests = [
            'running_in_place', 'sit_from_lying', 'zigzag_run', 
            'jump_in_circles', 'oblique_prostration'
        ] if student.stage == 'primary' else [
            'running_in_place', 'sit_from_lying', 'zigzag_run', 
            'jump_from_stationary', 'oblique_prostration'
        ]
        
        total_score = 0
        basic_tests_score = 0
        test_scores = {}
        
        for test in tests:
            # جمع تقييمات الحكام
            judge1_evals = Evaluation.query.filter_by(student_id=student.id, judge_id=1).all()
            judge2_evals = Evaluation.query.filter_by(student_id=student.id, judge_id=2).all()
            
            judge1_value = 0
            judge2_value = 0
            
            # الحصول على آخر تقييم للحكم الأول
            for eval in judge1_evals:
                if getattr(eval, test) is not None:
                    judge1_value = getattr(eval, test)
            
            # الحصول على آخر تقييم للحكم الثاني
            for eval in judge2_evals:
                if getattr(eval, test) is not None:
                    judge2_value = getattr(eval, test)
            
            # حساب المتوسط والدرجة
            average = (judge1_value + judge2_value) / 2 if judge1_value and judge2_value else 0
            score = calculate_score(test, average, student.stage)
            
            # حفظ تفاصيل الاختبار
            test_scores[test] = {
                'judge1': judge1_value,
                'judge2': judge2_value,
                'average': average,
                'score': score
            }
            
            total_score += score
            
            # إضافة إلى الاختبارات الأساسية إذا كان من الاختبارات الأساسية
            if test in ['running_in_place', 'sit_from_lying', 'oblique_prostration']:
                basic_tests_score += average
        
        student_scores.append({
            'student': student,
            'total_score': total_score,
            'basic_score': basic_tests_score,
            'test_scores': test_scores
        })
    
    # ترتيب الطلاب حسب المجموع
    student_scores.sort(key=lambda x: (-x['total_score'], -x['basic_score']))
    return student_scores

@app.route('/reports/top-students')
def top_students_report():
    # جلب جميع الطلاب وحساب درجاتهم
    students = Student.query.all()
    student_scores = calculate_student_scores(students)
    
    # اختيار العشرة الأوائل
    top_students = student_scores[:10]
    
    # إضافة الترتيب العام لكل طالب
    for rank, student_data in enumerate(student_scores, 1):
        student_data['global_rank'] = rank
    
    # اختيار العشرة الأوائل بعد إضافة الترتيب العام
    top_students = student_scores[:10]
    
    return render_template('reports/top_students.html', top_students=top_students)

@app.route('/reports/all-students')
def all_students_report():
    # جلب جميع الطلاب وحساب درجاتهم
    students = Student.query.all()
    student_scores = calculate_student_scores(students)
    
    return render_template('reports/all_students.html', student_scores=student_scores)

@app.route('/reports/region-students')
@app.route('/reports/region-students/<int:region_id>')
def region_students_report(region_id=None):
    from datetime import datetime
    now = datetime.now()
    
    if region_id:
        # عرض طلاب منطقة محددة
        region = Region.query.get_or_404(region_id)
        
        # حساب درجات جميع الطلاب أولاً للحصول على الترتيب العام
        all_students = Student.query.all()
        all_student_scores = calculate_student_scores(all_students)
        
        # إنشاء قاموس للترتيب العام لكل طالب
        global_ranks = {}
        for rank, student_data in enumerate(all_student_scores, 1):
            global_ranks[student_data['student'].id] = rank
        
        # الحصول على طلاب المنطقة المحددة فقط
        region_students = Student.query.filter_by(region_id=region_id).all()
        region_student_scores = calculate_student_scores(region_students)
        
        # إضافة الترتيب العام لكل طالب في المنطقة
        for student_data in region_student_scores:
            student_data['global_rank'] = global_ranks[student_data['student'].id]
        
        # ترتيب طلاب المنطقة حسب الترتيب العام
        region_student_scores.sort(key=lambda x: x['global_rank'])
        
        # حساب ترتيب المناطق لإضافتها إلى التقرير
        regions = Region.query.all()
        region_scores = []
        
        for r in regions:
            students = Student.query.filter_by(region_id=r.id).all()
            total_score = 0
            basic_score = 0
            student_count = len(students)
            
            for student in students:
                # حساب درجات الطالب
                tests = [
                    'running_in_place', 'sit_from_lying', 'zigzag_run', 
                    'jump_in_circles', 'oblique_prostration'
                ] if student.stage == 'primary' else [
                    'running_in_place', 'sit_from_lying', 'zigzag_run', 
                    'jump_from_stationary', 'oblique_prostration'
                ]
                
                student_total = 0
                student_basic = 0
                
                for test in tests:
                    # جمع تقييمات الحكام
                    judge1_evals = Evaluation.query.filter_by(student_id=student.id, judge_id=1).all()
                    judge2_evals = Evaluation.query.filter_by(student_id=student.id, judge_id=2).all()
                    
                    judge1_value = 0
                    judge2_value = 0
                    
                    # الحصول على آخر تقييم للحكم الأول
                    for eval in judge1_evals:
                        if getattr(eval, test) is not None:
                            judge1_value = getattr(eval, test)
                    
                    # الحصول على آخر تقييم للحكم الثاني
                    for eval in judge2_evals:
                        if getattr(eval, test) is not None:
                            judge2_value = getattr(eval, test)
                    
                    # حساب المتوسط والدرجة
                    average = (judge1_value + judge2_value) / 2 if judge1_value and judge2_value else 0
                    score = calculate_score(test, average, student.stage)
                    
                    student_total += score
                    
                    # إضافة إلى الاختبارات الأساسية إذا كان من الاختبارات الأساسية
                    if test in ['running_in_place', 'sit_from_lying', 'oblique_prostration']:
                        student_basic += average
                
                total_score += student_total
                basic_score += student_basic
            
            # تخزين المجموع الكلي للمنطقة بدلاً من المتوسط
            region_scores.append({
                'region': r,
                'student_count': student_count,
                'total_score': total_score,
                'basic_score': basic_score
            })
        
        # ترتيب المناطق
        region_scores.sort(key=lambda x: (-x['total_score'], -x['basic_score']))
        
        return render_template('reports/region_students.html', region=region, student_scores=region_student_scores, region_scores=region_scores, now=now)
    else:
        # عرض قائمة المناطق
        regions = Region.query.all()
        return render_template('reports/region_students.html', regions=regions, region=None, now=now)

# استيراد وتصدير البيانات
@app.route('/export/template')
def export_template():
    # إنشاء نموذج Excel فارغ بورقة واحدة
    output = BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')
    
    # ورقة واحدة تحتوي على بيانات الطلاب والتقييمات معاً
    combined_columns = [
        'كود الطالب', 'الاسم', 'المنطقة', 'الإدارة', 'المعهد', 
        'الرقم القومي', 'المرحلة (ابتدائي/إعدادي)',
        'الجري في المكان (الحكم 1)', 'الجري في المكان (الحكم 2)',
        'الجلوس من الرقود (الحكم 1)', 'الجلوس من الرقود (الحكم 2)',
        'الجري الارتدادي (الحكم 1)', 'الجري الارتدادي (الحكم 2)',
        'الوثب داخل الدوائر المرقمة (الحكم 1)', 'الوثب داخل الدوائر المرقمة (الحكم 2)',
        'الوثب من الثبات (الحكم 1)', 'الوثب من الثبات (الحكم 2)',
        'الانبطاح المائل (الحكم 1)', 'الانبطاح المائل (الحكم 2)'
    ]
    pd.DataFrame(columns=combined_columns).to_excel(writer, sheet_name='بيانات_الطلاب_والتقييمات', index=False)
    
    writer.close()
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='نموذج_مسابقة_اللياقة.xlsx'
    )

@app.route('/import', methods=['GET'])
def import_page():
    return render_template('import.html')

@app.route('/import/data', methods=['POST'])
def import_data():
    if 'file' not in request.files:
        flash('لم يتم اختيار ملف', 'danger')
        return redirect(request.referrer)
    
    file = request.files['file']
    if file.filename == '':
        flash('لم يتم اختيار ملف', 'danger')
        return redirect(request.referrer)
    
    if file and allowed_file(file.filename):
        try:
            # قراءة الملف ومعالجة البيانات من ورقة واحدة
            df_combined = pd.read_excel(file, sheet_name='بيانات_الطلاب_والتقييمات')
            
            # التحقق من وجود الأعمدة المطلوبة
            required_columns = ['كود الطالب', 'الاسم', 'المنطقة', 'الإدارة', 'المعهد', 'الرقم القومي', 'المرحلة (ابتدائي/إعدادي)']
            
            for col in required_columns:
                if col not in df_combined.columns:
                    raise ValueError(f'العمود {col} غير موجود في ملف البيانات')
            
            # معالجة بيانات الطلاب والتقييمات
            students_added = 0
            students_updated = 0
            evaluations_added = 0
            
            for _, row in df_combined.iterrows():
                # التحقق من البيانات المطلوبة للطالب
                if pd.isna(row['كود الطالب']) or pd.isna(row['الاسم']) or pd.isna(row['المنطقة']) or \
                   pd.isna(row['الإدارة']) or pd.isna(row['المعهد']) or pd.isna(row['الرقم القومي']) or \
                   pd.isna(row['المرحلة (ابتدائي/إعدادي)']):
                    continue
                
                # البحث عن المنطقة أو إنشاؤها
                region = Region.query.filter_by(name=row['المنطقة']).first()
                if not region:
                    region = Region(name=row['المنطقة'])
                    db.session.add(region)
                    db.session.flush()
                
                # البحث عن المعهد أو إنشاؤه
                institute = Institute.query.filter_by(name=row['المعهد'], region_id=region.id).first()
                if not institute:
                    institute = Institute(name=row['المعهد'], region_id=region.id)
                    db.session.add(institute)
                    db.session.flush()
                
                # تحديد المرحلة
                stage = 'primary' if 'ابتدائي' in row['المرحلة (ابتدائي/إعدادي)'] else 'preparatory'
                
                # البحث عن الطالب بواسطة الكود أو الرقم القومي
                student = Student.query.filter(
                    (Student.code == str(row['كود الطالب'])) | 
                    (Student.national_id == str(row['الرقم القومي']))
                ).first()
                
                if student:
                    # تحديث بيانات الطالب الموجود
                    student.name = row['الاسم']
                    student.region_id = region.id
                    student.administration = row['الإدارة']
                    student.institute_id = institute.id
                    student.national_id = str(row['الرقم القومي'])
                    student.stage = stage
                    students_updated += 1
                else:
                    # إنشاء طالب جديد
                    student = Student(
                        code=str(row['كود الطالب']),
                        name=row['الاسم'],
                        region_id=region.id,
                        administration=row['الإدارة'],
                        institute_id=institute.id,
                        national_id=str(row['الرقم القومي']),
                        stage=stage
                    )
                    db.session.add(student)
                    db.session.flush()  # للحصول على معرف الطالب
                    students_added += 1
                
                # إضافة تقييمات الحكم الأول
                if not pd.isna(row.get('الجري في المكان (الحكم 1)')) or \
                   not pd.isna(row.get('الجلوس من الرقود (الحكم 1)')) or \
                   not pd.isna(row.get('الجري الارتدادي (الحكم 1)')) or \
                   not pd.isna(row.get('الوثب داخل الدوائر المرقمة (الحكم 1)')) or \
                   not pd.isna(row.get('الوثب من الثبات (الحكم 1)')) or \
                   not pd.isna(row.get('الانبطاح المائل (الحكم 1)')):
                    
                    evaluation1 = Evaluation(
                        student_id=student.id,
                        judge_id=1,
                        running_in_place=float(row.get('الجري في المكان (الحكم 1)', 0)) if not pd.isna(row.get('الجري في المكان (الحكم 1)')) else None,
                        sit_from_lying=float(row.get('الجلوس من الرقود (الحكم 1)', 0)) if not pd.isna(row.get('الجلوس من الرقود (الحكم 1)')) else None,
                        zigzag_run=float(row.get('الجري الارتدادي (الحكم 1)', 0)) if not pd.isna(row.get('الجري الارتدادي (الحكم 1)')) else None,
                        jump_in_circles=float(row.get('الوثب داخل الدوائر المرقمة (الحكم 1)', 0)) if not pd.isna(row.get('الوثب داخل الدوائر المرقمة (الحكم 1)')) else None,
                        jump_from_stationary=float(row.get('الوثب من الثبات (الحكم 1)', 0)) if not pd.isna(row.get('الوثب من الثبات (الحكم 1)')) else None,
                        oblique_prostration=float(row.get('الانبطاح المائل (الحكم 1)', 0)) if not pd.isna(row.get('الانبطاح المائل (الحكم 1)')) else None
                    )
                    db.session.add(evaluation1)
                    evaluations_added += 1
                
                # إضافة تقييمات الحكم الثاني
                if not pd.isna(row.get('الجري في المكان (الحكم 2)')) or \
                   not pd.isna(row.get('الجلوس من الرقود (الحكم 2)')) or \
                   not pd.isna(row.get('الجري الارتدادي (الحكم 2)')) or \
                   not pd.isna(row.get('الوثب داخل الدوائر المرقمة (الحكم 2)')) or \
                   not pd.isna(row.get('الوثب من الثبات (الحكم 2)')) or \
                   not pd.isna(row.get('الانبطاح المائل (الحكم 2)')):
                    
                    evaluation2 = Evaluation(
                        student_id=student.id,
                        judge_id=2,
                        running_in_place=float(row.get('الجري في المكان (الحكم 2)', 0)) if not pd.isna(row.get('الجري في المكان (الحكم 2)')) else None,
                        sit_from_lying=float(row.get('الجلوس من الرقود (الحكم 2)', 0)) if not pd.isna(row.get('الجلوس من الرقود (الحكم 2)')) else None,
                        zigzag_run=float(row.get('الجري الارتدادي (الحكم 2)', 0)) if not pd.isna(row.get('الجري الارتدادي (الحكم 2)')) else None,
                        jump_in_circles=float(row.get('الوثب داخل الدوائر المرقمة (الحكم 2)', 0)) if not pd.isna(row.get('الوثب داخل الدوائر المرقمة (الحكم 2)')) else None,
                        jump_from_stationary=float(row.get('الوثب من الثبات (الحكم 2)', 0)) if not pd.isna(row.get('الوثب من الثبات (الحكم 2)')) else None,
                        oblique_prostration=float(row.get('الانبطاح المائل (الحكم 2)', 0)) if not pd.isna(row.get('الانبطاح المائل (الحكم 2)')) else None
                    )
                    db.session.add(evaluation2)
                    evaluations_added += 1
            
            # حفظ جميع التغييرات
            db.session.commit()
            
            # إعداد رسالة النجاح
            success_message = f'تم استيراد البيانات بنجاح: {students_added} طالب جديد، {students_updated} طالب تم تحديثه، {evaluations_added} تقييم تم إضافته'
            flash(success_message, 'success')
            return redirect(url_for('list_students'))
        
        except Exception as e:
            db.session.rollback()
            flash(f'حدث خطأ أثناء استيراد البيانات: {str(e)}', 'danger')
            return redirect(request.referrer)
    
    return redirect(request.referrer)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ['xlsx', 'xls']

if __name__ == '__main__':
    app.run(debug=True)