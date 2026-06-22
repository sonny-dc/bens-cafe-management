import type { Request, Response } from 'express';
import { pool } from '../config/database.js';

export async function getAllItems(_req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query('SELECT * FROM inventory_items');
    
    // Map snake_case to camelCase
    const items = rows.map((row: any) => ({
      itemId: row.item_id,
      itemName: row.item_name,
      category: row.category,
      unit: row.unit,
      stockQuantity: row.stock_quantity,
      reorderAt: row.reorder_at,
      unitPrice: parseFloat(row.unit_price)
    }));

    res.status(200).json(items);
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function deleteItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM inventory_items WHERE item_id = ?', [id]);
    res.status(200).json({ success: true, message: 'Item deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getPurchasePlans(_req: Request, res: Response): Promise<void> {
  try {
    const [planRows]: any = await pool.query('SELECT * FROM purchase_plans WHERE status = ?', ['pending']);
    
    const plans = [];
    for (const planRow of planRows) {
      const [itemRows]: any = await pool.query('SELECT * FROM purchase_plan_items WHERE plan_id = ?', [planRow.plan_id]);
      
      plans.push({
        planId: planRow.plan_id,
        createdAt: planRow.created_at,
        totalCost: parseFloat(planRow.total_cost),
        status: planRow.status,
        items: itemRows.map((i: any) => ({
          itemId: i.item_id,
          itemName: i.item_name,
          quantity: i.quantity,
          unitPrice: parseFloat(i.unit_price),
          subtotal: i.quantity * parseFloat(i.unit_price)
        }))
      });
    }

    res.status(200).json(plans);
  } catch (error: any) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function createPurchasePlan(req: Request, res: Response): Promise<void> {
  try {
    const { totalCost, items } = req.body;
    
    const [result]: any = await pool.query(
      'INSERT INTO purchase_plans (total_cost, status) VALUES (?, ?)',
      [totalCost, 'pending']
    );
    const planId = result.insertId;

    for (const item of items) {
      await pool.query(
        'INSERT INTO purchase_plan_items (plan_id, item_id, item_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
        [planId, item.itemId, item.itemName, item.quantity, item.unitPrice]
      );
    }

    res.status(201).json({ success: true, planId });
  } catch (error: any) {
    console.error('Error saving plan:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function fulfillPurchasePlan(req: Request, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    await connection.beginTransaction();

    // 1. Get items to restock
    const [items]: any = await connection.query('SELECT item_id, quantity FROM purchase_plan_items WHERE plan_id = ?', [id]);

    // 2. Add quantities to inventory
    for (const item of items) {
      await connection.query('UPDATE inventory_items SET stock_quantity = stock_quantity + ? WHERE item_id = ?', [item.quantity, item.item_id]);
    }

    // 3. Mark plan as received
    await connection.query('UPDATE purchase_plans SET status = ? WHERE plan_id = ?', ['received', id]);

    await connection.commit();
    res.status(200).json({ success: true, message: 'Plan fulfilled and stock updated' });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error fulfilling plan:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
}

export async function deletePurchasePlan(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    // Delete cascading items first, though foreign key handles it if set up
    await pool.query('DELETE FROM purchase_plan_items WHERE plan_id = ?', [id]);
    await pool.query('DELETE FROM purchase_plans WHERE plan_id = ?', [id]);
    
    res.status(200).json({ success: true, message: 'Purchase plan deleted' });
  } catch (error: any) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: error.message });
  }
}
