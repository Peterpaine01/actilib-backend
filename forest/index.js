// const { createAgent } = require("@forestadmin/agent");
// const {
//   createMongooseDataSource,
// } = require("@forestadmin/datasource-mongoose");
// const {
//   User,
//   Company,
//   Activity,
//   Booking,
//   Partner,
//   Subscription,
// } = require("../models");

// const forestSetup = (app) => {
//   createAgent({
//     authSecret: process.env.FOREST_AUTH_SECRET,
//     envSecret: process.env.FOREST_ENV_SECRET,
//     isProduction: process.env.NODE_ENV === "production",
//   })
//     .addDataSource(
//       createMongooseDataSource(
//         User,
//         Company,
//         Activity,
//         Booking,
//         Partner,
//         Subscription,
//         { flattenMode: "none" }
//       )
//     )
//     .mountOnExpress(app)
//     .start();
// };

// module.exports = forestSetup;
