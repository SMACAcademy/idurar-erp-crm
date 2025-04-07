const mongoose = require("mongoose");

const QuerySchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["Open", "InProgress", "Closed"], default: "Open" },
    resolution: { type: String, maxlength: 100 },
    notes: [
      {
        text: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Query", QuerySchema);
