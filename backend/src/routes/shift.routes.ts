import { Router } from "express";
import { shiftController } from "../controllers/index.js";

const router = Router();

router.post("/start", shiftController.startShift);
router.post("/:shiftId/end", shiftController.endShift);
router.get("/active/:employeeId", shiftController.getActiveShift);

export default router;
