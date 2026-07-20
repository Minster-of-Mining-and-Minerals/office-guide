"use strict";

module.exports = {
  async up() {
    // Deprecated: floors are seeded exclusively by
    // 20260716170000-reset-and-seed-mmid-directorate.js.
    // Keeping this file as a no-op preserves historical order while
    // avoiding duplicate inserts and unique-key conflicts.
    return;
  },

  async down() {
    return;
  },
};
