/**
 * Emits a "content:updated" event on the Socket.IO broadcast room so any
 * public page (office guide, appearance preview, etc.) knows to refetch.
 * Every mutation on floors, offices or theme settings should call this.
 *
 * Rooms:
 *   - "signage:all" — every connected socket auto-joins on connect.
 */
const emitSignageUpdate = (req, payload = {}) => {
  try {
    const io = req.app.get("socketio");
    if (!io) return;
    io.to("signage:all").emit("signage:content:updated", {
      at: new Date().toISOString(),
      ...payload,
    });
  } catch (err) {
    console.error("emitSignageUpdate error:", err.message);
  }
};

module.exports = { emitSignageUpdate };
