import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withConnection } from '../config/database.js';
import type { CreateInventoryRequestInput, UpdateInventoryRequestInput, InventoryRequestListItem } from '../models/index.js';

export async function getAllInventoryRequests(): Promise<InventoryRequestListItem[]> {
    return withConnection(async (connection) => {
        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT 
                r.request_id as id,
                i.item_name as itemName,
                CONCAT(r.requested_quantity, ' ', r.requested_unit) as quantity,
                u.full_name as requestedBy,
                r.request_status as status,
                r.created_at as createdAt
             FROM inventory_requests r
             JOIN inventory_items i ON r.item_id = i.item_id
             JOIN employee_profiles e ON r.employee_id = e.employee_id
             JOIN users u ON e.user_id = u.user_id
             ORDER BY r.created_at DESC`
        );
        return rows as InventoryRequestListItem[];
    });
}

export async function createInventoryRequest(input: CreateInventoryRequestInput): Promise<number> {
    return withConnection(async (connection) => {
        const [result] = await connection.execute<ResultSetHeader>(
            `INSERT INTO inventory_requests (employee_id, item_id, requested_quantity, requested_unit, reason, request_status, posted_at, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [input.employeeId, input.itemId, input.requestedQuantity, input.requestedUnit, input.reason, input.requestStatus, input.postedAt, input.userId || null]
        );
        return result.insertId;
    });
}

export async function updateInventoryRequestStatus(input: UpdateInventoryRequestInput): Promise<boolean> {
    return withConnection(async (connection) => {
        const [result] = await connection.execute<ResultSetHeader>(
            `UPDATE inventory_requests 
             SET request_status = ?, status_updated_at = NOW(), read_at = ?
             WHERE request_id = ?`,
            [input.requestStatus, input.readAt, input.requestId]
        );
        return result.affectedRows > 0;
    });
}
