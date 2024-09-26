const { Student } = require("../models");

const allStudents = async (req, res, next) => {
  // Logic for fetching all students
};

const createStudent = async (req, res, next) => {
  // Logic for creating a new students
};

const singleStudent = async (req, res, next) => {
  // Logic for fetching a single students by ID
};

const updateStudent = async (req, res, next) => {
  // Logic for updating a students by ID
};

const deleteStudent = async (req, res, next) => {
  // Logic for deleting a students by ID
};

module.exports = {
  allStudents,
  createStudent,
  singleStudent,
  updateStudent,
  deleteStudent,
};
