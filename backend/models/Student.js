"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Student extends Model {
    static associate({ User }) {
      this.belongsTo(User, { foreignKey: "userId", as: "author" });
    }
    toJSON() {
      return { ...this.get(), id: undefined, userId: undefined };
    }
  }
  Student.init(
    {
      firstName: DataTypes.STRING,
      lastName: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Student",
    }
  );
  return Student;
};
