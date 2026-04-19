import { Router, type IRouter } from "express";
import adminRouter from "./admin";
import healthRouter from "./health";
import tutorRouter from "./tutor";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tutorRouter);
router.use(adminRouter);

export default router;
