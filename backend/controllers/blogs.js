const { Blog, User } = require("../models");

const allBlogs = async (req, res, next) => {
  // Logic for fetching all blogs
};

const createBlog = async (req, res, next) => {
  // Logic for creating a new blog
};

const singleBlog = async (req, res, next) => {
  // Logic for fetching a single blog by ID
};

const updateBlog = async (req, res, next) => {
  // Logic for updating a blog by ID
};

const deleteBlog = async (req, res, next) => {
  // Logic for deleting a blog by ID
};

module.exports = {
  allBlogs,
  createBlog,
  singleBlog,
  updateBlog,
  deleteBlog,
};