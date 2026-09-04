# Project Plan

A campus ERP with four interfaces: **Admin**, **Faculty**, **Student**, and a shared **login page**.

## Common Login Page

- Sign-in only — no "reset password" link
- Chatbot icon anchored to the lower corner
- Hero image: an SVG mock of a macOS-style window
- "Apply for admission" flow, backed by a dummy payment gateway wired to the backend

## Admin Portal

Navbar sections: Admissions · Faculty Management · Student Management · Finances · Time-table · Examinations · Score

### Admissions
- Requests for admission
- Approved admissions
- Rejected admissions
- Fee tracker

### Faculty Management
- Leave requests
- Attendance tracker (with graph)
- Teacher directory — searchable, with registry
- Salary management
- Timetable
- Create / add new teacher
- Exam invigilator duty assignment
- Update student marks for exams
- View student info

### Student Management
- Attendance
- Fees
- Course list
- Create / add new student
- Timetable
- Score
- Exams
- Pay fines
- Pay semester fees
- View exam marks

### Finances
- Fee management for students
- Salary management for faculty
- Admission fee payment tracker

### Time-table
- Dynamically updates student and teacher timetables based on teacher availability

### Examinations
- Create / delete exams (admin)
- Exam history view (admin)

### Score
- View student scores (admin)

## Flagship Feature

An [React Flow](https://reactflow.dev/)-based graph/tree in the admin dashboard, and an Obsidian-style node graph used sparingly elsewhere where it fits — not overused.

## Engineering Guidelines

- Build with **shadcn/ui** and **framer-motion** wherever applicable; avoid writing from scratch or hardcoding unless a component truly isn't covered by them
- Follow [Vercel's frontend guidelines](https://vercel.com/design/introduction)
- No gradients, anywhere
- No translucent background paired with text of the same underlying color (contrast must hold against the background it sits on)
