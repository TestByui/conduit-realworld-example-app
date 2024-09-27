"use strict";

module.exports = (sequelize, DataTypes) => {
  const Worker = sequelize.define('Worker', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'workers',
    timestamps: true
  });

  return Worker;
};