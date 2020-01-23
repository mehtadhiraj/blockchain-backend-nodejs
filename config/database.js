const mongoose = require('mongoose');

// Handles all the database operations in the app.js
const initDatabase = function () {

  // Starting Database Connections
  console.log('Initializing Database Connection');

  // Connection Configuration for MongoDB
  var options = {
    reconnectTries: 10,
    useNewUrlParser: true
  };

  // Promise for connection to MongoDB URI 

  mongoose.Promise = global.Promise;
//   if (process.env.NODE_ENV == 'dev') {  
    // var dbUri = process.env.DB_HOST+'/'+process.env.DB_NAME;
    // var dbUri = process.env.DB_DEV_URI;
//   } else {
    var dbUri = process.env.DB_URI;
//   }
  mongoose.connect(dbUri, options);

  // Get the connection object
  var connection = mongoose.connection;

  // Connection Response Types
  // For handling and reporting conection successful
  connection.on('connected', function () {
    console.log('Trying to connect: ' + dbUri);
    console.log('Database Connection Status: Successful');
    console.log('Database Connnection Established: ' + dbUri);

    // Ending Database Connections
    console.log('Finished Database Connectivity');
  });

  // For handling and reporting error
  connection.on('error', function (err) {
    console.log('Trying to connect: ' + dbUri);
    console.log('Database Connection Status: Unsuccessful');
    console.log('Database Connection Error: ' + err);

    // Ending Database Connections
    console.log('Finished Database Connectivity');
  });

  // For handling and reporting disconnection
  connection.on('disconnected', function () {
    console.log('Trying to connect: ' + dbUri);
    console.log('Database Connection Status: Unsuccessful');
    console.log('Database Connection: Disconnected');

    // Ending Database Connections
    console.log('Finished Database Connectivity');
  });
};

module.exports = initDatabase;