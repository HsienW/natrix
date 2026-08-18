const fs = require('fs');
const http = require('http');
const path = require('path');

const host = '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const rootDirectory = path.resolve(__dirname, '..', 'dist');
const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
};

const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url, `http://${host}:${port}`);
    const relativePath = decodeURIComponent(requestUrl.pathname) === '/'
        ? 'index.html'
        : decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');
    const filePath = path.resolve(rootDirectory, relativePath);
    const isInsideRoot = filePath === rootDirectory || filePath.startsWith(`${rootDirectory}${path.sep}`);

    if (!isInsideRoot) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (error, file) => {
        if (error) {
            response.writeHead(error.code === 'ENOENT' ? 404 : 500);
            response.end(error.code === 'ENOENT' ? 'Not Found' : 'Server Error');
            return;
        }

        response.writeHead(200, {
            'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
        });
        response.end(file);
    });
});

server.listen(port, host, () => {
    console.log(`Serving dist at http://${host}:${port}`);
});

const closeServer = () => {
    server.close(() => process.exit(0));
};

process.on('SIGINT', closeServer);
process.on('SIGTERM', closeServer);
