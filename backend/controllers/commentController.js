

const Comment = require("../models/Comment");
const Ticket = require("../models/Ticket");
const ticketEvents = require("../events/ticketEvents");

// ADD COMMENT
exports.addComment = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment message is required"
      });
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 2000 characters"
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    // Users can only comment on their own tickets.
    // Admins can comment on any ticket.
    if (
      req.user.role !== "admin" &&
      ticket.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot comment on this ticket"
      });
    }

    if (ticket.status === "Closed") {
      return res.status(400).json({
        success: false,
        message: "Cannot comment on a closed ticket"
      });
    }

    const comment = await Comment.create({
      ticket: ticket._id,
      user: req.user.id,
      message: message.trim()
    });

    ticketEvents.emit("ticketActivity", {
      ticket: ticket._id,
      performedBy: req.user.id,
      event: "COMMENT_ADDED",
      details: "New comment added"
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "name email role");

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: populatedComment
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add comment"
    });
  }
};

// GET COMMENTS
exports.getComments = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    if (
      req.user.role !== "admin" &&
      ticket.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const comments = await Comment.find({
      ticket: ticket._id
    })
      .populate("user", "name email role")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch comments"
    });
  }
};
