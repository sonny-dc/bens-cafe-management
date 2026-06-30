import { Router } from 'express';
import { exportSalesXml } from '../controllers/xml-export.controller.js';

const router = Router();

router.get('/sales', exportSalesXml);

export default router;
