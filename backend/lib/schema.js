const mongoose = require("mongoose");

/**
 * Every document serialises to exactly the shape `frontend/src/lib/data.js`
 * exposes: a business `id` ("ST-8801"), no `_id`/`__v`. The Mongo id is kept
 * as `recordId` for rows that need addressing but have no unique business id.
 */
const toJSON = {
  transform(doc, ret) {
    ret.recordId = String(ret._id);
    delete ret._id;
    delete ret.__v;
    delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
  },
};

function schema(definition, options = {}) {
  return new mongoose.Schema(definition, {
    timestamps: true,
    toJSON,
    versionKey: false,
    ...options,
  });
}

module.exports = { schema, toJSON };
