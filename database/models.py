from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Region(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    students = db.relationship('Student', backref='region', lazy=True)

class Institute(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    region_id = db.Column(db.Integer, db.ForeignKey('region.id'), nullable=False)
    students = db.relationship('Student', backref='institute', lazy=True)

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    region_id = db.Column(db.Integer, db.ForeignKey('region.id'), nullable=False)
    administration = db.Column(db.String(100), nullable=False)
    institute_id = db.Column(db.Integer, db.ForeignKey('institute.id'), nullable=False)
    national_id = db.Column(db.String(14), unique=True, nullable=False)
    stage = db.Column(db.String(20), nullable=False)  # 'primary' or 'preparatory'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    evaluations = db.relationship('Evaluation', backref='student', lazy=True)

class Evaluation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    judge_id = db.Column(db.Integer, nullable=False)
    running_in_place = db.Column(db.Float)
    sit_from_lying = db.Column(db.Float)
    zigzag_run = db.Column(db.Float)
    jump_in_circles = db.Column(db.Float)
    jump_from_stationary = db.Column(db.Float)
    oblique_prostration = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)