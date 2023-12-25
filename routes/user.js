const express = require("express");
const app = express();
const router = express.Router();
const mongoDb = require("../models");
const mongoose = require("mongoose");
const { token } = require("morgan");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const { body, validationResult, check } = require("express-validator");
const fileUpload = require("express-fileupload");
const convertToBase64 = require("../utils/convertToBase64");
const isAuthenticated = require("../middlewares/isAuthenticated.js");

app.use(express.json());
app.use("/", router);

const cloudinary = require("cloudinary").v2;

//needed models
const { User } = mongoDb.models;
const { Subscription } = mongoDb.models;
const { Company } = mongoDb.models;

//conection to database
mongoose.createConnection(process.env.MONGODB_URI);

//creation of users by a company on the database
router.post("/createUser", body("email").isEmail(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ errors: errors.array() });
    }
    // Retrieve email from the request body
    const { email, birthDate, seniorityDate, company, subscription } = req.body;

    if (email && birthDate && seniorityDate && company && subscription) {
      // Check if the email already exists in the database
      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        return res.status(200).json({
          message: "Un compte existe déjà avec cet email",
        });
      }

      //Find the subscription and company linked to the user by their id's and populate them
      const currentSubscription = await Subscription.findById(
        subscription
      ).populate(["name", "userCredits", "price"]);
      const currentCompany = await Company.findById(company).populate([
        "name",
        "email",
        "subscriptionParticipation",
      ]);

      // Create a new user with only the email
      const newUser = new User({
        email: email,
        birthDate: birthDate,
        seniorityDate: seniorityDate,
        company: currentCompany,
        subscription: currentSubscription,
        remainingCredits: currentSubscription.userCredits,
      });

      // Save the new user to the database
      await newUser.save();
      // Send a success response
      res.status(201).json({
        newUser,
      });
    } else {
      res.status(200).json({ message: "veuillez remplir tous les champs" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Sign up to access the password creation screen
router.post(
  "/user/signUp01",

  //middleware that checks the validity of the email
  body("email").isEmail(),

  async (req, res) => {
    try {
      //retrieving the informations send through the body of the request

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(200).json(errors);
      }

      const { email } = req.body;

      if (email) {
        //search through the database for an existing user
        const existingUser = await User.findOne({ email: email });

        //when the email is already present in the database
        if (existingUser) {
          if (existingUser.token) {
            res.status(200).json({
              message:
                "Un compte existe déjà avec cet email ,veuillez vous connecter",
            });
          } else {
            res.status(200).json({
              message:
                "L'email est présent dans la base de données, accédez à la création de mot de passe",
            });
          }
        } else {
          res.status(500).json({
            message:
              "Aucun compte n'existe avec cet email, veuillez contacter votre service RH",
          });
        }
      } else {
        res.status(200).json({ message: "veuillez remplir tous les champs" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

//Sign up to create the account
router.put(
  "/user/signUp02",
  //middleware that checks the validity of the email
  body("email").isEmail(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(200).json({ errors });
      }

      //retrieving the informations send through the body of the request
      const { email, password, name, firstname } = req.body;

      if (email && password && name && firstname) {
        //search through the database for an existing user
        const existingUser = await User.findOne({ email: email });

        //when the email is already present in the database
        if (!existingUser) {
          res.status(500).json({
            message:
              "Aucun compte n'existe avec cet email, veuillez contacter votre service RH",
          });
        } else {
          if (existingUser.token) {
            return res.status(200).json({
              message:
                "Un compte existe déjà avec cet email ,veuillez vous connecter",
            });
          } else {
            //encoding the password and creating a token
            const salt = uid2(16);
            const hash = SHA256(password + salt).toString(encBase64);
            const token = uid2(16);

            //creation of the User
            const updatedUser = await User.findOneAndUpdate(
              { email: email },
              {
                name: name,
                firstname: firstname,
                email: email,
                token: token,
                hash: hash,
                salt: salt,
              },
              { new: true }
            );

            //information sent to the frontend
            res.status(200).json({
              _id: updatedUser._id,
              token: updatedUser.token,
            });
          }
        }
      } else {
        res.status(200).json({ message: "veuillez remplir tous les champs" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

//Sign In Route
router.post("/user/signIn", body("email").isEmail(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ errors: "Veuillez saisir une adresse email valide" });
    }

    //retrieving the informations send through the body of the request
    const { email, password } = req.body;

    if (email && password) {
      //search through the database for an existing user
      const existingUser = await User.findOne({ email: email });

      //when the email is already present in the database
      if (existingUser) {
        //the user exist in the database and has already gone through the sign up process
        if (existingUser.token) {
          const hash = SHA256(password + existingUser.salt).toString(encBase64);
          //verifying the password
          if (existingUser.hash === hash) {
            res.status(200).json({ existingUser });
          } else {
            //if the password is incorect
            res.status(200).json({ message: "Le mot de passe est incorrect" });
          }
        } else {
          res.status(200).json({
            message: "Veuillez suivre le lien de première connexion",
          });
        }
      } else {
        //if the user does not exist in the database
        res.status(200).json({
          message:
            "L'email saisit n'existe pas dans la base de données, veuillez contacter votre service RH",
        });
      }
    } else {
      res.status(200).json({ message: "veuillez remplir tous les champs" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Reading route for one user by their id
router.get("/user/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (id) {
      const user = await User.findById(id).populate([
        "company",
        "subscription",
      ]);

      res.status(200).json({ user });
    } else {
      res.status(200).json({ message: "missing parameter" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//modifying one user based on their id
router.put(
  "/user/:id",
  check("email").optional().isEmail(),
  // isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const id = req.params.id;
      const {
        name,
        firstname,
        birthDate,
        subscriptionId,
        remainingCredits,
        nextSubscription,
      } = req.body;
      if (id) {
        const user = await User.findById(id);
        if (name) {
          user.name = name;
        }
        if (firstname) {
          user.firstname = firstname;
        }
        if (birthDate) {
          user.birthDate = birthDate;
        }
        if (subscriptionId) {
          const newSubscription = await Subscription.findById(subscriptionId);
          user.subscription = newSubscription;
        }
        if (remainingCredits) {
          user.remainingCredits = remainingCredits;
        }
        if (nextSubscription) {
          user.nextSubscription.subscriptionId =
            nextSubscription.subscriptionId;
          user.nextSubscription.startDate = nextSubscription.startDate;
        }
        if (req.files && req.files.image) {
          const imageToUpload = req.files.image;
          const result = await cloudinary.uploader.upload(
            convertToBase64(imageToUpload),
            { folder: `users/${user._id}` }
          );
          user.avatar = result;
        }

        await user.save();
        await user.populate(["company", "subscription"]);

        res.status(200).json(user);
      } else {
        res.status(200).json({ message: "missing parameter" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

//adding an adress to the user profil
router.put("/user/addAddress/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const { title, address, postCode, city, country, latitude, longitude } =
      req.body;
    if (id) {
      const user = await User.findById(id);

      if (title && address && postCode && city && country) {
        const newAdress = {
          title: title,
          address: address,
          postCode: postCode,
          city: city,
          country: country,
          latitude: latitude,
          longitude: longitude,
        };

        user.addresses.push(newAdress);

        await user.save();
        await user.populate(["company", "subscription"]);

        res.status(200).json(user.addresses);
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//deleting an address
router.delete(
  "/user/deleteAddress/:id/:addressId",
  isAuthenticated,
  async (req, res) => {
    try {
      const { id, addressId } = req.params;

      const user = await User.findById(id);

      if (addressId) {
        const addressIndex = user.addresses.findIndex((address) =>
          address._id.equals(addressId)
        );
        user.addresses.splice(addressIndex, 1);

        await user.save();
        res.status(200).json(user.addresses);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

//Deleting an user
router.delete("/user/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (id) {
      const user = await User.findById(id);
      if (!user) {
        res.status(200).json({ message: "wrong id" });
      } else {
        await user.deleteOne();
        res.status(200).json({ message: "user successfully deleted" });
      }
    } else {
      res.status(200).json({ message: "missing parameter" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
