import express from 'express';
import type { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { getAllItems, deleteItem, getPurchasePlans, createPurchasePlan, fulfillPurchasePlan, deletePurchasePlan } from '../controllers/inventory.controller.js';

const router = express.Router();

router.get('/', getAllItems);
router.delete('/:id', deleteItem);
router.get('/purchase-plan', getPurchasePlans);
router.post('/purchase-plan', createPurchasePlan);
router.post('/purchase-plan/:id/fulfill', fulfillPurchasePlan);
router.delete('/purchase-plan/:id', deletePurchasePlan);

// @route   POST /api/inventory/add
// @desc    Add a new inventory item (Receives XML)
// @access  Public
router.post('/add', async (req: Request, res: Response): Promise<void> => {
  try {
    const xmlData = req.body;
    console.log('Received XML data for Add Item:', JSON.stringify(xmlData, null, 2));

    const item = xmlData?.request;
    if (item) {
      const itemName = item.itemname?.[0];
      const category = item.category?.[0];
      const unit = item.unit?.[0];
      const stockQuantity = parseInt(item.stockquantity?.[0] || '0', 10);
      const reorderAt = parseInt(item.reorderat?.[0] || '0', 10);
      const unitPrice = parseFloat(item.unitprice?.[0] || '0');

      await pool.query(
        'INSERT INTO inventory_items (item_name, category, unit, stock_quantity, reorder_at, unit_price) VALUES (?, ?, ?, ?, ?, ?)',
        [itemName, category, unit, stockQuantity, reorderAt, unitPrice]
      );
    }

    res.set('Content-Type', 'application/xml');
    res.send(`
      <response>
        <status>success</status>
        <message>Item added successfully via XML</message>
      </response>
    `.trim());
  } catch (error: any) {
    res.set('Content-Type', 'application/xml');
    res.status(500).send(`
      <response>
        <status>error</status>
        <message>${error.message}</message>
      </response>
    `.trim());
  }
});

// @route   POST /api/inventory/restock
// @desc    Restock an item (Receives XML)
// @access  Public
router.post('/restock', async (req: Request, res: Response): Promise<void> => {
  try {
    const xmlData = req.body;
    console.log('Received XML data for Restock:', JSON.stringify(xmlData, null, 2));

    const itemIdStr = xmlData?.request?.itemid?.[0];
    const qtyStr = xmlData?.request?.quantity?.[0];

    if (itemIdStr && qtyStr) {
      const id = parseInt(itemIdStr, 10);
      const qty = parseInt(qtyStr, 10);
      
      await pool.query('UPDATE inventory_items SET stock_quantity = stock_quantity + ? WHERE item_id = ?', [qty, id]);
    }

    res.set('Content-Type', 'application/xml');
    res.send(`
      <response>
        <status>success</status>
        <message>Restock processed successfully via XML</message>
      </response>
    `.trim());
  } catch (error: any) {
    res.set('Content-Type', 'application/xml');
    res.status(500).send(`
      <response>
        <status>error</status>
        <message>${error.message}</message>
      </response>
    `.trim());
  }
});

export { router as inventoryRoutes };
