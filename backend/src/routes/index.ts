import { Router, RequestHandler } from 'express';
import authRoutes from "./auth";
import workspacesRoute from './workspaces'

const router = Router();
router.use('/auth', authRoutes);
router.use('/workspaces', workspacesRoute);

export default router;