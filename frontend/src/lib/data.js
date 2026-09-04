/** Mock dataset. Swap for API calls against the Express backend later. */

export const DEPARTMENTS = [
  "Computer Science",
  "Electronics",
  "Mechanical",
  "Commerce",
]

export const admissionRequests = [
  { id: "AD-2041", name: "Ishaan Verma", program: "B.Tech CSE", score: 94, applied: "2026-08-18", fee: 78000, status: "Pending", email: "ishaan.v@mail.com", phone: "98200 41190" },
  { id: "AD-2042", name: "Nandini Rao", program: "B.Tech ECE", score: 88, applied: "2026-08-18", fee: 74000, status: "Pending", email: "nandini.r@mail.com", phone: "98200 55021" },
  { id: "AD-2043", name: "Aryan Mehta", program: "B.Com Hons", score: 71, applied: "2026-08-19", fee: 52000, status: "Pending", email: "aryan.m@mail.com", phone: "98200 77310" },
  { id: "AD-2044", name: "Zoya Khan", program: "B.Tech CSE", score: 91, applied: "2026-08-20", fee: 78000, status: "Approved", email: "zoya.k@mail.com", phone: "98200 12874" },
  { id: "AD-2045", name: "Kabir Nair", program: "B.Tech MECH", score: 66, applied: "2026-08-20", fee: 69000, status: "Rejected", email: "kabir.n@mail.com", phone: "98200 63344" },
  { id: "AD-2046", name: "Meera Iyer", program: "B.Tech ECE", score: 96, applied: "2026-08-21", fee: 74000, status: "Approved", email: "meera.i@mail.com", phone: "98200 90112" },
  { id: "AD-2047", name: "Rohan Das", program: "B.Com Hons", score: 58, applied: "2026-08-22", fee: 52000, status: "Rejected", email: "rohan.d@mail.com", phone: "98200 34567" },
  { id: "AD-2048", name: "Sara Fernandes", program: "B.Tech CSE", score: 89, applied: "2026-08-23", fee: 78000, status: "Pending", email: "sara.f@mail.com", phone: "98200 21988" },
]

export const admissionFees = [
  { id: "AD-2044", name: "Zoya Khan", program: "B.Tech CSE", payable: 78000, paid: 78000, mode: "UPI", ref: "PAY-9F31A", status: "Paid" },
  { id: "AD-2046", name: "Meera Iyer", program: "B.Tech ECE", payable: 74000, paid: 30000, mode: "Card", ref: "PAY-71C0B", status: "Partial" },
  { id: "AD-2041", name: "Ishaan Verma", program: "B.Tech CSE", payable: 78000, paid: 0, mode: "—", ref: "—", status: "Unpaid" },
  { id: "AD-2042", name: "Nandini Rao", program: "B.Tech ECE", payable: 74000, paid: 5000, mode: "UPI", ref: "PAY-2AB84", status: "Partial" },
]

export const faculty = [
  { id: "FC-118", name: "Dr. Aparna Joshi", dept: "Computer Science", subject: "Distributed Systems", email: "aparna.joshi@origin.edu", phone: "98110 22114", exp: 12, salary: 148000, attendance: 96, load: 18, status: "Active" },
  { id: "FC-124", name: "Prof. Rajat Sinha", dept: "Computer Science", subject: "Compilers", email: "rajat.sinha@origin.edu", phone: "98110 87451", exp: 9, salary: 126000, attendance: 91, load: 16, status: "Active" },
  { id: "FC-131", name: "Dr. Leela Menon", dept: "Electronics", subject: "VLSI Design", email: "leela.menon@origin.edu", phone: "98110 33290", exp: 15, salary: 155000, attendance: 88, load: 14, status: "Active" },
  { id: "FC-140", name: "Prof. Imran Sheikh", dept: "Mechanical", subject: "Thermodynamics", email: "imran.sheikh@origin.edu", phone: "98110 74812", exp: 7, salary: 112000, attendance: 79, load: 20, status: "Active" },
  { id: "FC-146", name: "Dr. Sneha Kulkarni", dept: "Commerce", subject: "Corporate Finance", email: "sneha.k@origin.edu", phone: "98110 55603", exp: 11, salary: 134000, attendance: 94, load: 15, status: "On leave" },
  { id: "FC-152", name: "Prof. Dev Bhatt", dept: "Electronics", subject: "Signals & Systems", email: "dev.bhatt@origin.edu", phone: "98110 90074", exp: 5, salary: 98000, attendance: 85, load: 19, status: "Active" },
]

export const leaveRequests = [
  { id: "LV-3301", name: "Dr. Sneha Kulkarni", dept: "Commerce", type: "Medical", from: "2026-09-02", to: "2026-09-06", days: 5, status: "Pending", cover: "Prof. Dev Bhatt" },
  { id: "LV-3302", name: "Prof. Imran Sheikh", dept: "Mechanical", type: "Casual", from: "2026-09-09", to: "2026-09-09", days: 1, status: "Pending", cover: "—" },
  { id: "LV-3303", name: "Dr. Leela Menon", dept: "Electronics", type: "Conference", from: "2026-09-15", to: "2026-09-18", days: 4, status: "Approved", cover: "Prof. Dev Bhatt" },
  { id: "LV-3304", name: "Prof. Rajat Sinha", dept: "Computer Science", type: "Casual", from: "2026-08-28", to: "2026-08-29", days: 2, status: "Rejected", cover: "—" },
]

export const salaries = [
  { id: "FC-118", name: "Dr. Aparna Joshi", dept: "Computer Science", gross: 148000, deductions: 14800, net: 133200, month: "Aug 2026", status: "Paid" },
  { id: "FC-124", name: "Prof. Rajat Sinha", dept: "Computer Science", gross: 126000, deductions: 12600, net: 113400, month: "Aug 2026", status: "Paid" },
  { id: "FC-131", name: "Dr. Leela Menon", dept: "Electronics", gross: 155000, deductions: 15500, net: 139500, month: "Aug 2026", status: "Paid" },
  { id: "FC-140", name: "Prof. Imran Sheikh", dept: "Mechanical", gross: 112000, deductions: 11200, net: 100800, month: "Aug 2026", status: "Processing" },
  { id: "FC-146", name: "Dr. Sneha Kulkarni", dept: "Commerce", gross: 134000, deductions: 13400, net: 120600, month: "Aug 2026", status: "Hold" },
  { id: "FC-152", name: "Prof. Dev Bhatt", dept: "Electronics", gross: 98000, deductions: 9800, net: 88200, month: "Aug 2026", status: "Processing" },
]

export const students = [
  { id: "ST-8801", name: "Aisha Sheikh", program: "B.Tech CSE", sem: 5, dept: "Computer Science", attendance: 93, cgpa: 8.7, feesDue: 0, fines: 0, email: "aisha.s@origin.edu", phone: "97400 11223", guardian: "Farhan Sheikh", status: "Active" },
  { id: "ST-8802", name: "Vivaan Gupta", program: "B.Tech CSE", sem: 5, dept: "Computer Science", attendance: 74, cgpa: 7.1, feesDue: 42000, fines: 500, email: "vivaan.g@origin.edu", phone: "97400 44881", guardian: "Ritu Gupta", status: "Active" },
  { id: "ST-8803", name: "Tara Menon", program: "B.Tech ECE", sem: 3, dept: "Electronics", attendance: 88, cgpa: 9.1, feesDue: 0, fines: 0, email: "tara.m@origin.edu", phone: "97400 62190", guardian: "Anil Menon", status: "Active" },
  { id: "ST-8804", name: "Dhruv Patel", program: "B.Tech MECH", sem: 7, dept: "Mechanical", attendance: 61, cgpa: 6.4, feesDue: 69000, fines: 1200, email: "dhruv.p@origin.edu", phone: "97400 33475", guardian: "Nita Patel", status: "Probation" },
  { id: "ST-8805", name: "Riya Chandra", program: "B.Com Hons", sem: 1, dept: "Commerce", attendance: 97, cgpa: 8.2, feesDue: 12000, fines: 0, email: "riya.c@origin.edu", phone: "97400 90012", guardian: "Suresh Chandra", status: "Active" },
  { id: "ST-8806", name: "Omar Ali", program: "B.Tech ECE", sem: 3, dept: "Electronics", attendance: 82, cgpa: 7.8, feesDue: 0, fines: 300, email: "omar.a@origin.edu", phone: "97400 71156", guardian: "Nadia Ali", status: "Active" },
  { id: "ST-8807", name: "Kavya Reddy", program: "B.Tech CSE", sem: 5, dept: "Computer Science", attendance: 90, cgpa: 8.9, feesDue: 39000, fines: 0, email: "kavya.r@origin.edu", phone: "97400 28840", guardian: "Mohan Reddy", status: "Active" },
  { id: "ST-8808", name: "Neel Joshi", program: "B.Tech MECH", sem: 7, dept: "Mechanical", attendance: 79, cgpa: 7.4, feesDue: 0, fines: 0, email: "neel.j@origin.edu", phone: "97400 55329", guardian: "Prisha Joshi", status: "Active" },
]

export const courses = [
  { code: "CS-501", title: "Distributed Systems", dept: "Computer Science", credits: 4, faculty: "Dr. Aparna Joshi", enrolled: 62, sem: 5 },
  { code: "CS-503", title: "Compiler Design", dept: "Computer Science", credits: 4, faculty: "Prof. Rajat Sinha", enrolled: 58, sem: 5 },
  { code: "EC-301", title: "VLSI Design", dept: "Electronics", credits: 3, faculty: "Dr. Leela Menon", enrolled: 45, sem: 3 },
  { code: "EC-305", title: "Signals & Systems", dept: "Electronics", credits: 4, faculty: "Prof. Dev Bhatt", enrolled: 51, sem: 3 },
  { code: "ME-701", title: "Thermodynamics II", dept: "Mechanical", credits: 4, faculty: "Prof. Imran Sheikh", enrolled: 39, sem: 7 },
  { code: "CM-101", title: "Corporate Finance", dept: "Commerce", credits: 3, faculty: "Dr. Sneha Kulkarni", enrolled: 74, sem: 1 },
]

export const exams = [
  { id: "EX-701", title: "Mid-term · Sem 5", program: "B.Tech CSE", date: "2026-09-14", slot: "09:30 – 12:30", room: "Block A · 204", invigilator: "Prof. Rajat Sinha", students: 62, status: "Scheduled" },
  { id: "EX-702", title: "Mid-term · Sem 3", program: "B.Tech ECE", date: "2026-09-15", slot: "09:30 – 12:30", room: "Block B · 108", invigilator: "Prof. Dev Bhatt", students: 51, status: "Scheduled" },
  { id: "EX-703", title: "Unit Test II", program: "B.Tech MECH", date: "2026-08-24", slot: "14:00 – 15:30", room: "Block C · 011", invigilator: "Prof. Imran Sheikh", students: 39, status: "Completed" },
  { id: "EX-704", title: "Semester End", program: "B.Com Hons", date: "2026-11-02", slot: "09:30 – 12:30", room: "Hall 1", invigilator: "Unassigned", students: 74, status: "Draft" },
]

export const scores = [
  { id: "ST-8801", name: "Aisha Sheikh", program: "B.Tech CSE", exam: "Mid-term · Sem 5", course: "CS-501", marks: 88, max: 100, grade: "A" },
  { id: "ST-8802", name: "Vivaan Gupta", program: "B.Tech CSE", exam: "Mid-term · Sem 5", course: "CS-501", marks: 61, max: 100, grade: "C" },
  { id: "ST-8807", name: "Kavya Reddy", program: "B.Tech CSE", exam: "Mid-term · Sem 5", course: "CS-501", marks: 92, max: 100, grade: "A+" },
  { id: "ST-8803", name: "Tara Menon", program: "B.Tech ECE", exam: "Mid-term · Sem 3", course: "EC-301", marks: 95, max: 100, grade: "A+" },
  { id: "ST-8806", name: "Omar Ali", program: "B.Tech ECE", exam: "Mid-term · Sem 3", course: "EC-301", marks: 78, max: 100, grade: "B" },
  { id: "ST-8804", name: "Dhruv Patel", program: "B.Tech MECH", exam: "Unit Test II", course: "ME-701", marks: 44, max: 100, grade: "E" },
  { id: "ST-8808", name: "Neel Joshi", program: "B.Tech MECH", exam: "Unit Test II", course: "ME-701", marks: 72, max: 100, grade: "B" },
]

export const studentFees = [
  { id: "ST-8802", name: "Vivaan Gupta", program: "B.Tech CSE", head: "Semester 5 tuition", payable: 42000, paid: 0, due: "2026-09-10", status: "Overdue" },
  { id: "ST-8804", name: "Dhruv Patel", program: "B.Tech MECH", head: "Semester 7 tuition", payable: 69000, paid: 0, due: "2026-09-10", status: "Overdue" },
  { id: "ST-8805", name: "Riya Chandra", program: "B.Com Hons", head: "Semester 1 tuition", payable: 52000, paid: 40000, due: "2026-09-20", status: "Partial" },
  { id: "ST-8807", name: "Kavya Reddy", program: "B.Tech CSE", head: "Semester 5 tuition", payable: 42000, paid: 3000, due: "2026-09-20", status: "Partial" },
  { id: "ST-8801", name: "Aisha Sheikh", program: "B.Tech CSE", head: "Semester 5 tuition", payable: 42000, paid: 42000, due: "2026-09-10", status: "Paid" },
]

export const fines = [
  { id: "FN-201", student: "Vivaan Gupta", reason: "Library overdue · 12 days", amount: 500, raised: "2026-08-12", status: "Unpaid" },
  { id: "FN-202", student: "Dhruv Patel", reason: "Lab equipment damage", amount: 1200, raised: "2026-08-19", status: "Unpaid" },
  { id: "FN-203", student: "Omar Ali", reason: "Late hostel entry", amount: 300, raised: "2026-08-22", status: "Unpaid" },
]

export const PERIODS = [
  "09:00 – 09:55",
  "10:00 – 10:55",
  "11:10 – 12:05",
  "12:10 – 13:05",
  "14:00 – 14:55",
]
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]

/** timetable[day][periodIndex] — null means free slot */
export const timetable = {
  Mon: [
    { code: "CS-501", room: "A-204", faculty: "Dr. Aparna Joshi" },
    { code: "CS-503", room: "A-204", faculty: "Prof. Rajat Sinha" },
    null,
    { code: "EC-305", room: "B-108", faculty: "Prof. Dev Bhatt" },
    { code: "ME-701", room: "C-011", faculty: "Prof. Imran Sheikh" },
  ],
  Tue: [
    { code: "EC-301", room: "B-110", faculty: "Dr. Leela Menon" },
    null,
    { code: "CS-501", room: "A-204", faculty: "Dr. Aparna Joshi" },
    { code: "CM-101", room: "D-002", faculty: "Dr. Sneha Kulkarni" },
    null,
  ],
  Wed: [
    { code: "CS-503", room: "A-206", faculty: "Prof. Rajat Sinha" },
    { code: "ME-701", room: "C-011", faculty: "Prof. Imran Sheikh" },
    { code: "EC-305", room: "B-108", faculty: "Prof. Dev Bhatt" },
    null,
    { code: "CS-501", room: "A-204", faculty: "Dr. Aparna Joshi" },
  ],
  Thu: [
    null,
    { code: "CM-101", room: "D-002", faculty: "Dr. Sneha Kulkarni" },
    { code: "EC-301", room: "B-110", faculty: "Dr. Leela Menon" },
    { code: "CS-503", room: "A-206", faculty: "Prof. Rajat Sinha" },
    { code: "EC-305", room: "B-108", faculty: "Prof. Dev Bhatt" },
  ],
  Fri: [
    { code: "CS-501", room: "A-204", faculty: "Dr. Aparna Joshi" },
    { code: "EC-301", room: "B-110", faculty: "Dr. Leela Menon" },
    { code: "CM-101", room: "D-002", faculty: "Dr. Sneha Kulkarni" },
    { code: "ME-701", room: "C-011", faculty: "Prof. Imran Sheikh" },
    null,
  ],
}

export const facultyAttendanceTrend = [
  { label: "Apr", value: 92 },
  { label: "May", value: 89 },
  { label: "Jun", value: 94 },
  { label: "Jul", value: 87 },
  { label: "Aug", value: 91 },
  { label: "Sep", value: 96 },
]

export const feeCollectionTrend = [
  { label: "Apr", value: 62 },
  { label: "May", value: 71 },
  { label: "Jun", value: 55 },
  { label: "Jul", value: 84 },
  { label: "Aug", value: 78 },
  { label: "Sep", value: 41 },
]

export const teacherAvailability = [
  { name: "Dr. Aparna Joshi", free: ["Mon P3", "Tue P2", "Thu P1"] },
  { name: "Prof. Rajat Sinha", free: ["Mon P5", "Tue P5", "Wed P4"] },
  { name: "Dr. Leela Menon", free: ["Mon P2", "Wed P4", "Fri P5"] },
  { name: "Prof. Imran Sheikh", free: ["Tue P3", "Thu P1", "Fri P5"] },
  { name: "Prof. Dev Bhatt", free: ["Tue P2", "Wed P5", "Fri P4"] },
  { name: "Dr. Sneha Kulkarni", free: ["Mon P1", "Wed P1", "Thu P5"] },
]
