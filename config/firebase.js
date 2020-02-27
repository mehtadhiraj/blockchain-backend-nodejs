let admin = require("firebase-admin");
let serviceAccount = require("./blockchain-banking.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://blockchain-banking.firebaseio.com"
});

let db = admin.database();
// let ref = db.ref("/transactions");

module.exports = db;