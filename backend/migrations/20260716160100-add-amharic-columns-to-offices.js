"use strict";

/**
 * Adds Amharic siblings for every user-visible office field. `services_am`
 * is a parallel `text[]`; it MUST be the same length as `services`, and
 * index N in AM corresponds to index N in EN. The app validator enforces
 * this on write; the DB just stores the two arrays.
 *
 * All AM columns are nullable at the DB level so existing rows aren't
 * invalidated. On new records the API requires AM to be filled.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("offices", "name_am", {
      type: Sequelize.STRING(150),
      allowNull: true,
    });
    await queryInterface.addColumn("offices", "department_am", {
      type: Sequelize.STRING(150),
      allowNull: true,
    });
    await queryInterface.addColumn("offices", "description_am", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("offices", "contact_person_am", {
      type: Sequelize.STRING(150),
      allowNull: true,
    });
    await queryInterface.addColumn("offices", "services_am", {
      type: Sequelize.ARRAY(Sequelize.STRING(150)),
      allowNull: false,
      defaultValue: [],
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("offices", "services_am");
    await queryInterface.removeColumn("offices", "contact_person_am");
    await queryInterface.removeColumn("offices", "description_am");
    await queryInterface.removeColumn("offices", "department_am");
    await queryInterface.removeColumn("offices", "name_am");
  },
};
