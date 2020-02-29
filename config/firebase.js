let admin = require("firebase-admin");
let serviceAccount = require("./blockchain-banking.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_URL
});

let db = admin.database();
// let ref = db.ref("/transactions");

module.exports = db;