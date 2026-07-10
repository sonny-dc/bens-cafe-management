import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withConnection, withTransaction } from '../config/database.js';
import {type RequestStatus, REQUEST_STATUS } from '../config/constants.js';
import type { InventoryRequest, CreateInventoryRequestRepositoryInput, UpdateInventoryRequestInput, InventoryRequestListItem, StaffInventoryRequest } from '../models/index.js';

/**
 * For SELECT * FROM inventory_requests, we define a type that
 * represents the raw database row structure.
 */
type RawInventoryRequestRow = RowDataPacket & {
    request_id: number;
    employee_id: number;
    item_id: number;
    requested_quantity: string;
    requested_unit: string;
    reason: string;
    request_status: RequestStatus;
    posted_at: Date;
    read_at: Date | null;
    created_at: Date;
    user_id: number | null;
    updated_at: Date | null;
}

/**
 * For the inventory request join query that returns a 
 * simplified version of the request. This is used for 
 * displaying a list of inventory requests with only 
 * the necessary fields.
 */
type InventoryRequestListItemRow = RowDataPacket & {
    request_id: number;
    item_name: string;
    quantity: string;
    requested_by: string;
    reason: string;
    request_status: RequestStatus;
    posted_at: Date;
}

type StaffInventoryRequestRow = RawInventoryRequestRow & {
    item_name: string;
};

/**
 * Fetches all inventory requests for a specific employee
 * simplified as abstracted list items.
 */
const simplifiedInventoryRequestFieldsByEmployeeId = 
                `SELECT
                r.request_id,
                i.item_name,
                CONCAT(r.requested_quantity, ' ', r.requested_unit) as quantity,
                u.full_name as requested_by,
                r.reason,
                r.request_status,
                r.posted_at
                FROM inventory_requests r
                JOIN inventory_items i ON r.item_id = i.item_id
                JOIN employee_profiles e ON r.employee_id = e.employee_id
                JOIN users u ON e.user_id = u.user_id
                WHERE r.employee_id = ?
                ORDER BY r.posted_at ASC`;

/**
 * Fetches all inventory requests, simplified.
 */
const simplifiedInventoryRequestFields = 
                `SELECT
                r.request_id,
                i.item_name,
                CONCAT(r.requested_quantity, ' ', r.requested_unit) as quantity,
                u.full_name as requested_by,
                r.reason,
                r.request_status,
                r.posted_at
                FROM inventory_requests r
                JOIN inventory_items i ON r.item_id = i.item_id
                JOIN employee_profiles e ON r.employee_id = e.employee_id
                JOIN users u ON e.user_id = u.user_id
                ORDER BY r.posted_at ASC`;

/**
 * Fetches a single inventory request by its ID, simplified.
 */
const simplifiedInventoryRequestFieldsById = 
                `SELECT
                r.request_id,
                i.item_name,
                CONCAT(r.requested_quantity, ' ', r.requested_unit) as quantity,
                u.full_name as requested_by,
                r.reason,
                r.request_status,
                r.posted_at
                FROM inventory_requests r
                JOIN inventory_items i ON r.item_id = i.item_id
                JOIN employee_profiles e ON r.employee_id = e.employee_id
                JOIN users u ON e.user_id = u.user_id
                WHERE r.request_id = ?
                LIMIT 1`;

// ===========================
// MAPPERS
// ===========================

function mapInventoryRequestRow(row: RawInventoryRequestRow): InventoryRequest{
    return {
        requestId: row.request_id,
        employeeId: row.employee_id,
        itemId: row.item_id,
        requestedQuantity: row.requested_quantity,
        requestedUnit: row.requested_unit,
        reason: row.reason,
        requestStatus: row.request_status,
        postedAt: row.posted_at,
        readAt: row.read_at,
        createdAt: row.created_at,
        userId: row.user_id,
        updatedAt: row.updated_at
    };
}

function mapStaffInventoryRequestRow(
    row: StaffInventoryRequestRow
): StaffInventoryRequest {
    return {
        ...mapInventoryRequestRow(row),
        itemName: row.item_name
    };
}

function mapInventoryRequestListItemRow(row: InventoryRequestListItemRow): InventoryRequestListItem {
    return {
        requestId: row.request_id,
        itemName: row.item_name,
        quantity: row.quantity,
        requestedBy: row.requested_by,
        reason: row.reason,
        requestStatus: row.request_status,
        postedAt: row.posted_at
    };
}

// ==============================================
// REPOSITORY FUNCTIONS WITH SHARED CONNECTION
// ==============================================

export async function getInventoryRequestByIdWithConnection(
    requestId: number,
    connection: PoolConnection
): Promise<InventoryRequest | null> {
    const [rows] = await connection.query<RawInventoryRequestRow[]>(
        `
        SELECT * FROM inventory_requests
        WHERE request_id = ?
        LIMIT 1
        `
        ,
        [requestId]
    );
    
    const row = rows[0];
    if (row === undefined){
        return null;
    }

    return mapInventoryRequestRow(row);
}

export async function getInventoryRequestListItemByIdWithConnection(
    requestId: number,
    connection: PoolConnection
): Promise<InventoryRequestListItem | null> {
    const [rows] = await connection.query<InventoryRequestListItemRow[]>(
        simplifiedInventoryRequestFieldsById,
        [requestId]
    );

    const row = rows[0];
    if (row === undefined){
        return null;
    }

    return mapInventoryRequestListItemRow(row);
}

export async function getAllInventoryRequestsByEmployeeIdWithConnection(
    employeeId: number,
    connection: PoolConnection
): Promise<InventoryRequestListItem[]> {
    const [rows] = await connection.query<InventoryRequestListItemRow[]>(
        simplifiedInventoryRequestFieldsByEmployeeId,
        [employeeId]
    );
    return rows.map(mapInventoryRequestListItemRow);
}

// ==============================================
// REPOSITORY FUNCTIONS
// ==============================================

export async function getInventoryRequestById(requestId: number): Promise<InventoryRequest | null> {
    return withConnection(async (connection) => {
        return getInventoryRequestByIdWithConnection(requestId, connection);
    });
}

export async function getInventoryRequestListItemById(requestId: number): Promise<InventoryRequestListItem | null> {
    return withConnection(async (connection) => {
        return getInventoryRequestListItemByIdWithConnection(requestId, connection);
    });
}

export async function getAllInventoryRequestsByEmployeeId(employeeId: number): Promise<StaffInventoryRequest[]> {
    return withConnection(async (connection) => {
        const [rows] = await connection.query<StaffInventoryRequestRow[]>(
            `
            SELECT r.*,
                i.item_name
                FROM inventory_requests r
                JOIN inventory_items i ON r.item_id = i.item_id
                WHERE r.employee_id = ?
                AND r.posted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                ORDER BY r.posted_at DESC, r.request_id DESC
            `,
            [employeeId]
        );
        return rows.map(mapStaffInventoryRequestRow);
    });
}

/**
 * Fetches all inventory requests from the database, returning
 * an array of InventoryRequest objects. This function retrieves
 * all fields for each inventory request, including the full details.
 */
export async function getAllInventoryRequests(): Promise<InventoryRequest[]> {
    return withConnection(async (connection) => {
        const [rows] = await connection.query<RawInventoryRequestRow[]>(
            `
            SELECT * FROM inventory_requests
            ORDER BY posted_at ASC
            `
        );
        return rows.map(mapInventoryRequestRow);
    });
}

/**
 * Fetches lightweight joined data specifically structured
 * for displaying in a dashboard UI table or list view.
 */
export async function getAllInventoryRequestListItems(): Promise<InventoryRequestListItem[]> {
    return withConnection(async (connection) => {
        const [rows] = await connection.query<InventoryRequestListItemRow[]>(
            simplifiedInventoryRequestFields
        );
        return rows.map(mapInventoryRequestListItemRow);
    });
}

export async function createInventoryRequest(
    input: CreateInventoryRequestRepositoryInput
): Promise<InventoryRequest> {
    return withTransaction(async (connection) => {
        const [result] = await connection.execute<ResultSetHeader>(
            `
            INSERT INTO inventory_requests (
                employee_id, 
                item_id, 
                requested_quantity, 
                requested_unit, 
                reason, 
                request_status, 
                posted_at, 
                user_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                input.employeeId,
                input.itemId,
                input.requestedQuantity,
                input.requestedUnit,
                input.reason,
                REQUEST_STATUS.PENDING,
                input.postedAt,
                input.userId || null
            ]
        );

        const inventoryRequest = await getInventoryRequestByIdWithConnection(
            result.insertId,
            connection
        );

        if (inventoryRequest === null) {
            throw new Error('Created inventory request could not be found. Error occurred during creation.');
        }

        return inventoryRequest;
    });
}

export async function updateInventoryRequestStatus(input: UpdateInventoryRequestInput): Promise<InventoryRequest | null> {
    return withTransaction(async (connection) => {
        const [result] = await connection.execute<ResultSetHeader>(
            `UPDATE inventory_requests 
             SET request_status = ?, updated_at = NOW(), read_at = ?
             WHERE request_id = ?`,
            [input.requestStatus, input.readAt, input.requestId]
        );
        if (result.affectedRows === 0) {
            return null;
        }
        return getInventoryRequestByIdWithConnection(input.requestId, connection);
    });
}
