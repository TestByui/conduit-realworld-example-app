const express = require("express");
const router = express.Router();
const studentsController = require("../controllers/students");

router.get("/", studentsController.allStudents);
router.post("/", studentsController.createStudent);
router.get("/:id", studentsController.singleStudent);
router.put("/:id", studentsController.updateStudent);
router.delete("/:id", studentsController.deleteStudent);

module.exports = router;
