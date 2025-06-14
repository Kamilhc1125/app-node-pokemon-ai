const express = require('express');
const cors = require('cors');

const homeRoute = require('./routes/home');
const connectionRoute = require('./routes/connection');
const chatRoute = require('./routes/chat');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/', homeRoute);
app.use('/api', connectionRoute);
app.use('/api', chatRoute);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
