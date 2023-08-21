const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const multer = require('multer');
const Image = require("../models/Image"); // Import the Image model
const verifyToken = require('../middleware/verifyToken');
const uuidv4 = require('uuid').v4;

const upload = multer({ dest: 'uploads/' });

// Upload an image
router.post("/upload", verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { title, description, keywords, width, height, teamName, tag } =
      req.body;
    const imageUrl = req.file.path;
    const uniqueId = uuidv4();
    const image = new Image({
      id: uniqueId,
      title,
      description,
      keywords,
      imageUrl,
      width: parseInt(width),
      height: parseInt(height),
      teamName,
      tag,
    });
    console.log("images", image);
    await image.save();
    res.status(200).json({ message: "Image uploaded successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while uploading the image" });
  }
});

// Search for images
router.get("/search", async (req, res) => {
  try {
    console.log("req", req.query);
    const keyword = req.query.keyword || "";
    const date = req.query.date || "";
    const teamName = req.query.teamName || "";
    const width = parseInt(req.query.width) || null;
    const height = parseInt(req.query.height) || null;
    const color = req.query.color || "";
    const sortBy = req.query.sortBy || ""; //optional add here
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1; //optional add
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    const query = {
      $and: [
        {
          $or: [
            { title: { $regex: keyword, $options: 'i' } },
            { keywords: { $regex: keyword, $options: 'i' } }
          ]
        },
        { teamName: teamName } 
      ]
    };
    
    if (width) {
      query.width = width;
    }if(height){
      query.height = height;
    }
    console.log('width', width)
    if (color) {
      query.color = color;
    }

    const aggregationPipeline = [];
    console.log('qeyeuqwrwr', query)
    if (date) {
      aggregationPipeline.push({
        $match: {
          uploadDate: {
            $gte: new Date(date),
            $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
          },
          ...query,
        },
      });
    } else {
      aggregationPipeline.push({ $match: query });
    }

    if (sortBy) {
      aggregationPipeline.push({ $sort: { [sortBy]: sortOrder } });
    }
    // console.log('agg', JSON.stringify(aggregationPipeline))
    const images = await Image.aggregate(aggregationPipeline)
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.json({ images });
    console.log('res Images', images)
  } catch (error) {
    console.error("Error during database query:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching search results" });
  }
});

module.exports = router;
