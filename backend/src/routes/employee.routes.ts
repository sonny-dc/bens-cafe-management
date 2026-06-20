import { Router } from "express";

import {
    getEmployees,
    getEmployeeById,
    registerEmployee
} from "../controllers/employee.controller.js";

const router = Router();

router.get("/", getEmployees);
router.get("/:employeeId", getEmployeeById);
router.post("/", registerEmployee);

export default router;
