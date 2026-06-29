import { Router } from "express";

import { validate } from "../middleware/validation.middleware.js";
import { requireAdmin, requireEmployee } from "../middleware/auth.middleware.js";
import { employeeIdParamSchema, registerEmployeeSchema, updateEmployeeSchema } from "../validators/index.js";
import { employeeController } from "../controllers/index.js";
import { REQUEST_TYPES } from "../config/constants.js";

const router = Router();

router.get(
    '/me',
    requireEmployee,
    employeeController.getMyEmployeeProfile
);

router.get(
    "/",
    requireAdmin,
    employeeController.getEmployees
);

router.get(
    "/profiles",
    requireAdmin,
    employeeController.getEmployeeProfiles
);

router.get(
    "/:employeeId",
    requireAdmin,
    validate(employeeIdParamSchema, REQUEST_TYPES.PARAMS), 
    employeeController.getEmployeeById
);
router.post(
    "/", 
    requireAdmin,
    validate(registerEmployeeSchema, REQUEST_TYPES.BODY), 
    employeeController.registerEmployee
);

router.patch(
    "/:employeeId",
    requireAdmin,
    validate(employeeIdParamSchema, REQUEST_TYPES.PARAMS),
    validate(updateEmployeeSchema, REQUEST_TYPES.BODY),
    employeeController.updateEmployee
);

router.patch(
    "/:employeeId/activate",
    requireAdmin,
    validate(employeeIdParamSchema, REQUEST_TYPES.PARAMS),
    employeeController.activateEmployee
);

router.patch(
    "/:employeeId/deactivate",
    requireAdmin,
    validate(employeeIdParamSchema, REQUEST_TYPES.PARAMS),
    employeeController.deactivateEmployee
);

router.delete(
    "/:employeeId",
    requireAdmin,
    validate(employeeIdParamSchema, REQUEST_TYPES.PARAMS),
    employeeController.deleteEmployee
);

export default router;
