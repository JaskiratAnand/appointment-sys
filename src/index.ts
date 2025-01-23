import express from "express";
import cors from "cors";

import studentRoutes from './routes/students';
import professorRoutes from './routes/professors';
import protectedRoutes from './routes/protected-routes';

const PORT = 3000;

const app = express();
app.use(express.json());
app.use(cors());

app.use('/student', studentRoutes);
app.use('/professor', professorRoutes);
app.use('/', protectedRoutes);

app.listen(3000, () => {
  console.log('Server is running on port: ', PORT);
});