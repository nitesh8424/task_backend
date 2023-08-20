const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  id : {type: String, required : true},
  title: { type: String, required: true },
  description: { type: String, required: true },
  keywords: [{ type: String }],
  imageUrl: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  teamName: { type: String, required: true },
  tag: { type: String },
  uploadDate: { type: Date, default: Date.now },
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
