import { app } from 'electron';
import path from 'path';

/**
 * Get the path to the app icon based on the environment (dev vs production)
 * @returns Path to icon.icns or undefined if not found
 */
export function getAppIconPath(): string | undefined {
  if (app.isPackaged) {
    // Production: icon is in Resources folder of app bundle
    return path.join(process.resourcesPath, 'icon.icns');
  } else {
    // Development: icon is in resources folder at project root
    const iconPath = path.join(app.getAppPath(), 'resources', 'icon.icns');
    return iconPath;
  }
}
