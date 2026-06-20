import type { Request, Response, NextFunction } from "express";

import type { RegisterEmployeeInput, UpdateEmployeeInput } from "../models/index.js";

import { employeeService } from "../services/index.js";

/**
 * GET /api/employees
 */
export async function getEmployees(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const employees = await employeeService.getEmployees();

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

        const employee = await employeeService.getEmployeeById(employeeId);

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
        const {username, password, fullName, employeeCode, jobRole, defaultShiftHours, hourlyRate} = req.body;
        if (!username || !password || !fullName || !employeeCode || !jobRole || !defaultShiftHours || !hourlyRate) {
            res.status(400).json({
                success: false,
                message: "All fields are required: username, password, fullName, employeeCode, jobRole, defaultShiftHours, hourlyRate."
            });
            return;
        }

        const employee = await employeeService.registerEmployee({
            username, password, fullName, employeeCode, 
            jobRole, defaultShiftHours, hourlyRate
        });

        res.status(201).json({
            success: true,
            message: "Employee registered successfully.",
            data: employee
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/employees/:employeeId
 */
export async function updateEmployee(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const employeeId: number = Number(req.params.employeeId);
        const {jobRole, defaultShiftHours, hourlyRate, employmentStatus} = req.body;
        if (!jobRole && !defaultShiftHours && !hourlyRate && !employmentStatus) {
            res.status(400).json({
                success: false,
                message: "At least one field must be provided to update: jobRole, defaultShiftHours, hourlyRate, employmentStatus."
            });
            return;
        }

        const updatedEmployee = await employeeService.updateEmployee(employeeId, {
            jobRole,
            defaultShiftHours,
            hourlyRate,
            employmentStatus
        });

        res.status(200).json({
            success: true,
            message: "Employee updated successfully.",
            data: updatedEmployee
        });
    } catch (error) {
        next(error);
    }
}

