import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import authRouter from './routes/auth.routes.js';
import attendanceRouter from './routes/attendance.routes.js';
import overtimeRouter from './routes/overtime.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

app.use(morgan('dev'));

app.use(cors({
    origin: [process.env.CORS_ORIGIN || 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));

app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({extended: true, limit: "50mb"}));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/attendance", attendanceRouter);
app.use("/api/v1/overtime", overtimeRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.get('/api/v1/healthcheck', (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is running" });
});

app.use(errorHandler);

export default app;
