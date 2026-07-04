import type { Request, Response, NextFunction } from "express";
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

export async function getEmployeeProfiles(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const employees = await employeeService.getEmployeeProfiles();

        res.status(200).json({
            success: true,
            message: "Employee profiles retrieved successfully.",
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

        res.status(200).json({
            success: true,
            message: "Employee retrieved successfully.",
            data: employee
        });

    } catch (error) {
        next(error);
    }
}

export async function getMyEmployeeProfile(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.session.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required."
            });
            return;
        }

        const employee = await employeeService.getEmployeeProfileByUserId(userId);

        if (!employee) {
            res.status(404).json({
                success: false,
                message: "Employee profile not found."
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Employee profile retrieved successfully.",
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
        const updatedEmployee = await employeeService.updateEmployee(employeeId, req.body);
    
        res.status(200).json({
            success: true,
            message: "Employee updated successfully.",
            data: updatedEmployee
        });

    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/employees/:employeeId/activate
 */
export async function activateEmployee(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {        
        const employeeId: number = Number(req.params.employeeId);
        const activatedEmployee = await employeeService.activateEmployee(employeeId);
       
        res.status(200).json({
            success: true,
            message: "Employee activated successfully.",
            data: activatedEmployee
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/employees/:employeeId/deactivate
 */ 
export async function deactivateEmployee(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const employeeId: number = Number(req.params.employeeId);
        const deactivatedEmployee = await employeeService.deactivateEmployee(employeeId);
        
        res.status(200).json({
            success: true,
            message: "Employee deactivated successfully.",
            data: deactivatedEmployee
        });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/employees/:employeeId
 */
export async function deleteEmployee(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const employeeId: number = Number(req.params.employeeId);
        await employeeService.deleteEmployee(employeeId);
        
        res.status(200).json({
            success: true,
            message: "Employee deleted successfully."
        });
    } catch (error) {
        next(error);
    }
}
