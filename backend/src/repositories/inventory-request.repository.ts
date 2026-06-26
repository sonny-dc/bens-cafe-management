import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withConnection } from '../config/database.js';

export async function getAllInventoryRequests(): Promise<any[]> {
    return withConnection(async (connection) => {
        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT 
                r.request_id as id,
                i.item_name as item,
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
        return rows as any[];
    });
}

export async function updateInventoryRequestStatus(requestId: number, status: string): Promise<boolean> {
    return withConnection(async (connection) => {
        const [result] = await connection.execute<ResultSetHeader>(
            `UPDATE inventory_requests 
             SET request_status = ?, status_updated_at = NOW() 
             WHERE request_id = ?`,
            [status, requestId]
        );
        return result.affectedRows > 0;
    });
}
