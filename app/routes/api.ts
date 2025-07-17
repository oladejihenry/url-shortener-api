import express from 'express';
import { AuthController } from '../controller/AuthController';
import { UrlController } from '../controller/UrlController';
import { authMiddleware } from '../middleware/AuthMiddleware';

const apiRouter = express.Router();

//auth routes
apiRouter.post('/register', AuthController.register);
apiRouter.post('/login', AuthController.login);
apiRouter.post('/logout', AuthController.logout);

//url routes
apiRouter.post('/shorten', authMiddleware, UrlController.createShortUrl);
apiRouter.get('/stats/:shortCode', authMiddleware, UrlController.getUrlStats);
apiRouter.get('/my-urls', authMiddleware, UrlController.getUserUrls);

export default apiRouter;
