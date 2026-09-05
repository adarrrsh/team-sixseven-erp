const mongoose = require("mongoose");

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
