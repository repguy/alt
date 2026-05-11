import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import workspacesRouter from "./workspaces";
import auditsRouter from "./audits";
import leadsRouter from "./leads";
import proposalsRouter from "./proposals";
import clientsRouter from "./clients";
import campaignsRouter from "./campaigns";
import analyticsRouter from "./analytics";
import whitelabelRouter from "./whitelabel";
import blogRouter from "./blog";
import billingRouter from "./billing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(workspacesRouter);
router.use(auditsRouter);
router.use(leadsRouter);
router.use(proposalsRouter);
router.use(clientsRouter);
router.use(campaignsRouter);
router.use(analyticsRouter);
router.use(whitelabelRouter);
router.use(blogRouter);
router.use(billingRouter);

export default router;
