import express from 'express';
import userRoutes from './user';

const app = express.Router();

app.use("/user", userRoutes);

export default app;
