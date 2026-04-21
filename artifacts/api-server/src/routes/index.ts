import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dobbiChatRouter from "./dobbi-chat";
import receiptScanRouter from "./receipt-scan";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dobbiChatRouter);
router.use(receiptScanRouter);

export default router;
