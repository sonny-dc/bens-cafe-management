import { Router } from 'express';
import { noteController } from '../controllers/index.js';

const router = Router();

router.post('/', noteController.createNote);
router.get('/', noteController.getAllNotes);
router.get('/employee/:employeeId', noteController.getNotesByEmployee);
router.patch('/:noteId/read', noteController.markNoteAsRead);

export default router;
