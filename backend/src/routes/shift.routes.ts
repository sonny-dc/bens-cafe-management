import { Router } from "express";
import { shiftController } from "../controllers/index.js";
import { startShiftSchema, endShiftSchema, shiftIdParamSchema, employeeIdParamSchema } from "../validators/index.js";
import { REQUEST_TYPES } from "../config/constants.js";
import { validate } from "../middleware/validation.middleware.js";

const router = Router();

router.post("/start", validate(startShiftSchema), shiftController.startShift);
router.post(
    "/:shiftId/end",
    validate(shiftIdParamSchema, REQUEST_TYPES.PARAMS),
    validate(endShiftSchema, REQUEST_TYPES.BODY),
    shiftController.endShift);
router.get("/active/all", shiftController.getAllActiveShifts);
router.get(
    "/active/:employeeId",
    validate(employeeIdParamSchema, REQUEST_TYPES.PARAMS),
    shiftController.getActiveShift);
router.get("/summary", shiftController.getShiftSummary);
router.patch("/export-clear", shiftController.archiveShifts);

export default router;
