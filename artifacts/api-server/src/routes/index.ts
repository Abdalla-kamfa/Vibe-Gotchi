import { Router, type IRouter } from "express";
import healthRouter from "./health";
import vibeRouter from "./vibe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(vibeRouter);

export default router;
