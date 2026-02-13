const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ["base", "sauce", "cheese", "veggie", "meat"],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  threshold: {
    type: Number,
    default: 20
  }
});

module.exports = mongoose.model("Inventory", inventorySchema);
