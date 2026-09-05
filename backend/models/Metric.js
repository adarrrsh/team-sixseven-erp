const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

const MetricSchema = schema({
  series: { type: String, required: true, index: true },
  label: { type: String, required: true },
  value: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
});

MetricSchema.index({ series: 1, label: 1 }, { unique: true });

module.exports = mongoose.model("Metric", MetricSchema);
