import express from 'express';
import { UrlController } from '../controller/UrlController';

const webRouter = express.Router();

webRouter.get('/s/:shortCode', UrlController.redirectUrl);

export default webRouter;
