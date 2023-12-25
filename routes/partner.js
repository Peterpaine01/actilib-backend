const express = require("express");
const fileUpload = require("express-fileupload");
const convertToBase64 = require("../utils/convertToBase64");

const router = express.Router();
const mongoDb = require("../models");
const { Partner } = mongoDb.models;
const { Activity } = mongoDb.models;

const cloudinary = require("cloudinary").v2;

// CREATE partner
router.post("/partner", fileUpload(), async (req, res) => {
  try {
    const {
      email,
      name,
      description,
      activities,
      address,
      postcode,
      city,
      country,
      latitude,
      longitude,
    } = req.body;

    const image = req.files?.image;

    // Checking if email has been passed to body
    if (!email) {
      return res.json({ message: "Partner email is required" });
    }

    // checking if email is not already in database
    const partnerFound = await Partner.findOne({ email: email });
    // if find email partner then error
    if (partnerFound !== null) {
      // error 409 = conflit
      return res.status(409).json({
        message: "Partner already exists",
      });
    }

    // Checking if name has been passed to body
    if (!name) {
      return res.json({ message: "Partner name is required" });
    }

    const newPartner = new Partner({
      email: email,
      name: name,
      description: description,
      activities: activities,
      address: {
        address: address,
        postcode: postcode,
        city: city,
        country: country,
        latitude: latitude,
        longitude: longitude,
      },
    });

    if (image) {
      // transforming image in string readable by cloudinary
      const transformedPicture = convertToBase64(image);

      // sending request to cloudianry for uploading my image
      const result = await cloudinary.uploader.upload(transformedPicture, {
        folder: `partners/${newPartner._id}`,
      });
      // req.image = result;
      newPartner.image = result;
      console.log(result);
    }
    console.log(newPartner);
    await newPartner.save();
    res.json(newPartner);
  } catch (error) {
    console.log(error);
  }
});

// READ partners with filters
router.get("/partners", async (req, res) => {
  try {
    const { name, activities, address, sort, page, display } = req.query;

    // creating an Object with which I will give an argument to 'find'
    const filter = {};

    // SEARCH BY NAME
    // According to the recieved queries, I modify my filter Object
    if (name) {
      filter.name = new RegExp(name, "i");
    }

    // SEARCH BY ACTIVITIES
    // According to the recieved queries, I modify my filter Object
    if (activities) {
      filter.activities = new RegExp(activities, "i");
    }

    // SEARCH BY ADDRESS : address, city, postcode, country
    if (address) {
      filter["$or"] = [
        { "address.adress": new RegExp(address, "i") },
        { "address.postcode": new RegExp(address, "i") },
        { "address.city": new RegExp(address, "i") },
        { "address.country": new RegExp(address, "i") },
      ];
    }

    // creating an Object with which I will give an argument to 'sort'
    const sortFilter = {};

    // SORT BY ALPHABETICAL ORDER
    // En fonction des queries reçus, je construit mon objet
    if (sort === "name-desc") {
      sortFilter.name = "desc";
    } else if (sort === "name-asc") {
      sortFilter.name = "asc";
    }

    // PAGINATION
    let pageToDisplay = 1;
    if (page) {
      pageToDisplay = page;
    }
    let limitPartners = 0;
    if (display) {
      limitPartners = display;
    }
    // Calculating skip according to received query page
    const skip = (pageToDisplay - 1) * display; // 5 * pageToSend -5

    // Fetching partners
    const partners = await Partner.find(filter)
      .sort(sortFilter)
      .limit(display)
      .skip(skip)
      .select("name email description activities image address");

    // Checking how many partners match the research
    const numberOfPartners = await Partner.countDocuments(filter);
    res.json({ count: numberOfPartners, partners: partners });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// READ partner by id
router.get("/partner/:id", async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    const partnerActivities = await Activity.find({ owner: req.params.id });
    console.log(partnerActivities);
    res.json({ partner: partner, activitiesToBooked: partnerActivities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE partner
router.put("/partner/:id", fileUpload(), async (req, res) => {
  try {
    const partnerToUpdate = await Partner.findById(req.params.id);
    // console.log(partnerToUpdate);

    const image = req.files?.image;

    const {
      email,
      name,
      description,
      activities,
      address,
      postcode,
      city,
      country,
      latitude,
      longitude,
    } = req.body;

    // Checking if name and email have been passed to body
    if (!name && !email) {
      return res.json({ message: "Partner name and email are required" });
    } else {
      partnerToUpdate.email = email;
      partnerToUpdate.name = name;
      partnerToUpdate.description = description;

      // if new activities
      const newActivities = [...partnerToUpdate.activities];
      newActivities.push(activities);

      //if request to delet activities > Lot 2

      partnerToUpdate.activities = newActivities;
      partnerToUpdate.address = {
        address: address,
        postcode: postcode,
        city: city,
        country: country,
        latitude: latitude,
        longitude: longitude,
      };

      if (image === undefined) {
        partnerToUpdate.image = partnerToUpdate.image;
      } else {
        // transforming image in string readable by cloudinary
        const transformedPicture = convertToBase64(image);
        // sending request to cloudianry for uploading my image
        const result = await cloudinary.uploader.upload(transformedPicture, {
          folder: `partners/${partnerToUpdate._id}`,
        });

        partnerToUpdate.image = result;
      }
      await partnerToUpdate.save();
      res.json(partnerToUpdate);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE partner by id
router.delete("/partner/:id", async (req, res) => {
  try {
    // if id exist in params
    if (req.params.id) {
      // find partner by id and delete
      await Partner.findByIdAndDelete(req.params.id);
      res.json({ message: "Partner removed" });
    } else {
      // else no id has been transmitted
      res.json({ messsage: "Missing id" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
