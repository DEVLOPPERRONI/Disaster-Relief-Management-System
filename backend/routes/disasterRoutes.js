const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  listDisasters,
  searchDisasters,
  getDisasterById,
  createDisaster,
  updateDisaster,
  deleteDisaster,
} = require("../controllers/disasterController");

const router = express.Router();

router.use(authMiddleware);
router.get("/", listDisasters);
router.get("/search", searchDisasters);
router.get("/:id", getDisasterById);
router.post("/", createDisaster);
router.put("/:id", updateDisaster);
router.delete("/:id", deleteDisaster);

module.exports = router;

