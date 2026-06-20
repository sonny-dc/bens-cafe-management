import { Router } from "express";

import { employeeController } from "../controllers/index.js";

const router = Router();

router.get("/", employeeController.getEmployees);
router.get("/:employeeId", employeeController.getEmployeeById);
router.post("/", employeeController.registerEmployee);

export default router;
