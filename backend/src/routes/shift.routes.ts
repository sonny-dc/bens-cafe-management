import { Router } from "express";
import { shiftController } from "../controllers/index.js";

const router = Router();

router.post("/start", shiftController.startShift);
router.post("/:shiftId/end", shiftController.endShift);
router.get("/active/all", shiftController.getAllActiveShifts);
router.get("/active/:employeeId", shiftController.getActiveShift);
router.get("/summary", shiftController.getShiftSummary);
router.patch("/export-clear", shiftController.archiveShifts);

export default router;
