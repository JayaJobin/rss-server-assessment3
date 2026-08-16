'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FeedStatuses', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      feedSourceId: { type: Sequelize.INTEGER, allowNull: true, unique: true },
      label: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'ok' }, // 'ok' | 'empty' | 'error'
      message: { type: Sequelize.STRING, allowNull: true },
      lastCheckedAt: { type: Sequelize.DATE, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('FeedStatuses');
  },
};
