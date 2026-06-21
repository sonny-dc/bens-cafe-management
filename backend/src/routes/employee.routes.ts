import { Router } from "express";

import { validate } from "../middleware/validation.middleware.js";
import { employeeIdParamSchema, registerEmployeeSchema, updateEmployeeSchema } from "../validators/employee.validator.js";
import { employeeController } from "../controllers/index.js";

const router = Router();

router.get("/", employeeController.getEmployees);
router.get(
    "/:employeeId", 
    validate(employeeIdParamSchema), 
    employeeController.getEmployeeById
);
router.post(
    "/", 
    validate(registerEmployeeSchema), 
    employeeController.registerEmployee
);

router.patch(
    "/:employeeId",
    validate(employeeIdParamSchema),
    validate(updateEmployeeSchema), 
    employeeController.updateEmployee
);

router.post(
    "/:employeeId/activate",
    validate(employeeIdParamSchema),
    employeeController.activateEmployee
);

router.post(
    "/:employeeId/deactivate",
    validate(employeeIdParamSchema),
    employeeController.deactivateEmployee
);

router.delete(
    "/:employeeId",
    validate(employeeIdParamSchema),
    employeeController.deleteEmployee
);

export default router;
