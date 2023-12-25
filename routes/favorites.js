const express = require("express");
const app = express();
const router = express.Router();
const mongoDb = require("../models");
const mongoose = require("mongoose");
const { token } = require("morgan");

app.use(express.json());
app.use("/", router);

//needed models
const { User } = mongoDb.models;
const { Activity } = mongoDb.models;

//conection to database
mongoose.createConnection(process.env.MONGODB_URI);

//adding a favorite to the user favorites list
router.put("/user/addFavorite/:userId/:activityId", async (req, res) => {
  try {
    const { userId, activityId } = req.params;

    if (userId && activityId) {
      const user = await User.findById(userId);

      user.favorites.push(activityId);

      await user.save();
      await user.populate("favorites");

      res.status(200).json(user.favorites);
    } else {
      res.status(200).json({ message: "missing parameter" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//deleting a favorite from the user favorites list
router.delete("/user/deleteFavorite/:userId/:activityId", async (req, res) => {
  try {
    const { userId, activityId } = req.params;

    if (userId && activityId) {
      const user = await User.findById(userId);
      const favoriteIndex = user.favorites.findIndex((activity) =>
        activity._id.equals(activityId)
      );
      user.favorites.splice(favoriteIndex, 1);

      await user.save();
      await user.populate("favorites");

      res
        .status(200)
        .json({ message: "favorite successfully removed from the list" });
    } else {
      res.status(200).json({ message: "missing parameter" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//.displaying all favorites
router.get("/user/favorites/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId) {
      const user = await User.findById(userId).populate({
        path: "favorites",
        populate: { path: "owner" },
      });

      res.status(200).json(user.favorites);
    } else {
      res.status(200).json({ message: "missing parameter" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
