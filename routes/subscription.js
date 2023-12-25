const express = require("express");
const router = express.Router();
const mongoDb = require("../models");
const { Subscription } = mongoDb.models;

//creating a subscription
router.post("/subscription", async (req, res) => {
  try {
    const { name, userCredits, price } = req.body;

    if (name && userCredits && price) {
      const newSubscription = new Subscription({
        name: name,
        userCredits: userCredits,
        price: price,
      });
      await newSubscription.save();
      res.json(newSubscription);
    } else {
      res.status(400).json({ message: "Veuillez remplir tous les champs" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Display a subscription
router.get("/subscription/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (id) {
      const subscription = await Subscription.findById(id);

      res.status(200).json({ subscription });
    } else {
      res.status(400).json({ message: "Missing parameters" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// display all subscriptions
router.get("/subscription", async (req, res) => {
  try {
    const subscriptions = await Subscription.find();

    res.status(200).json({ subscriptions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//updating a subscription
router.put("/subscription/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (id) {
      const subscription = await Subscription.findById(id);
      const { name, userCredits, price } = req.body;

      if (name) {
        subscription.name = name;
      }
      if (userCredits) {
        subscription.userCredits = userCredits;
      }
      if (price) {
        subscription.price = price;
      }
      await subscription.save();
      res.status(200).json(subscription);
    } else {
      res.status(400).json({ message: "Missing parameters" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//deleting a subscription
router.delete("/subscription/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (id) {
      const subscription = await Subscription.findById(id);

      if (!subscription) {
        res.status(400).json({ message: "wrong id" });
      } else {
        await subscription.deleteOne();
        res.status(200).json({ message: "subscription successfully deleted" });
      }
    } else {
      res.status(400).json({ message: "Missing parameters" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
