const express = require("express");
const router = express.Router();
const blogsController = require("../controllers/blogs");

router.get("/", blogsController.allBlogs);
router.post("/", blogsController.createBlog);
router.get("/:id", blogsController.singleBlog);
router.put("/:id", blogsController.updateBlog);
router.delete("/:id", blogsController.deleteBlog);

module.exports = router;