import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import foreignClientsRouter from "./foreignClients";
import contractsRouter from "./contracts";
import walletRouter from "./wallet";
import mpesaRouter from "./mpesa";
import assignmentsRouter from "./assignments";
import chatRouter from "./chat";
import adminRouter from "./admin";
import withdrawalsRouter from "./withdrawals";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(foreignClientsRouter);
router.use(contractsRouter);
router.use(walletRouter);
router.use(mpesaRouter);
router.use(assignmentsRouter);
router.use(chatRouter);
router.use(adminRouter);
router.use(withdrawalsRouter);
router.use(notificationsRouter);

export default router;
