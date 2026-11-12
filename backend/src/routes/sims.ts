import { Router } from 'express';
import sqliRouter from './sqli.demo';
import xssRouter from './xss.demo';
import chainedRouter from './chained.demo';

const router = Router();

router.use('/sqli', sqliRouter);
router.use('/xss', xssRouter);
router.use('/chained', chainedRouter);

export default router;
