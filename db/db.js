const mongoose = require('mongoose');
require('dotenv').config();

const Database = () => {
  const PORT = process.env.PORT;
  const username = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DATABASE;

  const mongoURI = `mongodb+srv://${username}:${password}@cluster0.uttybej.mongodb.net/${database}?retryWrites=true&w=majority`;

  mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "MongoDB connection error:"));
    db.once("open", () => {
        console.log("Connected to MongoDB");
    });
};

module.exports = Database;
