const mongoDb = require("../models");
const { User } = mongoDb.models;

//Middleware d'authentification

const isAuthenticated = async (req, res, next) => {
  try {
    //getting the Bearer token sent through authorization
    const currentToken = req.headers.authorization.replace("Bearer ", "");

    //search for an existing user with sent token
    const existingUser = await User.findOne({
      token: currentToken,
    });
    if (!existingUser) {
      return res.status(401).json({ error: "Unauthorized" });
    } else {
      req.user = existingUser;
      return next();
    }
  } catch (error) {
    res.status(400).json({ message: "the authentification failed" });
  }
};

module.exports = isAuthenticated;
