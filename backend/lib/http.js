function route(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const notFound = (what) => new HttpError(404, `${what} not found`);
const badRequest = (message) => new HttpError(400, message);

async function nextId(Model, prefix, floor) {
  const rows = await Model.find({ id: new RegExp(`^${prefix}`) }, { id: 1 }).lean();
  const highest = rows.reduce((max, r) => {
    const n = Number(String(r.id).slice(prefix.length));
    return Number.isFinite(n) && n > max ? n : max;
  }, floor - 1);
  return prefix + (highest + 1);
}

const contains = (value) =>
  new RegExp(String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

function pick(body, keys) {
  const out = {};
  for (const key of keys) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

module.exports = { route, HttpError, notFound, badRequest, nextId, contains, pick };
