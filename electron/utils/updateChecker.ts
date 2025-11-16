/**
 * Update Checker Utility
 *
 * Checks GitHub Releases API for new versions of AI Nexus.
 * This is the ONE Electron-only feature that doesn't have a web equivalent,
 * as web deployments update via git pull/redeploy.
 *
 * Features:
 * - Semantic version comparison
 * - GitHub API integration (no auth required)
 * - Network error handling
 * - Zero external dependencies
 */

import https from 'https';
import { app } from 'electron';

/**
 * Information about an available update
 */
export interface UpdateInfo {
  /** New version number (e.g., "1.1.0") */
  version: string;

  /** URL to GitHub releases page for download */
  downloadUrl: string;

  /** Release notes in markdown format */
  releaseNotes: string;

  /** ISO date string when release was published */
  publishedAt: string;
}

/**
 * Check GitHub Releases for newer version
 *
 * Compares current app version against latest GitHub release.
 * Returns update info if newer version available, null otherwise.
 *
 * @returns Promise resolving to UpdateInfo or null
 * @throws Error if network request fails
 */
export async function checkForUpdates(): Promise<UpdateInfo | null> {
  const currentVersion = app.getVersion(); // From package.json

  try {
    // Fetch latest release from GitHub
    const release = await fetchLatestRelease();

    // Extract version (strip 'v' prefix if present)
    const latestVersion = release.tag_name.replace(/^v/, '');

    // Compare versions
    if (isNewer(latestVersion, currentVersion)) {
      return {
        version: latestVersion,
        downloadUrl: release.html_url,
        releaseNotes: release.body || 'No release notes available.',
        publishedAt: release.published_at
      };
    }

    // No update available
    return null;
  } catch (error) {
    console.error('Failed to check for updates:', error);
    // Silent failure - don't block app if update check fails
    return null;
  }
}

/**
 * Fetch latest release from GitHub API
 *
 * Uses GitHub REST API v3 (no authentication required for public repos)
 *
 * @returns Promise resolving to release object
 * @throws Error if request fails or returns non-200
 */
function fetchLatestRelease(): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/Sam-Bonin/ai-nexus/releases/latest',
      method: 'GET',
      headers: {
        'User-Agent': 'AI-Nexus-Electron',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const request = https.get(options, (response) => {
      let data = '';

      // Collect response data
      response.on('data', (chunk) => {
        data += chunk;
      });

      // Parse when complete
      response.on('end', () => {
        if (response.statusCode !== 200) {
          reject(new Error(`GitHub API returned ${response.statusCode}`));
          return;
        }

        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(new Error('Failed to parse GitHub API response'));
        }
      });
    });

    // Handle network errors
    request.on('error', (error) => {
      reject(error);
    });

    // Set timeout (5 seconds)
    request.setTimeout(5000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Compare semantic versions
 *
 * Determines if one version is newer than another.
 * Uses simple major.minor.patch comparison.
 *
 * @param latest - Version to check (e.g., "1.1.0")
 * @param current - Current version (e.g., "1.0.0")
 * @returns true if latest > current, false otherwise
 *
 * @example
 * isNewer('1.1.0', '1.0.0') // true
 * isNewer('1.0.1', '1.0.0') // true
 * isNewer('1.0.0', '1.0.0') // false
 * isNewer('1.0.0', '1.1.0') // false
 */
function isNewer(latest: string, current: string): boolean {
  // Split version strings into parts
  // "1.2.3" -> [1, 2, 3]
  const latestParts = latest.split('.').map(Number);
  const currentParts = current.split('.').map(Number);

  // Compare each part (major, minor, patch)
  for (let i = 0; i < 3; i++) {
    const latestPart = latestParts[i] || 0;
    const currentPart = currentParts[i] || 0;

    if (latestPart > currentPart) {
      return true; // Latest is newer
    }

    if (latestPart < currentPart) {
      return false; // Current is newer (shouldn't happen)
    }

    // Parts are equal, continue to next part
  }

  // All parts equal - not newer
  return false;
}
