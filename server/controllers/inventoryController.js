const Inventory = require("../models/Inventory");

// Add inventory item (Admin)
exports.addItem = async (req, res) => {
  try {
    const { itemName, category, quantity, threshold } = req.body;

    const item = await Inventory.create({
      itemName,
      category,
      quantity,
      threshold
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all inventory items
exports.getInventory = async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update inventory quantity
exports.updateStock = async (req, res) => {
  try {
    const { quantity } = req.body;

    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { quantity },
      { new: true }
    );

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
