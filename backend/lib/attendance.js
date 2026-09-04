const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");

const modelFor = (holderType) => (holderType === "faculty" ? Faculty : Student);

/**
 * Rewrites the holder's attendance percentage from their day records, so the
 * figure the portals already show is derived from real scans rather than drifting
 * on its own. Holders with no records yet keep whatever they had.
 */
async function syncPercentage(holderType, holderId) {
  const rows = await Attendance.find({ holderType, holderId }, { status: 1, _id: 0 }).lean();
  if (!rows.length) return null;

  const present = rows.filter((r) => r.status === "Present").length;
  const percentage = Math.round((present / rows.length) * 100);

  await modelFor(holderType).updateOne({ id: holderId }, { attendance: percentage });
  return { percentage, present, days: rows.length };
}

/** YYYY-MM-DD for a date, in the server's local calendar. */
function toDate(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/**
 * Recomputes every stored percentage from the register.
 *
 * `syncPercentage` only fires for whoever a scan touched, so anyone who has
 * never tapped keeps whatever figure they were created with — which is how the
 * stored value and the register drift apart. Reconciling closes that gap for
 * the whole cohort at once.
 */
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
