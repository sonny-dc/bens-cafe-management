import type { Request, Response } from "express";
import { employeeService } from "../services/index.js";

/**
 * GET /api/employees
 */
export async function getEmployees(
    _req: Request,
    res: Response
): Promise<void> {
    try {
        const employees = await employeeService.getEmployees();
        if (employees.length === 0) {
            res.status(404).json({
                success: false,
                message: "No employees found."
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Employees retrieved successfully.",
            data: employees
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving employees."
        });
    }
}

/**
 * GET /api/employees/:employeeId
 */
export async function getEmployeeById(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const employeeId = Number(req.params.employeeId);

        const employee = await employeeService.getEmployeeById(employeeId);
        if (!employee) {
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

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * POST /api/employees
 */
export async function registerEmployee(
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const employee = await employeeService.registerEmployee(req.body);
        if (!employee) {
            res.status(400).json({
                success: false,
                message: "Failed to register employee."
            });
            return;
        }
        res.status(201).json({
            success: true,
            message: "Employee registered successfully.",
            data: employee
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * PATCH /api/employees/:employeeId
 */
export async function updateEmployee(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const employeeId: number = Number(req.params.employeeId);
        const updatedEmployee = await employeeService.updateEmployee(employeeId, req.body);
        if (!updatedEmployee) {
            res.status(404).json({
                success: false,
                message: "Employee not found."
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Employee updated successfully.",
            data: updatedEmployee
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * PATCH /api/employees/:employeeId/activate
 */
export async function activateEmployee(
    req: Request,
    res: Response
): Promise<void> {
    try {        
        const employeeId: number = Number(req.params.employeeId);
        const activatedEmployee = await employeeService.activateEmployee(employeeId);
        if (!activatedEmployee) {
            res.status(404).json({
                success: false,
                message: "Employee not found."
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Employee activated successfully.",
            data: activatedEmployee
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * PATCH /api/employees/:employeeId/deactivate
 */ 
export async function deactivateEmployee(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const employeeId: number = Number(req.params.employeeId);
        const deactivatedEmployee = await employeeService.deactivateEmployee(employeeId);
        if (!deactivatedEmployee) {
            res.status(404).json({
                success: false,
                message: "Employee not found."
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Employee deactivated successfully.",
            data: deactivatedEmployee
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * DELETE /api/employees/:employeeId
 */
export async function deleteEmployee(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const employeeId: number = Number(req.params.employeeId);
        const deleteSuccess = await employeeService.deleteEmployee(employeeId);
        if (!deleteSuccess) {
            res.status(404).json({
                success: false,
                message: "Employee not found."
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Employee deleted successfully."
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}
