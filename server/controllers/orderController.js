const Order = require("../models/Order");
const Inventory = require("../models/Inventory");
const { sendLowStockEmail } = require("../utils/sendEmail");

// helper to escape regex metacharacters
const escapeRegex = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Place order (User)
exports.placeOrder = async (req, res) => {
  try {
    const { base, sauce, cheese, veggies } = req.body;

    // Reduce inventory for base
    await Inventory.findOneAndUpdate(
      { itemName: base },
      { $inc: { quantity: -1 } }
    );

    const order = await Order.create({
      userId: req.user.id,
      base,
      sauce,
      cheese,
      veggies
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// For route-based update (PATCH /:id/status)
exports.updateStatusById = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // If moving to Out for Delivery, decrement inventory for related items
    if (status === "Out for Delivery") {
      const itemsToDec = [];
      if (order.pizzaBase) itemsToDec.push(order.pizzaBase);
      if (order.sauce) itemsToDec.push(order.sauce);
      if (order.cheese) itemsToDec.push(order.cheese);
      if (Array.isArray(order.veggies)) itemsToDec.push(...order.veggies);

      const uniqueItems = [...new Set(itemsToDec)];

      for (const name of uniqueItems) {
        try {
          // Try flexible matching: exact (case-insensitive), contains, or fallback to `name` field
          const q = {
            $or: [
              { itemName: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } },
              { itemName: { $regex: escapeRegex(name), $options: 'i' } },
              { name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } },
              { name: { $regex: escapeRegex(name), $options: 'i' } }
            ]
          };

          const item = await Inventory.findOne(q);
          if (!item) {
            console.warn('Inventory item not found for name (tried flexible search):', name);
            continue;
          } else {
            console.log('Inventory match for', name, '->', item.itemName || item.name, '(_id:', item._id, ')');
          }

          const prevQty = typeof item.quantity === 'number' ? item.quantity : 0;
          const threshold = typeof item.threshold === 'number' ? item.threshold : 20;

          const updated = await Inventory.findByIdAndUpdate(
            item._id,
            { $inc: { quantity: -1 } },
            { new: true }
          );

          if (updated) {
            // ensure non-negative
            if (typeof updated.quantity === 'number' && updated.quantity < 0) {
              updated.quantity = 0;
              await Inventory.findByIdAndUpdate(updated._id, { quantity: 0 });
            }

            // send low stock alert when crossing threshold (prev > threshold && updated <= threshold)
            if (typeof updated.quantity === 'number' && prevQty > threshold && updated.quantity <= threshold) {
              try {
                await sendLowStockEmail(updated.itemName || updated.name, updated.quantity);
              } catch (e) {
                console.error('Failed sending low-stock email for', updated.itemName || updated.name, e.message);
              }
            }
          }
        } catch (e) {
          console.error('Error decrementing inventory for', name, e.message);
        }
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
