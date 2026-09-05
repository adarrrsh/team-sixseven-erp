const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

const UserSchema = schema({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["admin", "faculty", "student", "applicant"], required: true, index: true },
  linkedId: { type: String, default: "" },
});

UserSchema.set("toJSON", {
  transform(doc, ret) {
    ret.recordId = String(ret._id);
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
  },
});

module.exports = mongoose.model("User", UserSchema);
