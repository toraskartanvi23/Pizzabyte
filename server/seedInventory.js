const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Inventory = require("./models/Inventory");

dotenv.config();

const inventoryData = [
  { itemName: "Thin Crust", category: "base", quantity: 50, threshold: 20 },
  { itemName: "Cheese Burst", category: "base", quantity: 40, threshold: 15 },
  { itemName: "Pan Pizza", category: "base", quantity: 30, threshold: 10 },
  { itemName: "Wheat Thin", category: "base", quantity: 35, threshold: 10 },
  { itemName: "Classic Hand Tossed", category: "base", quantity: 45, threshold: 15 },

  { itemName: "Tomato Sauce", category: "sauce", quantity: 50, threshold: 20 },
  { itemName: "BBQ Sauce", category: "sauce", quantity: 40, threshold: 15 },
  { itemName: "Pesto Sauce", category: "sauce", quantity: 30, threshold: 10 },
  { itemName: "White Garlic Sauce", category: "sauce", quantity: 35, threshold: 10 },
  { itemName: "Spicy Red Sauce", category: "sauce", quantity: 25, threshold: 10 },

  { itemName: "Mozzarella", category: "cheese", quantity: 40, threshold: 15 },
  { itemName: "Cheddar", category: "cheese", quantity: 35, threshold: 10 },
  { itemName: "Parmesan", category: "cheese", quantity: 30, threshold: 10 },
  { itemName: "Goat Cheese", category: "cheese", quantity: 25, threshold: 10 },
  { itemName: "Vegan Cheese", category: "cheese", quantity: 20, threshold: 10 },

  { itemName: "Onion", category: "veggie", quantity: 60, threshold: 20 },
  { itemName: "Capsicum", category: "veggie", quantity: 55, threshold: 15 },
  { itemName: "Mushroom", category: "veggie", quantity: 45, threshold: 15 },
  { itemName: "Olives", category: "veggie", quantity: 50, threshold: 15 },
  { itemName: "Corn", category: "veggie", quantity: 40, threshold: 10 }
];

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    await Inventory.insertMany(inventoryData);
    console.log("✅ Inventory seeded successfully!");
    process.exit();
  })
  .catch((err) => console.error(err));
