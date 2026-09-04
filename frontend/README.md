# Origin · Campus ERP (frontend)

React 19 + Vite + Tailwind v4 + shadcn/ui + framer-motion. Four surfaces:
a shared **login**, an **admission application** with a dummy payment step,
and the **Admin**, **Faculty** and **Student** portals.

```bash
npm install
npm run dev      # http://localhost:5173
```

Point the app at the Express backend with `VITE_API_URL` (defaults to
`http://localhost:8000`). Payment calls fall back to a locally generated
receipt when the backend is not running, so every flow stays demoable.

## Routes

| Route | What it is |
| --- | --- |
| `/` | Sign-in (Admin / Faculty / Student) + helpdesk chatbot |
| `/apply` | Admission application → dummy payment → receipt |
| `/admin` | Dashboard with the React Flow institute graph |
| `/admin/admissions` | Requests · approved · rejected · fee tracker |
| `/admin/faculty` | Directory · leave · attendance · salary · timetable · invigilation |
| `/admin/students` | Directory · attendance · fees · fines · courses · exams · score |
| `/admin/finances` | Student fees · payroll · admission fees |
| `/admin/timetable` | Availability-driven timetable that re-staffs itself |
| `/admin/examinations` | Create / delete exams, history |
| `/admin/score` | View and update marks |
| `/faculty/*` | Today · timetable · class attendance · marks entry · leave · duty |
| `/student/*` | Overview · timetable · courses · exams · score · fees & fines |

## Conventions

- **Data export** — every table exports to `.csv` and `.xlsx` (`src/lib/export.js`).
- **Design** — white surfaces, pink primary, red/green/blue signals; rounded
  corners throughout; no gradients; no scroll-triggered animation (motion is
  limited to mount, hover and dialog transitions).
- **Colour tokens** live in `src/index.css` (`--pink`, `--pink-soft`,
  `--pink-strong`, and the same triple for red / green / blue). Soft fills are
  solid, never translucent, so text contrast always holds.
- **Mock data** lives in `src/lib/data.js` — swap it for API calls.

## Structure

```
src/
  components/      app-shell, data-table, charts, org-graph (React Flow),
                   timetable-grid, chatbot, hero-window, stat-card
  components/ui/   shadcn/ui primitives (button, card, table, tabs, dialog, …)
  lib/             data.js · export.js · api.js · utils.js
  pages/           login, apply, admin/*, faculty-portal, student-portal
```
