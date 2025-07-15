const server = require('./server');

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Dev server running at http://localhost:${PORT}`);
});
