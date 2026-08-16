'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RequestLogs', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      path: { type: Sequelize.STRING, allowNull: false },
      method: { type: Sequelize.STRING, allowNull: false, defaultValue: 'GET' },
      clientId: { type: Sequelize.STRING, allowNull: false },
      feedSourceId: { type: Sequelize.INTEGER, allowNull: true },
      statusCode: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 200 },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
    await queryInterface.addIndex('RequestLogs', ['feedSourceId']);
    await queryInterface.addIndex('RequestLogs', ['clientId']);
    await queryInterface.addIndex('RequestLogs', ['createdAt']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('RequestLogs');
  },
};
