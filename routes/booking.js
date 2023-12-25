const express = require("express");
const router = express.Router();
const mongoDb = require("../models");
const isAuthenticated = require("../middlewares/isAuthenticated");
const { Booking } = mongoDb.models;
const { Activity } = mongoDb.models;

// Create booking
router.post("/booking", isAuthenticated, async (req, res) => {
  // console.log(req.user.name);
  try {
    const { name, firstname, address, category, date, activityId } = req.body;
    // Checking if name, firstname and date are been passed to body

    if (!date) {
      return res.status(400).json({ message: "Choose a reservation date" });
    }
    // Check if activity exists and remove a spot
    const activity = await Activity.findById(req.body.activityId).populate(
      "owner"
    );
    console.log(activity.owner);
    if (!activity) {
      return res.status(500).json({ message: "Activity not found" });
    }
    if (activity.spots < 1) {
      return res.status(500).json({ message: "Not enought spots available" });
    }
    activity.spots = activity.spots - 1;
    await activity.save();
    const newBooking = new Booking({
      firstname: req.user.firstname,
      name: req.user.name,
      nameOfActivity: activity.name,
      category: activity.category,
      image: activity.image,
      address: activity.owner.address,
      date: date,
      dateOfBooking: new Date(),
      activity: activityId,
    });

    await newBooking.save();
    console.log(newBooking);
    res.status(201).json({
      message: `spot successfully booked`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Read a booking by date
router.get("/booking", async (req, res) => {
  try {
    // console.log(req.query);
    //
    const dateOfDay = new Date();
    console.log(dateOfDay);
    if (req.query.date === "past") {
      const booking = await Booking.find({ date: { $lte: dateOfDay } });
      res.json(booking);
    } else if (req.query.date === "upcoming") {
      const booking = await Booking.find({ date: { $gte: dateOfDay } });
      res.json(booking);
    } else {
      const booking = await Booking.find({ date: req.query.date }).sort({
        date: "asc",
      });
      res.json(booking);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read a booking by id
router.get("/booking/:id", async (req, res) => {
  try {
    console.log(req.params);
    const booking = await Booking.findById(req.params.id);
    if (booking) {
      res.json(booking);
    } else {
      res.status(400).json({ message: "No booking found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/booking/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { firstname, name, date, category, address, activity } = req.body;
    const bookingToModify = await Booking.findById(bookingId);
    if (firstname) bookingToModify.firstname = firstname;
    if (name) bookingToModify.name = name;
    if (date) bookingToModify.date = date;
    if (category) bookingToModify.category = category;
    if (address) bookingToModify.address = address;
    if (activity) bookingToModify.activity = activity;
    await bookingToModify.save();
    res.status(200).json(bookingToModify);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.delete("/booking/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;

    const bookingToDelete = await Booking.findByIdAndDelete(bookingId);
    console.log(bookingToDelete);
    const activityToUpdate = await Activity.findById(bookingToDelete.activity);

    activityToUpdate.spots = activityToUpdate.spots + 1;
    await activityToUpdate.save();
    // res.json(activityToUpdate);
    res.status(200).json({ message: "Booking cancelled and activity updated" });
    // console.log(activityToUpdate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
