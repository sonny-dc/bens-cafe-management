import type { Request, Response, NextFunction } from 'express';
import { staffMessageService } from '../services/index.js';

export async function createStaffMessage(
    req: Request, 
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.session.user!.userId;

        const staffMessage = await staffMessageService.createStaffMessageForUser(
            userId,
            {
                messageType: req.body.messageType,
                subject: req.body.subject ?? null,
                messageText: req.body.messageText
            }
        );

        res.status(201).json({
            success: true,
            message: 'Staff message created successfully.',
            data: staffMessage
        });
    } catch (error) {
        next(error);
    }
}

export async function getAllStaffMessages(
    _req: Request, 
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const staffMessages = await staffMessageService.getAllStaffMessages();
        res.status(200).json({
            success: true,
            message: 'Staff messages retrieved successfully.',
            data: staffMessages
        });
    } catch (error) {
        next(error);
    }
}

export async function getMyStaffMessages(
    req: Request, 
    res: Response, 
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.session.user!.userId;

        const staffMessages = await staffMessageService.getMyStaffMessages(userId);

        res.status(200).json({
            success: true,
            message: 'Staff messages retrieved successfully.',
            data: staffMessages 
        });
    } catch (error) {
        next(error);
    }
}

export async function getStaffMessagesByEmployee(
    req: Request, 
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const employeeId = Number(req.params.employeeId);
    
        const staffMessages = await staffMessageService.getStaffMessagesByEmployee(employeeId);
        res.status(200).json({
            success: true,
            message: 'Staff messages retrieved successfully.',
            data: staffMessages
        });
    } catch (error) {
        next(error);
    }
}

export async function updateStaffMessageStatus(
    req: Request, 
    res: Response, 
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.session.user!.userId;

        const messageId = Number(req.params.messageId);
        const { status } = req.body;
       
        const success = await staffMessageService.updateStaffMessageStatus({messageId, status, userId});
        res.status(200).json({
            success: true,
            message: 'Staff message status updated successfully.',
            data: { success: success }
        });
    } catch (error) {
        next(error);
    }
}
