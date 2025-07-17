import 'dotenv/config';
import express from 'express';
import apiRouter from './routes/api';
import webRouter from './routes/web';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT;

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.use('/api', apiRouter);
app.use('/', webRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
