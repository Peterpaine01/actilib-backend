require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

const app = express();

///FOREST ADMIN
const { createAgent } = require("@forestadmin/agent");
const {
  createMongooseDataSource,
} = require("@forestadmin/datasource-mongoose");
const connection = require("./models");

// const forestSetup = (app) => {
createAgent({
  authSecret: process.env.FOREST_AUTH_SECRET,
  envSecret: process.env.FOREST_ENV_SECRET,
  isProduction: process.env.NODE_ENV === "production",
})
  .addDataSource(createMongooseDataSource(connection), { flattenMode: "none" })
  .mountOnExpress(app)
  .start();
// };

//END OF FOREST ADMIN SETUP

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

//conection to database
mongoose.createConnection(process.env.MONGODB_URI);

// connecting to cloudinary account
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

app.use(require("./routes/company"));
app.use(require("./routes/subscription"));
app.use(require("./routes/user"));
app.use(require("./routes/activity"));
app.use(require("./routes/partner"));
app.use(require("./routes/booking"));
app.use(require("./routes/favorites"));

// undefined routes
app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

app.listen(process.env.PORT, () => {
  console.log("Server has started !");
});
