import express from 'express';
import userRoutes from './user';
import logsRoutes from './logs';
import adminRoutes from './admin';

const app = express.Router();

app.use("/user", userRoutes);
app.use("/logs", logsRoutes);
app.use("/admin", adminRoutes);

export default app;
