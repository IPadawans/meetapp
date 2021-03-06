import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import MeetupController from './app/controllers/MeetupController';
import SubscriptionController from './app/controllers/SubscriptionController';
import OrganizingController from './app/controllers/OrganizingController';

import authMiddleware from './app/middlewares/auth';

const routes = Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/session', SessionController.store);

routes.use(authMiddleware);

routes.put('/users', UserController.update);

routes.get('/organizing', OrganizingController.index);

routes.post('/meetups', MeetupController.store);
routes.put('/meetups/:idMeetup', MeetupController.update);
routes.get('/meetups', MeetupController.index);
routes.delete('/meetups/:idMeetup', MeetupController.delete);

routes.post('/subscriptions', SubscriptionController.store);
routes.get('/subscriptions', SubscriptionController.index);
routes.delete('/subscriptions/:idSubscription', SubscriptionController.delete);

routes.post('/files', upload.single('file'), FileController.store);
export default routes;
