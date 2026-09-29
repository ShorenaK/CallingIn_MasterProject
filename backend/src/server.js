import app from './app.js';

const port = process.env.PORT || 3001;

app.listen(port, '127.0.0.1', (error) => {
  if (error) {
    console.error('CallingIn backend failed to start:', error.message);
    process.exitCode = 1;
    return;
  }
  console.log(`CallingIn backend listening at http://127.0.0.1:${port}`);
});
