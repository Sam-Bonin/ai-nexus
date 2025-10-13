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
 * Kill any orphaned node processes on port 3000
 */
function killOrphanedProcesses(port: number): Promise<void> {
  return new Promise((resolve) => {
    log(`Checking for orphaned processes on port ${port}...`);

    // Use lsof to find process using the port
    exec(`lsof -ti:${port}`, (error, stdout, stderr) => {
      if (error || !stdout.trim()) {
        log('No orphaned processes found');
        resolve();
        return;
      }

      const pid = stdout.trim();
      log(`Found process ${pid} on port ${port}, attempting to kill...`, 'WARN');

      exec(`kill -9 ${pid}`, (killError) => {
        if (killError) {
          log(`Failed to kill process ${pid}: ${killError.message}`, 'ERROR');
        } else {
          log(`Successfully killed orphaned process ${pid}`);
        }
        resolve();
      });
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

  const PORT = 3000;
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
    try {
      await waitForServer(serverUrl, 10000); // 10 second timeout in dev
      log('✓ Connected to Next.js dev server');
      return serverUrl;
    } catch (error) {
      log(`ERROR: Dev server not detected: ${error}`, 'ERROR');
      console.error('Next.js dev server not detected. Please run "yarn dev" in another terminal.');
      app.quit();
      throw error;
    }
  }

  // Production mode: spawn the Next.js standalone server
  log('Production mode: spawning standalone server...');

  // Step 1: Check for orphaned processes
  await killOrphanedProcesses(PORT);

  // Step 2: Check port availability
  const portAvailable = await isPortAvailable(PORT);
  if (!portAvailable) {
    log(`ERROR: Port ${PORT} is not available`, 'ERROR');
    dialog.showErrorBox(
      'Port Conflict',
      `Port ${PORT} is already in use by another application.\n\n` +
      `Please close any other applications using this port and try again.\n\n` +
      `Debug log: ${logFilePath}`
    );
    app.quit();
    throw new Error(`Port ${PORT} is not available`);
  }

  // Step 3: Setup paths
  // Handle ASAR packaging: unpacked files are in app.asar.unpacked directory
  const appPath = app.getAppPath();
  const baseDir = appPath.endsWith('.asar')
    ? path.join(path.dirname(appPath), 'app.asar.unpacked')
    : appPath;

  log(`App path: ${appPath}`);
  log(`Base directory for unpacked files: ${baseDir}`);

  const standaloneDir = path.join(baseDir, '.next', 'standalone');
  const serverPath = path.join(standaloneDir, 'server.js');

  // Step 4: Verify paths exist
  if (!verifyPaths(standaloneDir, serverPath)) {
    log('ERROR: Path verification failed', 'ERROR');
    dialog.showErrorBox(
      'Configuration Error',
      `The application files are not correctly configured.\n\n` +
      `Please rebuild the application.\n\n` +
      `Debug log: ${logFilePath}`
    );
    app.quit();
    throw new Error('Path verification failed');
  }

  // Step 5: Setup environment
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

  // Step 6: Spawn the server
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
      'Server Error',
      `Failed to start the application server.\n\n` +
      `Error: ${spawnError}\n\n` +
      `Debug log: ${logFilePath}`
    );
    app.quit();
    throw spawnError;
  }

  // Step 7: Handle server output
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
      'Server Error',
      `Failed to start the application server.\n\n` +
      `Error: ${error.message}\n\n` +
      `Debug log: ${logFilePath}`
    );
    app.quit();
  });

  serverProcess.on('exit', (code, signal) => {
    log(`[Process Exit] Code: ${code}, Signal: ${signal}`, code !== 0 ? 'ERROR' : 'INFO');

    if (code !== 0 && code !== null) {
      dialog.showErrorBox(
        'Server Crashed',
        `The application server stopped unexpectedly.\n\n` +
        `Exit code: ${code}\n\n` +
        `Debug log: ${logFilePath}`
      );
      app.quit();
    }
  });

  // Step 8: Wait for server to be ready
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
      'Startup Timeout',
      `The application server failed to start within 60 seconds.\n\n` +
      `This may indicate a problem with the server configuration.\n\n` +
      `Debug log: ${logFilePath}`
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
 * Check if the server is responding (any HTTP response means it's ready)
 * @param url - Server URL to check
 */
function checkServer(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      // Any response (even 404) means server is running
      log(`Server check: HTTP ${response.statusCode}`);
      resolve();
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
