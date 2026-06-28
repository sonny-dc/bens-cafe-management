import { Router } from "express";

import { validate } from "../middleware/validation.middleware.js";
import { requireAdmin } from "../middleware/auth.middleware.js";
import { employeeIdParamSchema, registerEmployeeSchema, updateEmployeeSchema } from "../validators/index.js";
import { employeeController } from "../controllers/index.js";
import { REQUEST_TYPES } from "../config/constants.js";

const router = Router();

router.use(requireAdmin);

router.get(
    "/",
    employeeController.getEmployees
);

router.get(
    "/profiles",
    employeeController.getEmployeeProfiles
);

router.get(
    "/:employeeId",
    validate(employeeIdParamSchema, REQUEST_TYPES.PARAMS), 
    employeeController.getEmployeeById
);
router.post(
    "/", 
    validate(registerEmployeeSchema, REQUEST_TYPES.BODY), 
    employeeController.registerEmployee
);

router.patch(
    "/:employeeId",
    validate(employeeIdParamSchema, REQUEST_TYPES.PARAMS),
    validate(updateEmployeeSchema, REQUEST_TYPES.BODY),
    employeeController.updateEmployee
);

router.patch(
    "/:employeeId/activate",
    validate(employeeIdParamSchema, REQUEST_TYPES.PARAMS),
    employeeController.activateEmployee
);

router.patch(
    "/:employeeId/deactivate",
    validate(employeeIdParamSchema, REQUEST_TYPES.PARAMS),
    employeeController.deactivateEmployee
);

router.delete(
    "/:employeeId",
    validate(employeeIdParamSchema, REQUEST_TYPES.PARAMS),
    employeeController.deleteEmployee
);

export default router;
