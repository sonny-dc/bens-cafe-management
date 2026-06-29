import type { Request, Response } from 'express';
import { staffMessageService } from '../services/index.js';

export async function createStaffMessage(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.session.user?.userId;

        if (!userId) {
            res.status(403).json({ error: 'Employee access required.' });
            return;
        }

        const staffMessage = await staffMessageService.createStaffMessageForUser(
            userId,
            {
                messageType: req.body.messageType,
                subject: req.body.subject ?? null,
                messageText: req.body.messageText
            }
        );

        res.status(201).json({ data: staffMessage });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An error occurred while creating the staff message.';

        res.status(500).json({ error: errorMessage });
    }
}

export async function getAllStaffMessages(_req: Request, res: Response): Promise<void> {
    try {
        const staffMessages = await staffMessageService.getAllStaffMessages();
        res.status(200).json({ data: staffMessages });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred while fetching staff messages.";
        res.status(500).json({ error: errorMessage });
    }
}

export async function getMyStaffMessages(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.session.user?.userId;

        if (!userId) {
            res.status(403).json({ error: 'Employee access required.' });
            return;
        }

        const staffMessages = await staffMessageService.getMyStaffMessages(userId);

        res.status(200).json({ data: staffMessages });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An error occurred while fetching your staff messages.';

        res.status(500).json({ error: errorMessage });
    }
}

export async function getStaffMessagesByEmployee(req: Request, res: Response): Promise<void> {
    try {
        const employeeId = Number(req.params.employeeId);
    
        const staffMessages = await staffMessageService.getStaffMessagesByEmployee(employeeId);
        res.status(200).json({ data: staffMessages });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred while fetching staff messages by employee.";
        res.status(500).json({ error: errorMessage });
    }
}

export async function updateStaffMessageStatus(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.session.user?.userId;
        if (!userId) {
            res.status(403).json({ error: 'Admin access required.' });
            return;
        }
        const messageId = Number(req.params.messageId);
        const { status } = req.body;
       
        const success = await staffMessageService.updateStaffMessageStatus({messageId, status, userId});
        if (!success) {
            res.status(404).json({ error: 'Staff message not found.' });
            return;
        }
        res.status(200).json({ data: { success: true } });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred while updating the staff message status.";
        res.status(500).json({ error: errorMessage });
    }
}
