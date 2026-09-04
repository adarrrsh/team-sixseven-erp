import { Routes, Route, Navigate } from "react-router-dom"
import Login from "@/pages/login"
import Apply from "@/pages/apply"
import AdminLayout from "@/pages/admin/layout"
import AdminDashboard from "@/pages/admin/dashboard"
import Admissions from "@/pages/admin/admissions"
import FacultyManagement from "@/pages/admin/faculty"
import StudentManagement from "@/pages/admin/students"
import Finances from "@/pages/admin/finances"
import AdminTimetable from "@/pages/admin/timetable"
import Examinations from "@/pages/admin/examinations"
import ScorePage from "@/pages/admin/score"
import FacultyPortal from "@/pages/faculty-portal"
import StudentPortal from "@/pages/student-portal"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/apply" element={<Apply />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="admissions" element={<Admissions />} />
        <Route path="faculty" element={<FacultyManagement />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="finances" element={<Finances />} />
        <Route path="timetable" element={<AdminTimetable />} />
        <Route path="examinations" element={<Examinations />} />
        <Route path="score" element={<ScorePage />} />
      </Route>
      <Route path="/faculty/*" element={<FacultyPortal />} />
      <Route path="/student/*" element={<StudentPortal />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
