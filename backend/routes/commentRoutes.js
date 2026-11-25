

const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  addComment,
  getComments
} = require("../controllers/commentController");

router.post("/:id/comments", protect, addComment);
router.get("/:id/comments", protect, getComments);

module.exports = router;

