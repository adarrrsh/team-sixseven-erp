const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

/** Sign-in identity. Roles map to the three portals on the login page. */
const UserSchema = schema({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["admin", "faculty", "student", "applicant"], required: true, index: true },
  /** Links to Faculty.id, Student.id or Admission.id; empty for admins. */
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
