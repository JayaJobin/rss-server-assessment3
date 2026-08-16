import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from './db';

export class RequestLog extends Model<InferAttributes<RequestLog>, InferCreationAttributes<RequestLog>> {
  declare id: CreationOptional<number>;
  declare path: string;
  declare method: CreationOptional<string>;
  declare clientId: string;
  declare feedSourceId: CreationOptional<number | null>;
  declare statusCode: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

RequestLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    path: { type: DataTypes.STRING, allowNull: false },
    method: { type: DataTypes.STRING, allowNull: false, defaultValue: 'GET' },
    clientId: { type: DataTypes.STRING, allowNull: false },
    feedSourceId: { type: DataTypes.INTEGER, allowNull: true },
    statusCode: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 200 },
    createdAt: { type: DataTypes.DATE, allowNull: true },
    updatedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'RequestLog',
    tableName: 'RequestLogs',
    timestamps: true,
    indexes: [{ fields: ['feedSourceId'] }, { fields: ['clientId'] }, { fields: ['createdAt'] }],
  }
);
