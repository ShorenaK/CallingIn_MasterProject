import app from './app.js';

const port = process.env.PORT || 3001;

app.listen(port, '127.0.0.1', () => {
  console.log(`CallingIn backend listening at http://127.0.0.1:${port}`);
});
