import express, { Router } from 'express';
import { getTasks } from './test3.js';

//const app = express();

const express = require("express");
const app = express();


const taskRouter = Router();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

taskRouter.get('/tasks', getTasks);

app.use(taskRouter);
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
