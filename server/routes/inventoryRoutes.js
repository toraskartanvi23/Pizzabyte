const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const sendLowStockEmail = require("../utils/sendEmail");

// ✅ Get all inventory
router.get("/", async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update quantity & check low stock
router.put("/:id", async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { quantity },
      { new: true }
    );

    if (item && item.quantity < 20) {
      await sendLowStockEmail(item.name || item.itemName, item.quantity);
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an inventory item (Admin)
router.delete("/:id", async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted", item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
