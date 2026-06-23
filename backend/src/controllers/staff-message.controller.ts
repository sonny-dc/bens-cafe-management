import type { Request, Response } from 'express';
import { staffMessageService } from '../services/index.js';

export async function createStaffMessage(req: Request, res: Response): Promise<void> {
    try {
        const { employeeId, messageType, subject, messageText } = req.body;

        if (!employeeId || !messageText) {
            res.status(400).json({ error: 'employeeId and messageText are required.' });
            return;
        }

        const staffMessage = await staffMessageService.createStaffMessage({
            employeeId: Number(employeeId),
            messageType: messageType ?? 'general',
            subject: subject ? String(subject) : null,
            messageText: String(messageText),
        });

        res.status(201).json({ data: staffMessage });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred while creating the staff message.";
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

export async function getStaffMessagesByEmployee(req: Request, res: Response): Promise<void> {
    try {
        const employeeId = Number(req.params.employeeId);
        if (!employeeId) {
            res.status(400).json({ error: 'employeeId is required.' });
            return;
        }
        const staffMessages = await staffMessageService.getStaffMessagesByEmployee(employeeId);
        res.status(200).json({ data: staffMessages });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred while fetching staff messages by employee.";
        res.status(500).json({ error: errorMessage });
    }
}

export async function markStaffMessageAsRead(req: Request, res: Response): Promise<void> {
    try {
        const staffMessageId = Number(req.params.staffMessageId);
        const success = await staffMessageService.markStaffMessageAsRead(staffMessageId);
        if (!success) {
            res.status(404).json({ error: 'Staff message not found.' });
            return;
        }
        res.status(200).json({ data: { success: true } });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred while marking the staff message as read.";
        res.status(500).json({ error: errorMessage });
    }
}

export async function updateStaffMessageStatus(req: Request, res: Response): Promise<void> {
    try {
        const staffMessageId = Number(req.params.id);
        const { status } = req.body;
        
        if (!status) {
            res.status(400).json({ error: 'status is required.' });
            return;
        }

        const success = await staffMessageService.updateStaffMessageStatus(staffMessageId, status);
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
