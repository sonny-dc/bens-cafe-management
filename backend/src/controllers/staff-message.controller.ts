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

    } catch (error: any) {
        console.error('Error creating staff message:', error);
        res.status(400).json({ error: error.message });
    }
}

export async function getAllStaffMessages(_req: Request, res: Response): Promise<void> {
    try {
        const staffMessages = await staffMessageService.getAllStaffMessages();
        res.status(200).json({ data: staffMessages });
    } catch (error: any) {
        console.error('Error fetching staff messages:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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
    } catch (error: any) {
        console.error('Error fetching staff messages by employee:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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
    } catch (error: any) {
        console.error('Error marking staff message as read:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
