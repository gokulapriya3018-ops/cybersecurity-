import { Router } from 'express';
import sqliRouter from './sqli.demo';

const router = Router();

router.use('/sqli', sqliRouter);

export default router;
