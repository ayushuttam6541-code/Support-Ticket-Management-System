
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

const {
  createTicket,
  getMyTickets,
  getAllTickets,
  updateTicket,
  deleteTicket,
  updateTicketStatus,
  getTicketDetails,
  getDashboardStats
} = require("../controllers/ticketController");

// Admin routes (must come before /:id to avoid route conflict)
router.get("/stats", protect, adminOnly, getDashboardStats);
router.get("/", protect, adminOnly, getAllTickets);
router.patch("/:id/status", protect, adminOnly, updateTicketStatus);

// User routes
router.post("/", protect, createTicket);
router.get("/my", protect, getMyTickets);
router.put("/:id", protect, updateTicket);
router.delete("/:id", protect, deleteTicket);
router.get("/:id", protect, getTicketDetails);

module.exports = router;
