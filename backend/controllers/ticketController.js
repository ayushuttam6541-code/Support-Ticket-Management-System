


const Comment = require("../models/Comment");
const Activity = require("../models/Activity");

const Ticket = require("../models/Ticket");
const ticketEvents = require("../events/ticketEvents");

// CREATE TICKET
exports.createTicket = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required"
      });
    }

    const ticket = await Ticket.create({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      createdBy: req.user.id
    });

    ticketEvents.emit("ticketActivity", {
      ticket: ticket._id,
      performedBy: req.user.id,
      event: "TICKET_CREATED",
      details: "New support ticket created"
    });

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create ticket"
    });
  }
};

// GET DASHBOARD STATS (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const [total, open, inProgress, resolved, closed, highPriority, recentTickets] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: "Open" }),
      Ticket.countDocuments({ status: "In Progress" }),
      Ticket.countDocuments({ status: "Resolved" }),
      Ticket.countDocuments({ status: "Closed" }),
      Ticket.countDocuments({ priority: "High", status: { $in: ["Open", "In Progress"] } }),
      Ticket.find().sort({ createdAt: -1 }).limit(5).populate("createdBy", "name email")
    ]);

    res.status(200).json({
      success: true,
      stats: { total, open, inProgress, resolved, closed, highPriority },
      recentTickets
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};

// GET MY TICKETS
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({
      createdBy: req.user.id
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets"
    });
  }
};

// ADMIN: GET ALL TICKETS (with search, filter, sort, pagination)
exports.getAllTickets = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } }
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sortField = req.query.sortBy || "createdAt";
    const sortOrder = req.query.order === "asc" ? 1 : -1;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate("createdBy", "name email")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      Ticket.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: tickets.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      tickets
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch all tickets"
    });
  }
};

// UPDATE MY TICKET
exports.updateTicket = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    if (["Resolved", "Closed"].includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot edit a resolved or closed ticket"
      });
    }

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid title"
        });
      }
      ticket.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid description"
        });
      }
      ticket.description = description.trim();
    }

    if (category !== undefined) {
      if (!["Technical", "Billing", "Account", "General"].includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category"
        });
      }
      ticket.category = category;
    }

    await ticket.save();

    ticketEvents.emit("ticketActivity", {
      ticket: ticket._id,
      performedBy: req.user.id,
      event: "TICKET_UPDATED",
      details: "Ticket details updated"
    });

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      ticket
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update ticket"
    });
  }
};

// DELETE MY TICKET
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    if (!["Open", "Closed"].includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message: "Only open or closed tickets can be deleted"
      });
    }

    await ticket.deleteOne();

    ticketEvents.emit("ticketActivity", {
      ticket: ticket._id,
      performedBy: req.user.id,
      event: "TICKET_DELETED",
      details: "Ticket deleted by owner"
    });

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete ticket"
    });
  }
};

// ADMIN: UPDATE STATUS AND PRIORITY
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status, priority } = req.body;

    const allowedStatus = [
      "Open", "In Progress", "Resolved", "Closed"
    ];

    const allowedPriority = ["Low", "Medium", "High"];

    if (
      status === undefined &&
      priority === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Status or priority is required"
      });
    }

    if (status !== undefined && !allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    if (priority !== undefined && !allowedPriority.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority"
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    const oldStatus = ticket.status;

    if (status !== undefined) ticket.status = status;
    if (priority !== undefined) ticket.priority = priority;

    await ticket.save();

    if (status !== undefined && oldStatus !== status) {
      ticketEvents.emit("ticketActivity", {
        ticket: ticket._id,
        performedBy: req.user.id,
        event: "STATUS_CHANGED",
        details: `Status changed from ${oldStatus} to ${status}`
      });

      if (status === "Resolved") {
        ticketEvents.emit("ticketActivity", {
          ticket: ticket._id,
          performedBy: req.user.id,
          event: "TICKET_RESOLVED",
          details: "Ticket marked as resolved"
        });
      }
    }

    if (priority !== undefined) {
      ticketEvents.emit("ticketActivity", {
        ticket: ticket._id,
        performedBy: req.user.id,
        event: "PRIORITY_CHANGED",
        details: `Priority changed to ${priority}`
      });
    }

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      ticket
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update ticket status"
    });
  }
};


exports.getTicketDetails = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("createdBy", "name email");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    if (
      req.user.role !== "admin" &&
      ticket.createdBy._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const [comments, activities] = await Promise.all([
      Comment.find({ ticket: ticket._id })
        .populate("user", "name email role")
        .sort({ createdAt: 1 }),

      Activity.find({ ticket: ticket._id })
        .populate("performedBy", "name role")
        .sort({ createdAt: -1 })
    ]);

    return res.status(200).json({
      success: true,
      ticket,
      comments,
      activities
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ticket details"
    });
  }
};
