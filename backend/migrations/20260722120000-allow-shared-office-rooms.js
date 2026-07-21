"use strict";

/**
 * Multiple ministry functions can share a physical room. Keep the lookup
 * index, but remove the uniqueness rule that previously discarded valid
 * directory entries such as the two offices assigned to room 109.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeConstraint(
      "offices",
      "offices_floor_room_unique"
    );
    await queryInterface.addIndex("offices", ["floor_id", "room_number"], {
      name: "offices_floor_room_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("offices", "offices_floor_room_idx");
    await queryInterface.addConstraint("offices", {
      fields: ["floor_id", "room_number"],
      type: "unique",
      name: "offices_floor_room_unique",
    });
  },
};
