const express = require("express");
const router = express.Router();
const mongoDb = require("../models");
const { body, validationResult, check } = require("express-validator");

const { Company } = mongoDb.models;

//Creation a a company
router.post("/company", body("email").isEmail(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, subscriptionParticipation } = req.body;

    if (name && email && subscriptionParticipation) {
      const newCompany = new Company({
        name: name,
        email: email,
        subscriptionParticipation: subscriptionParticipation,
      });
      await newCompany.save();
      res.json(newCompany);
    } else {
      res.status(400).json({ message: "Veuillez remplir tous les champs" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Display a company
router.get("/company/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (id) {
      const company = await Company.findById(id);

      res.status(200).json({ company });
    } else {
      res.status(400).json({ message: "Missing parameters" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Updating a company
router.put(
  "/company/:id",
  check("email").optional().isEmail(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const id = req.params.id;

      if (id) {
        const company = await Company.findById(id);
        const { email, name, subscriptionParticipation } = req.body;

        if (email) {
          company.email = email;
        }
        if (name) {
          company.name = name;
        }
        if (subscriptionParticipation) {
          company.subscriptionParticipation = subscriptionParticipation;
        }

        await company.save();
        res.status(200).json({ company });
      } else {
        res.status(400).json({ message: "Missing parameters" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

//deleting a company
router.delete("/company/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (id) {
      const company = await Company.findById(id);

      if (!company) {
        res.status(400).json({ message: "wrong id" });
      } else {
        await company.deleteOne();
        res.status(200).json({ message: "company successfully deleted" });
      }
    } else {
      res.status(400).json({ message: "Missing parameters" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
