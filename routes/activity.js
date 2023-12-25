const express = require("express");
const fileUpload = require("express-fileupload");
const convertToBase64 = require("../utils/convertToBase64");

const router = express.Router();
const mongoDb = require("../models");
const { Activity } = mongoDb.models;
const { Partner } = mongoDb.models;

const cloudinary = require("cloudinary").v2;

// CREATE activity
router.post("/activity", fileUpload(), async (req, res) => {
  try {
    const { name, description, category, spots, price, date, owner } = req.body;
    const image = req.files?.image;

    // Checking if name has been passed to body
    if (!name || !spots || !price) {
      return res.json({
        message: "Activity name, pots and price and required",
      });
    }

    const newActivity = new Activity({
      name: name,
      description: description,
      category: category,
      spots: spots,
      price: price,
      date: date,
      owner: owner,
    });

    if (image) {
      // transforming image in string readable by cloudinary
      const transformedPicture = convertToBase64(image);

      // sending request to cloudianry for uploading my image
      const result = await cloudinary.uploader.upload(transformedPicture, {
        folder: `activities/${newActivity._id}`,
      });
      newActivity.image = result;
    }
    await newActivity.save();
    await newActivity.populate("owner");
    res.json(newActivity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// READ activities with filters
router.get("/activities", async (req, res) => {
  try {
    const { name, category, startDate, endDate, address } = req.query;

    // creating an Object with which I will give an argument to 'find'
    const filter = {};

    // SEARCH BY NAME
    // According to the recieved queries, I modify my filter Object
    if (name) {
      filter.name = new RegExp(name, "i");
    }

    // SEARCH BY CATEGORY
    // According to the recieved queries, I modify my filter Object
    if (category) {
      filter.category = new RegExp(category, "i");
    }

    // SEARCH BY DATE RANGE
    if (startDate) {
      filter.date = {
        // $gte: start_date.toISOString(),
        $gte: new Date(startDate),
      };
    }

    if (endDate) {
      // if key Date already exist, I don't crush it, I simply add another key
      if (filter.date) {
        // filter.date.$lte = end_date.toISOString();
        filter.date.$lte = new Date(endDate);
      } else {
        filter.date = {
          // $lte: end_date.toISOString(),
          $lte: new Date(endDate),
        };
      }
    }

    // SEARCH BY ADDRESS PARTNERS : address, city, postcode, country

    const filterPartners = {};

    if (address) {
      filterPartners["$or"] = [
        { "address.adress": new RegExp(address, "i") },
        { "address.postcode": new RegExp(address, "i") },
        { "address.city": new RegExp(address, "i") },
        { "address.country": new RegExp(address, "i") },
      ];
    }

    // fetching partners matching address request
    const partners = await Partner.find(filterPartners).select("_id");

    if (partners) {
      filter.owner = partners;
    }

    console.log(filter);

    // FETCHING ACTIVITIES
    const activities = await Activity.find(filter).populate("owner");
    // console.log(activities);

    // Je regarde combien d'offres corespondent à mes recherches
    const numberOfAcvities = await Activity.countDocuments(filter);

    res.json({ count: numberOfAcvities, activities: activities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// READ an activity by id
router.get("/activity/:id", async (req, res) => {
  try {
    console.log(req.params);
    const activity = await Activity.findById(req.params.id).populate("owner");
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE activity by id
router.put("/activity/:id", fileUpload(), async (req, res) => {
  try {
    const activityToUpdate = await Activity.findById(req.params.id);
    // console.log(activityToUpdate);

    const image = req.files?.image;

    const { name, description, category, spots, date, price } = req.body;

    // Checking if name and email have been passed to body
    if (!name) {
      return res.json({ message: "Activity name is required" });
    } else {
      activityToUpdate.name = name;
      activityToUpdate.description = description;
      activityToUpdate.category = category;
      activityToUpdate.spots = spots;
      activityToUpdate.date = date;
      activityToUpdate.price = price;
    }

    if (image === undefined) {
      activityToUpdate.image = activityToUpdate.image;
    } else {
      // transforming image in string readable by cloudinary
      const transformedPicture = convertToBase64(image);
      // sending request to cloudianry for uploading my image
      const result = await cloudinary.uploader.upload(transformedPicture, {
        folder: `activities/${activityToUpdate._id}`,
      });

      activityToUpdate.image = result;
    }
    await activityToUpdate.save();
    res.json(activityToUpdate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE activity by id
router.delete("/activity/:id", async (req, res) => {
  try {
    // if id exist in params
    if (req.params.id) {
      // find activity by id and delete
      await Activity.findByIdAndDelete(req.params.id);
      res.json({ message: "Activity removed" });
    } else {
      // else no id has been transmitted
      res.json({ messsage: "Missing id" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
