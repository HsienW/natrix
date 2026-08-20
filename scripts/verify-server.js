const {spawn} = require('child_process');
const http = require('http');
const path = require('path');

const MILLISECONDS_PER_SECOND = 1000;
const DEFAULT_READINESS_TIMEOUT_MILLISECONDS = 90 * MILLISECONDS_PER_SECOND;
const REQUEST_TIMEOUT_MILLISECONDS = 2 * MILLISECONDS_PER_SECOND;
const SERVER_RETRY_DELAY_MILLISECONDS = 250;
const SHUTDOWN_TIMEOUT_MILLISECONDS = 2 * MILLISECONDS_PER_SECOND;
const SHUTDOWN_CHECK_DELAY_MILLISECONDS = 50;

const projectDirectory = path.resolve(__dirname, '..');
const mode = process.argv[2];
const configuredReadinessTimeoutMilliseconds = process.env.SERVER_READY_TIMEOUT_MS;
const readinessTimeoutMilliseconds = configuredReadinessTimeoutMilliseconds === undefined
    ? DEFAULT_READINESS_TIMEOUT_MILLISECONDS
    : Number(configuredReadinessTimeoutMilliseconds);

if (!Number.isInteger(readinessTimeoutMilliseconds) || readinessTimeoutMilliseconds <= 0) {
    console.error('SERVER_READY_TIMEOUT_MS must be a positive integer.');
    process.exit(1);
}

const serverConfigurations = {
    development: {
        commandArguments: [
            'node_modules/webpack-cli/bin/cli.js',
            'serve',
            '--config',
            'webpack.config.js',
            '--mode',
            'development',
        ],
        url: 'http://127.0.0.1:8080/',
    },
    preview: {
        commandArguments: [
            'scripts/serve-dist.js',
        ],
        url: 'http://127.0.0.1:4173/',
    },
};

if (!serverConfigurations[mode]) {
    console.error('Usage: node scripts/verify-server.js <development|preview>');
    process.exit(1);
}

const serverConfiguration = serverConfigurations[mode];
const serverOutput = [];
const serverProcess = spawn(process.execPath, serverConfiguration.commandArguments, {
    cwd: projectDirectory,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
});
let serverProcessExited = false;

serverProcess.stdout.on('data', function (dataChunk) {
    serverOutput.push(dataChunk.toString());
});
serverProcess.stderr.on('data', function (dataChunk) {
    serverOutput.push(dataChunk.toString());
});
serverProcess.on('exit', function () {
    serverProcessExited = true;
});

const delay = function (milliseconds) {
    return new Promise(function (resolve) {
        setTimeout(resolve, milliseconds);
    });
};

const requestPage = function (url) {
    return new Promise(function (resolve, reject) {
        const requestHandle = http.get(url, function (response) {
            const responseChunks = [];

            response.on('data', function (dataChunk) {
                responseChunks.push(dataChunk);
            });
            response.on('end', function () {
                resolve({
                    body: Buffer.concat(responseChunks).toString('utf8'),
                    statusCode: response.statusCode,
                });
            });
        });

        requestHandle.setTimeout(REQUEST_TIMEOUT_MILLISECONDS, function () {
            requestHandle.destroy(new Error('Request timed out: ' + url));
        });
        requestHandle.on('error', reject);
    });
};

const waitForServer = async function () {
    const readinessDeadline = Date.now() + readinessTimeoutMilliseconds;

    while (Date.now() < readinessDeadline) {
        if (serverProcessExited) {
            throw new Error(mode + ' server exited before becoming ready.');
        }

        try {
            const response = await requestPage(serverConfiguration.url);
            if (response.statusCode === 200) {
                return response;
            }
        } catch (error) {
            // The server is still starting; retry until the deadline.
        }

        await delay(SERVER_RETRY_DELAY_MILLISECONDS);
    }

    throw new Error(
        mode + ' server did not become ready within '
        + readinessTimeoutMilliseconds + ' milliseconds.',
    );
};

const stopServerProcess = async function () {
    if (serverProcessExited) {
        return;
    }

    serverProcess.kill('SIGTERM');
    const shutdownDeadline = Date.now() + SHUTDOWN_TIMEOUT_MILLISECONDS;

    while (!serverProcessExited && Date.now() < shutdownDeadline) {
        await delay(SHUTDOWN_CHECK_DELAY_MILLISECONDS);
    }

    if (!serverProcessExited) {
        serverProcess.kill('SIGKILL');
    }
};

const verify = async function () {
    try {
        const rootResponse = await waitForServer();
        const scriptSources = Array.from(
            rootResponse.body.matchAll(/<script[^>]+src="([^"]+)"/g),
            function (match) {
                return match[1];
            },
        );

        if (scriptSources.length === 0) {
            throw new Error('The generated HTML does not reference a JavaScript bundle.');
        }

        const bundleUrls = scriptSources.map(function (source) {
            return new URL(source, serverConfiguration.url).href;
        });

        for (const bundleUrl of bundleUrls) {
            const bundleResponse = await requestPage(bundleUrl);
            if (bundleResponse.statusCode !== 200) {
                throw new Error(
                    'Bundle request failed with HTTP ' + bundleResponse.statusCode
                    + ': ' + bundleUrl,
                );
            }
        }

        console.log(mode + ' server verified: ' + serverConfiguration.url);
        bundleUrls.forEach(function (bundleUrl) {
            console.log('- ' + bundleUrl);
        });
    } catch (error) {
        console.error(error.message);
        if (serverOutput.length > 0) {
            console.error(serverOutput.join('').trim());
        }
        process.exitCode = 1;
    } finally {
        await stopServerProcess();
    }
};

verify();
