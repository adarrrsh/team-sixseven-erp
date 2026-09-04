/** Client for the Express backend in `backend/` — every page's data comes through here, live. */
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

function query(params) {
  const search = new URLSearchParams(
    Object.entries(params ?? {}).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  ).toString()
  return search ? `?${search}` : ""
}

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? `${res.status} ${res.statusText}`)
  return data
}

const get = (path, params) => request("GET", path + query(params))
const post = (path, body) => request("POST", path, body)
const patch = (path, body) => request("PATCH", path, body)
const put = (path, body) => request("PUT", path, body)
const del = (path) => request("DELETE", path)

/* ---------------------------------------------------------------- auth --- */

export const login = (email, password, role) =>
  post("/api/auth/login", { email, password, role })

/* ---------------------------------------------------------- applicants --- */

/** Submits the admission form and opens the applicant's tracking login. */
export const registerApplicant = (payload) => post("/api/applicants/register", payload)

/** The applicant portal's single source of truth: stage, application, credentials. */
export const getApplicantStatus = (email) => get("/api/applicants/me", { email })

export const getProgrammeFees = () => get("/api/applicants/fees")

/** Seat fee for an approved application. Returns the issued student login. */
export const payAdmissionFee = (payload) => post("/api/payments/admission", payload)

/* ---------------------------------------------------------- admissions --- */

export const getAdmissions = (params) => get("/api/admissions", params)
export const getAdmissionStats = () => get("/api/admissions/stats")
export const getAdmissionFees = (params) => get("/api/admissions/fees", params)
export const decideAdmission = (id, status) =>
  patch(`/api/admissions/${id}/status`, { status })

/* ------------------------------------------------------------- faculty --- */

export const getFaculty = (params) => get("/api/faculty", params)
export const getFacultyMember = (id) => get(`/api/faculty/${id}`)
export const createFaculty = (payload) => post("/api/faculty", payload)
export const updateFaculty = (id, payload) => patch(`/api/faculty/${id}`, payload)
export const deleteFaculty = (id) => del(`/api/faculty/${id}`)

export const getLeaves = (params) => get("/api/faculty/leaves", params)
export const applyForLeave = (payload) => post("/api/faculty/leaves", payload)
export const decideLeave = (id, status) =>
  patch(`/api/faculty/leaves/${id}/status`, { status })

export const getSalaries = (params) => get("/api/faculty/salaries", params)
export const setSalaryStatus = (id, status, month) =>
  patch(`/api/faculty/salaries/${id}/status`, { status, month })

export const getFacultyAttendance = () => get("/api/faculty/attendance")
export const getTeacherAvailability = () => get("/api/faculty/availability")
export const getInvigilatorDuties = () => get("/api/faculty/duties")
export const assignInvigilator = (examId, invigilator) =>
  patch(`/api/faculty/duties/${examId}`, { invigilator })

/* ------------------------------------------------------------ students --- */

export const getStudents = (params) => get("/api/students", params)
export const getStudent = (id) => get(`/api/students/${id}`)
export const getStudentProfile = (id) => get(`/api/students/${id}/profile`)
export const getStudentStats = () => get("/api/students/stats")
export const createStudent = (payload) => post("/api/students", payload)
export const updateStudent = (id, payload) => patch(`/api/students/${id}`, payload)
export const deleteStudent = (id) => del(`/api/students/${id}`)
export const markAttendance = (id, attendance) =>
  patch(`/api/students/${id}/attendance`, { attendance })

export const getStudentFees = (params) => get("/api/students/fees", params)
export const getFines = (params) => get("/api/students/fines", params)
export const raiseFine = (payload) => post("/api/students/fines", payload)
export const settleFine = (id) => patch(`/api/students/fines/${id}/settle`)

/* ------------------------------------------------------------- courses --- */

export const getCourses = (params) => get("/api/courses", params)
export const createCourse = (payload) => post("/api/courses", payload)
export const updateCourse = (code, payload) => patch(`/api/courses/${code}`, payload)
export const deleteCourse = (code) => del(`/api/courses/${code}`)

/* --------------------------------------------------- exams and scores --- */

export const getExams = (params) => get("/api/exams", params)
export const getExam = (id) => get(`/api/exams/${id}`)
export const createExam = (payload) => post("/api/exams", payload)
export const updateExam = (id, payload) => patch(`/api/exams/${id}`, payload)
export const deleteExam = (id) => del(`/api/exams/${id}`)
export const getExamScores = (id) => get(`/api/exams/${id}/scores`)

export const getScores = (params) => get("/api/scores", params)
export const getScoresByCourse = () => get("/api/scores/by-course")
export const getScoreStats = () => get("/api/scores/stats")
export const publishScore = (payload) => post("/api/scores", payload)

/** Scores key on (student, course) — pass a row's `recordId` or that pair. */
export const updateMarks = (row, marks) =>
  patch(`/api/scores/${row.recordId ?? `${row.id}::${row.course}`}`, { marks })

/* ------------------------------------------------------------ finances --- */

export const getFinanceSummary = () => get("/api/finances/summary")
export const getCollectionTrend = () => get("/api/finances/collection-trend")

/* ----------------------------------------------------------- timetable --- */

/** Returns { days, periods, timetable, changes, version, unavailable }. */
export const getTimetable = (params) => get("/api/timetable", params)
export const rebuildTimetable = (unavailable, scope) =>
  post("/api/timetable/rebuild", { unavailable, scope })
export const setTimetableSlot = (payload) => put("/api/timetable/slot", payload)

/* ----------------------------------------------------------- dashboard --- */

export const getDashboard = () => get("/api/dashboard")
export const getDepartments = () => get("/api/dashboard/departments")
export const getOrgGraph = () => get("/api/dashboard/org-graph")

/* ------------------------------------------------------------- chatbot --- */

/** { message } -> { reply, isFallback }. Server-side Gemini proxy — see backend/routers/chatbot.js. */
export const askChatbot = (message) => post("/api/chatbot", { message })

/* ------------------------------------------------------------ payments --- */

/** Semester fees and fines from the student portal. */
export async function payStudentDue(payload) {
  return pay("/api/payments/student", payload)
}

export const getPayments = (params) => get("/api/payments", params)

/**
 * `fetch()` itself rejects with a `TypeError` when the network request never
 * reaches a server at all (offline, backend down, DNS failure, CORS block).
 * `request()` above throws a plain `Error` once it *has* a response and the
 * backend deliberately rejected it (bad amount, unknown student, ...) — that
 * distinction is exactly what decides whether the fake local receipt below
 * is appropriate. Only genuine unreachability should ever produce one; a
 * real rejection from a reachable backend must reach the caller as itself,
 * or a broken payment would render as a successful one.
 */
async function pay(path, payload) {
  try {
    const data = await post(path, payload)
    return { ...data, offline: false }
  } catch (err) {
    if (!(err instanceof TypeError)) throw err
    await new Promise((r) => setTimeout(r, 900))
    return {
      ok: true,
      offline: true,
      reference: "PAY-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      applicationId: "AD-" + (2050 + Math.floor(Math.random() * 49)),
      paidAt: new Date().toISOString(),
      amount: payload.amount,
    }
  }
}
