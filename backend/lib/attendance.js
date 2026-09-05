const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");

const modelFor = (holderType) => (holderType === "faculty" ? Faculty : Student);

async function syncPercentage(holderType, holderId) {
  const rows = await Attendance.find({ holderType, holderId }, { status: 1, _id: 0 }).lean();
  if (!rows.length) return null;

  const present = rows.filter((r) => r.status === "Present").length;
  const percentage = Math.round((present / rows.length) * 100);

  await modelFor(holderType).updateOne({ id: holderId }, { attendance: percentage });
  return { percentage, present, days: rows.length };
}

function toDate(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

async function reconcileAll(holderType) {
  const types = holderType ? [holderType] : ["student", "faculty"];
  const changed = [];

  for (const type of types) {
    const ids = await Attendance.distinct("holderId", { holderType: type });
    for (const id of ids) {
      const before = await modelFor(type).findOne({ id }, { attendance: 1, name: 1, _id: 0 }).lean();
      if (!before) continue;
      const after = await syncPercentage(type, id);
      if (after && after.percentage !== before.attendance) {
        changed.push({
          holderType: type,
          holderId: id,
          name: before.name,
          from: before.attendance,
          to: after.percentage,
        });
      }
    }
  }
  return changed;
}

module.exports = { syncPercentage, reconcileAll, toDate, modelFor };
