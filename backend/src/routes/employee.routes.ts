import { Router } from "express";

import { validate } from "../middleware/validation.middleware.js";
import { employeeIdParamSchema, registerEmployeeSchema, updateEmployeeSchema } from "../validators/index.js";
import { employeeController } from "../controllers/index.js";
import { REQUEST_TYPES } from "../../../shared/src/constants/app.constants.js";

const router = Router();

router.get("/", employeeController.getEmployees);
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
