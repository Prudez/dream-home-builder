import { Router } from 'express';
import { loadCatalog } from '../lib/catalog.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    res.json(await loadCatalog());
  } catch (err) {
    next(err);
  }
});

export default router;
