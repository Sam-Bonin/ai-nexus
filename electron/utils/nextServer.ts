import { app, dialog } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import { exec } from 'child_process';
import path from 'path';
import http from 'http';
import net from 'net';
import fs from 'fs';

let serverProcess: ChildProcess | null = null;
let logFilePath: string;

/**
 * Initialize logging (call this first)
 */
function initLogger(): void {
  logFilePath = path.join(app.getPath('userData'), 'debug.log');

  // Clear old log on startup
  try {
    fs.writeFileSync(logFilePath, '=== AI Nexus Debug Log ===\n');
    fs.appendFileSync(logFilePath, `Started: ${new Date().toISOString()}\n`);
    fs.appendFileSync(logFilePath, `Platform: ${process.platform}\n`);
    fs.appendFileSync(logFilePath, `Electron Version: ${process.versions.electron}\n`);
    fs.appendFileSync(logFilePath, `Node Version: ${process.versions.node}\n`);
    fs.appendFileSync(logFilePath, `App Path: ${app.getAppPath()}\n`);
    fs.appendFileSync(logFilePath, `User Data: ${app.getPath('userData')}\n`);
    fs.appendFileSync(logFilePath, `Is Packaged: ${app.isPackaged}\n`);
    fs.appendFileSync(logFilePath, '================================\n\n');
  } catch (error) {
    console.error('Failed to initialize log file:', error);
  }
}

/**
 * Log to both console and file
 */
function log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO'): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;

  console.log(logMessage);

  try {
    if (logFilePath) {
      fs.appendFileSync(logFilePath, logMessage + '\n');
    }
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

/**
 * Check if a port is available
 */
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use`, 'WARN');
        resolve(false);
      } else {
        log(`Port check error: ${err.message}`, 'ERROR');
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      log(`Port ${port} is available`, 'INFO');
      resolve(true);
    });

    server.listen(port, '127.0.0.1');
  });
}

/**
 * Get the process ID running on a specific port
 */
function getProcessOnPort(port: number): Promise<string | null> {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port}`, (error, stdout, stderr) => {
      if (error || !stdout.trim()) {
        resolve(null);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

/**
 * Verify paths and log directory contents
 */
function verifyPaths(standaloneDir: string, serverPath: string): boolean {
  log('=== Path Verification ===');
  log(`Standalone directory: ${standaloneDir}`);
  log(`Server path: ${serverPath}`);

  // Check standalone directory
  if (!fs.existsSync(standaloneDir)) {
    log(`ERROR: Standalone directory does not exist: ${standaloneDir}`, 'ERROR');
    return false;
  }
  log('✓ Standalone directory exists');

  // List contents
  try {
    const contents = fs.readdirSync(standaloneDir);
    log(`Standalone directory contents: ${contents.join(', ')}`);

    // Check for critical files/directories
    const hasServerJs = contents.includes('server.js');
    const hasNodeModules = contents.includes('node_modules');
    const hasNextDir = contents.includes('.next');
    const hasPublic = contents.includes('public');

    log(`  - server.js: ${hasServerJs ? '✓' : '✗'}`);
    log(`  - node_modules: ${hasNodeModules ? '✓' : '✗'}`);
    log(`  - .next: ${hasNextDir ? '✓' : '✗'}`);
    log(`  - public: ${hasPublic ? '✓' : '✗'}`);

    if (!hasServerJs) {
      log('ERROR: server.js not found in standalone directory', 'ERROR');
      return false;
    }

    if (!hasNodeModules) {
      log('INFO: node_modules not found (expected for standalone mode - dependencies bundled in server.js)', 'INFO');
    }

  } catch (error) {
    log(`ERROR: Failed to read standalone directory: ${error}`, 'ERROR');
    return false;
  }

  // Check server.js
  if (!fs.existsSync(serverPath)) {
    log(`ERROR: Server file does not exist: ${serverPath}`, 'ERROR');
    return false;
  }
  log('✓ Server file exists');

  // Check file size
  const stats = fs.statSync(serverPath);
  log(`Server file size: ${stats.size} bytes`);

  if (stats.size === 0) {
    log('ERROR: Server file is empty', 'ERROR');
    return false;
  }

  log('=== Path Verification Complete ===');
  return true;
}

/**
 * Start the Next.js server and wait for it to be ready
 * @returns URL of the running server
 */
export async function startNextServer(): Promise<string> {
  // Initialize logger first
  initLogger();

  // Use different ports for dev vs production
  // Dev: 3000 (matches yarn dev)
  // Production: 54321 (safe port, unlikely to conflict)
  const PORT = app.isPackaged ? 54321 : 3000;

  // Use 127.0.0.1 (IPv4) instead of localhost to avoid IPv6 connection issues
  const serverUrl = app.isPackaged
    ? `http://127.0.0.1:${PORT}`  // Production: force IPv4
    : `http://localhost:${PORT}`;  // Dev: localhost is fine

  log('=== Starting Next.js Server ===');
  log(`Mode: ${app.isPackaged ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  log(`Target URL: ${serverUrl}`);

  // Development mode: assume yarn dev is already running
  if (!app.isPackaged) {
    log('Development mode: connecting to existing dev server...');

    // Try to connect to the dev server via health check
    try {
      await waitForServer(serverUrl, 10000); // 10 second timeout in dev
      log('✓ Connected to Next.js dev server');
      return serverUrl;
    } catch (error) {
      // Could not connect to dev server
      log(`ERROR: Could not connect to dev server: ${error}`, 'ERROR');

      dialog.showErrorBox(
        'Cannot Connect',
        `AI Nexus cannot connect to the development server.\n\n` +
        `This is a development build and requires additional setup. ` +
        `Please use the production version instead.`
      );
      app.quit();
      throw error;
    }
  }

  // Production mode: spawn the Next.js standalone server
  log('Production mode: spawning standalone server...');

  // Step 1: Check port availability
  const portAvailable = await isPortAvailable(PORT);
  if (!portAvailable) {
    log(`Port ${PORT} is occupied, checking if it's AI Nexus...`, 'WARN');

    // Check if the server on port 3000 is AI Nexus (maybe dev server is running)
    try {
      await checkServer(serverUrl);
      log('✓ AI Nexus server already running on port 3000, will connect to it');
      // AI Nexus is already running, just connect to it (like dev mode)
      return serverUrl;
    } catch (error) {
      // Not AI Nexus server - tell user to kill it
      log(`ERROR: Port ${PORT} is occupied by non-AI Nexus application`, 'ERROR');

      dialog.showErrorBox(
        'Cannot Start AI Nexus',
        `AI Nexus cannot start because another application is using the required port.\n\n` +
        `Please close any other applications that might be using port ${PORT} and try again.\n\n` +
        `Common apps that use this port:\n` +
        `• Web development servers\n` +
        `• Local testing tools\n` +
        `• Other AI Nexus instances`
      );
      app.quit();
      throw new Error(`Port ${PORT} is occupied by non-AI Nexus application`);
    }
  }

  // Step 2: Setup paths
  // Development: Use project's .next/standalone
  // Production: Use extraResources/standalone (official Electron API)
  const standaloneDir = app.isPackaged
    ? path.join(process.resourcesPath, 'standalone')
    : path.join(app.getAppPath(), '.next', 'standalone');

  const serverPath = path.join(standaloneDir, 'server.js');

  log(`App packaged: ${app.isPackaged}`);
  log(`Resources path: ${process.resourcesPath}`);
  log(`Standalone directory: ${standaloneDir}`);

  // Step 3: Verify paths exist
  if (!verifyPaths(standaloneDir, serverPath)) {
    log('ERROR: Path verification failed', 'ERROR');
    dialog.showErrorBox(
      'Installation Error',
      `AI Nexus may not be installed correctly.\n\n` +
      `Please try:\n` +
      `• Reinstalling the application\n` +
      `• Downloading a fresh copy\n` +
      `• Moving the app to your Applications folder`
    );
    app.quit();
    throw new Error('Path verification failed');
  }

  // Step 4: Setup environment
  const env = {
    ...process.env,
    PATH: `${process.env.PATH}:/usr/local/bin:/opt/homebrew/bin:/usr/bin`,
    PORT: PORT.toString(),
    ENV_FILE_PATH: path.join(app.getPath('userData'), '.env.local'),
    NODE_ENV: 'production'
  };

  log('Environment variables:');
  log(`  PORT: ${env.PORT}`);
  log(`  ENV_FILE_PATH: ${env.ENV_FILE_PATH}`);
  log(`  NODE_ENV: ${env.NODE_ENV}`);
  log(`  PATH: ${env.PATH}`);

  // Step 5: Spawn the server
  log('Spawning node process...');
  log(`  Command: node ${serverPath}`);
  log(`  Working directory: ${standaloneDir}`);

  try {
    serverProcess = spawn('node', [serverPath], {
      cwd: standaloneDir,
      env,
      stdio: 'pipe'
    });

    log(`✓ Process spawned with PID: ${serverProcess.pid}`);
  } catch (spawnError) {
    log(`ERROR: Failed to spawn process: ${spawnError}`, 'ERROR');
    dialog.showErrorBox(
      'Cannot Start AI Nexus',
      `AI Nexus failed to start.\n\n` +
      `Please try restarting the application. If the problem continues, ` +
      `try restarting your computer or reinstalling AI Nexus.`
    );
    app.quit();
    throw spawnError;
  }

  // Step 6: Handle server output
  serverProcess.stdout?.on('data', (data) => {
    const output = data.toString().trim();
    log(`[Next.js stdout] ${output}`);
  });

  serverProcess.stderr?.on('data', (data) => {
    const output = data.toString().trim();
    log(`[Next.js stderr] ${output}`, 'WARN');
  });

  serverProcess.on('error', (error) => {
    log(`[Process Error] ${error.message}`, 'ERROR');
    dialog.showErrorBox(
      'Cannot Start AI Nexus',
      `AI Nexus encountered an error while starting.\n\n` +
      `Please try restarting the application. If the problem continues, ` +
      `try restarting your computer or reinstalling AI Nexus.`
    );
    app.quit();
  });

  serverProcess.on('exit', (code, signal) => {
    log(`[Process Exit] Code: ${code}, Signal: ${signal}`, code !== 0 ? 'ERROR' : 'INFO');

    if (code !== 0 && code !== null) {
      dialog.showErrorBox(
        'AI Nexus Stopped',
        `AI Nexus stopped unexpectedly.\n\n` +
        `Please try restarting the application. If the problem continues, ` +
        `please contact support or check for updates.`
      );
      app.quit();
    }
  });

  // Step 7: Wait for server to be ready
  log('Waiting for server to respond...');
  try {
    await waitForServer(serverUrl, 60000); // 60 second timeout in production
    log('✓ Server is responding and ready!');
    log('=== Server Started Successfully ===');
    return serverUrl;
  } catch (error) {
    log(`ERROR: Server failed to respond within timeout: ${error}`, 'ERROR');
    stopNextServer();

    dialog.showErrorBox(
      'Startup Failed',
      `AI Nexus is taking longer than expected to start.\n\n` +
      `Please try restarting the application. If this keeps happening:\n\n` +
      `• Check that you have a stable internet connection\n` +
      `• Make sure your computer isn't low on resources\n` +
      `• Try restarting your computer`
    );
    app.quit();
    throw error;
  }
}

/**
 * Poll the server URL until it responds or timeout is reached
 * @param url - Server URL to poll
 * @param timeoutMs - Timeout in milliseconds
 */
async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const startTime = Date.now();
  const pollInterval = 500; // 500ms between polls
  let attemptCount = 0;

  log(`Starting server polling (timeout: ${timeoutMs}ms, interval: ${pollInterval}ms)`);

  while (Date.now() - startTime < timeoutMs) {
    attemptCount++;
    const elapsed = Date.now() - startTime;

    try {
      log(`Poll attempt ${attemptCount} (${elapsed}ms elapsed)...`);
      await checkServer(url);
      log(`✓ Server responded successfully on attempt ${attemptCount}`);
      return; // Server is ready
    } catch (error) {
      log(`Poll attempt ${attemptCount} failed: ${error}`);
      // Server not ready yet, wait and retry
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  log(`ERROR: Server did not respond after ${attemptCount} attempts (${timeoutMs}ms)`, 'ERROR');
  throw new Error(`Server did not respond within ${timeoutMs}ms`);
}

/**
 * Check if the server is responding and verify it's the AI Nexus Next.js server
 * @param url - Server URL to check
 */
function checkServer(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check the /api/health endpoint to verify it's our Next.js app
    const healthUrl = `${url}/api/health`;

    const request = http.get(healthUrl, (response) => {
      log(`Server check: HTTP ${response.statusCode}`);

      // Only accept 200 responses
      if (response.statusCode !== 200) {
        reject(new Error(`Health check returned ${response.statusCode}`));
        return;
      }

      // Collect response body
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          // Parse and verify the response
          const parsed = JSON.parse(data);

          if (parsed.app === 'ai-nexus' && parsed.status === 'ok') {
            log(`✓ Health check passed: AI Nexus server verified`);
            resolve();
          } else {
            log(`✗ Health check failed: Not AI Nexus server (got: ${JSON.stringify(parsed)})`, 'WARN');
            reject(new Error('Server is not AI Nexus application'));
          }
        } catch (error) {
          log(`✗ Health check failed: Invalid JSON response`, 'WARN');
          reject(new Error('Invalid health check response'));
        }
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.setTimeout(2000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Stop the Next.js server process
 */
export function stopNextServer(): void {
  log('=== Stopping Next.js Server ===');

  if (serverProcess && !serverProcess.killed) {
    log(`Sending SIGTERM to process ${serverProcess.pid}...`);
    serverProcess.kill('SIGTERM');
    serverProcess = null;
    log('✓ Server process terminated');
  } else {
    log('No server process to stop');
  }
}
