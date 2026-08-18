const {spawn} = require('child_process');
const http = require('http');
const path = require('path');

const projectDirectory = path.resolve(__dirname, '..');
const mode = process.argv[2];
const configurations = {
    development: {
        arguments: [
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
        arguments: [
            'scripts/serve-dist.js',
        ],
        url: 'http://127.0.0.1:4173/',
    },
};

if (!configurations[mode]) {
    console.error('Usage: node scripts/verify-server.js <development|preview>');
    process.exit(1);
}

const configuration = configurations[mode];
const output = [];
const child = spawn(process.execPath, configuration.arguments, {
    cwd: projectDirectory,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
});
let childExited = false;

child.stdout.on('data', (chunk) => output.push(chunk.toString()));
child.stderr.on('data', (chunk) => output.push(chunk.toString()));
child.on('exit', () => {
    childExited = true;
});

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const request = (url) => new Promise((resolve, reject) => {
    const requestHandle = http.get(url, (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve({
            body: Buffer.concat(chunks).toString('utf8'),
            statusCode: response.statusCode,
        }));
    });

    requestHandle.setTimeout(2000, () => {
        requestHandle.destroy(new Error(`Request timed out: ${url}`));
    });
    requestHandle.on('error', reject);
});

const waitForServer = async () => {
    const deadline = Date.now() + 30000;

    while (Date.now() < deadline) {
        if (childExited) {
            throw new Error(`${mode} server exited before becoming ready.`);
        }

        try {
            const response = await request(configuration.url);
            if (response.statusCode === 200) {
                return response;
            }
        } catch (error) {
            // The server is still starting; retry until the deadline.
        }

        await delay(250);
    }

    throw new Error(`${mode} server did not become ready within 30 seconds.`);
};

const stopChild = async () => {
    if (childExited) {
        return;
    }

    child.kill('SIGTERM');
    const deadline = Date.now() + 2000;
    while (!childExited && Date.now() < deadline) {
        await delay(50);
    }

    if (!childExited) {
        child.kill('SIGKILL');
    }
};

const verify = async () => {
    try {
        const rootResponse = await waitForServer();
        const scriptSources = Array.from(
            rootResponse.body.matchAll(/<script[^>]+src="([^"]+)"/g),
            (match) => match[1],
        );

        if (scriptSources.length === 0) {
            throw new Error('The generated HTML does not reference a JavaScript bundle.');
        }

        const bundleUrls = scriptSources.map((source) => new URL(source, configuration.url).href);

        for (const bundleUrl of bundleUrls) {
            const bundleResponse = await request(bundleUrl);
            if (bundleResponse.statusCode !== 200) {
                throw new Error(`Bundle request failed with HTTP ${bundleResponse.statusCode}: ${bundleUrl}`);
            }
        }

        console.log(`${mode} server verified: ${configuration.url}`);
        bundleUrls.forEach((bundleUrl) => console.log(`- ${bundleUrl}`));
    } catch (error) {
        console.error(error.message);
        if (output.length > 0) {
            console.error(output.join('').trim());
        }
        process.exitCode = 1;
    } finally {
        await stopChild();
    }
};

verify();
