import express from 'express';
import { getAllContainers, getHealth } from '../controllers/container.controller.js';

const router = express.Router();

router.get('/', getAllContainers);
router.get('/health', getHealth);

export default router;
