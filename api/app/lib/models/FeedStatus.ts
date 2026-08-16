import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from './db';

export type FeedHealth = 'ok' | 'empty' | 'error';

export class FeedStatus extends Model<InferAttributes<FeedStatus>, InferCreationAttributes<FeedStatus>> {
  declare id: CreationOptional<number>;
  declare feedSourceId: CreationOptional<number | null>;
  declare label: string;
  declare status: CreationOptional<string>;
  declare message: CreationOptional<string | null>;
  declare lastCheckedAt: Date;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

FeedStatus.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    feedSourceId: { type: DataTypes.INTEGER, allowNull: true, unique: true },
    label: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'ok' },
    message: { type: DataTypes.STRING, allowNull: true },
    lastCheckedAt: { type: DataTypes.DATE, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: true },
    updatedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, modelName: 'FeedStatus', tableName: 'FeedStatuses', timestamps: true }
);
