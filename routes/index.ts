import express from 'express';
import userRoutes from './user';
import logsRoutes from './logs';
import adminRoutes from './admin';
import apiKeyRoutes from './apikey';

const app = express.Router();

app.use("/user", userRoutes);
app.use("/logs", logsRoutes);
app.use("/admin", adminRoutes);
app.use("/v1",apiKeyRoutes);

export default app;
