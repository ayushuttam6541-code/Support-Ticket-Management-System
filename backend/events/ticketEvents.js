
const EventEmitter = require("events");
const Activity = require("../models/Activity");

const ticketEvents = new EventEmitter();

ticketEvents.on("ticketActivity", async (data) => {
  try {
    await Activity.create({
      ticket: data.ticket,
      performedBy: data.performedBy,
      event: data.event,
      details: data.details
    });

    console.log(`Event recorded: ${data.event}`);
  } catch (error) {
    console.error("Activity logging failed:", error.message);
  }
});

module.exports = ticketEvents;
