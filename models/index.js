const mongoose = require("mongoose");
const mongoDb = mongoose.createConnection(process.env.MONGODB_URI);

mongoDb.model(
  "Company",
  new mongoose.Schema({
    email: String,
    name: String,
    subscriptionParticipation: Number,
  })
);

mongoDb.model(
  "Subscription",
  new mongoose.Schema({
    name: String,
    userCredits: Number,
    price: Number,
  })
);

mongoDb.model(
  "User",
  new mongoose.Schema({
    name: String,
    firstname: String,
    email: String,
    hash: String,
    salt: String,
    token: String,
    birthDate: Date,
    seniorityDate: Date,
    avatar: Object,
    addresses: [
      {
        title: String,
        address: String,
        postCode: String,
        city: String,
        country: String,
        latitude: Number,
        longitude: Number,
      },
    ],
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    remainingCredits: Number,
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Activity",
      },
    ],
    nextSubscription: {
      subscriptionId: String,
      startDate: Date,
    },
  })
);

mongoDb.model(
  "Partner",
  new mongoose.Schema({
    email: String,
    name: String,
    description: String,
    activities: Array,
    address: {
      address: String,
      postcode: String,
      city: String,
      country: String,
      latitude: Number,
      longitude: Number,
    },
    image: Object,
  })
);

mongoDb.model(
  "Activity",
  new mongoose.Schema({
    name: String,
    description: String,
    category: String,
    spots: Number,
    date: [Date],
    price: Number,
    image: Object,
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      // strictPopulate: false,
    },
  })
);

mongoDb.model(
  "Booking",
  new mongoose.Schema({
    firstname: String,
    name: String,
    category: String,
    nameOfActivity: String,
    address: [Object],
    date: Date,
    dateOfBooking: Date,
    image: Object,
    activity: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Activity",
      },
    ],
  })
);

module.exports = mongoDb;
