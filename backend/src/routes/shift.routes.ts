import { Router } from "express";
import { shiftController } from "../controllers/index.js";
import {
    startShiftSchema, 
    endShiftSchema, 
    shiftIdParamSchema, 
    employeeIdParamSchema, 
    getStaffWeeklyPerformanceQuerySchema, 
    shiftDateRangeSchema, 
    archiveShiftsSchema 
} from "../validators/index.js";
import { REQUEST_TYPES } from "../config/constants.js";
import { validate } from "../middleware/validation.middleware.js";
import { requireAdmin, requireEmployee } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
    '/my-active',
    requireEmployee,
    shiftController.getMyActiveShift
);

router.post(
    '/start',
    requireEmployee,
    validate(startShiftSchema, REQUEST_TYPES.BODY),
    shiftController.startShift
);

router.get(
    '/staff-performance',
    requireAdmin,
    validate(getStaffWeeklyPerformanceQuerySchema, REQUEST_TYPES.QUERY),
    shiftController.getStaffWeeklyPerformance
);

router.get(
    '/active/all',
    requireAdmin,
    shiftController.getAllActiveShifts
);

router.post(
    '/:shiftId/end',
    requireEmployee,
    validate(shiftIdParamSchema, REQUEST_TYPES.PARAMS),
    validate(endShiftSchema, REQUEST_TYPES.BODY),
    shiftController.endShift
);

router.get(
    '/active/:employeeId',
    requireAdmin,
    validate(employeeIdParamSchema, REQUEST_TYPES.PARAMS),
    shiftController.getActiveShift
);

router.get(
    '/summary', 
    requireAdmin,
    validate(shiftDateRangeSchema, REQUEST_TYPES.QUERY),
    shiftController.getShiftSummary
);

router.patch(
    '/export-clear', 
    requireAdmin,
    validate(archiveShiftsSchema, REQUEST_TYPES.BODY),
    shiftController.archiveShifts
);

export default router;
