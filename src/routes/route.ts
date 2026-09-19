import { usuarios, criar, acharUm, mudar, deletar, webhook } from "../controllers/controller"
import { Router } from 'express';

const router = Router();

router.get("/user", usuarios);
router.get("/user/:id", acharUm);
router.post("/user", criar);
router.put("/user/:id", mudar);
router.delete("/user/:id", deletar)
router.post("/webhook", webhook)
export default router;