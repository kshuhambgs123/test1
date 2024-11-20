import express from 'express';
import userRoutes from './user';
import logsRoutes from './logs';
import adminRoutes from './admin';
import apiKeyRoutes from './apikey';
import serviceRoutes from './service';

const app = express.Router();

app.use("/user", userRoutes);
app.use("/logs", logsRoutes);
app.use("/admin", adminRoutes);
app.use("/v1",apiKeyRoutes);
app.use("/service",serviceRoutes)

export default app;
