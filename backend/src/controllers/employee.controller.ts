import type { Request, Response, NextFunction } from "express";

import type { RegisterEmployeeInput } from "../models/index.js";

import {
    registerEmployee as registerEmployeeService,
    getEmployees as getEmployeesService,
    getEmployeeById as getEmployeeByIdService
} from "../services/employee.service.js";

/**
 * GET /api/employees
 */
export async function getEmployees(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const employees = await getEmployeesService();

        res.status(200).json({
            success: true,
            message: "Employees retrieved successfully.",
            data: employees
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/employees/:employeeId
 */
export async function getEmployeeById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const employeeId = Number(req.params.employeeId);

        const employee = await getEmployeeByIdService(employeeId);

        if (employee === null) {
            res.status(404).json({
                success: false,
                message: "Employee not found."
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Employee retrieved successfully.",
            data: employee
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/employees
 */
export async function registerEmployee(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const input = req.body as RegisterEmployeeInput;

        const employee = await registerEmployeeService(input);

        res.status(201).json({
            success: true,
            message: "Employee registered successfully.",
            data: employee
        });
    } catch (error) {
        next(error);
    }
}
