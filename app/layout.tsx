import type { Metadata } from "next";
import "./globals.css";
import { COLOR_PALETTES } from '@/lib/colorPalettes';

export const metadata: Metadata = {
  title: "Claude AI Clone",
  description: "A clone of Claude.ai built with Next.js and OpenRouter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent FOUC by applying theme before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Get theme settings from localStorage
                  const settings = JSON.parse(
                    localStorage.getItem('claude-theme-settings') ||
                    '{"brightness":"system","palette":"yellow"}'
                  );

                  // Resolve brightness
                  const brightness = settings.brightness === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : settings.brightness;

                  // Apply brightness class
                  document.documentElement.classList.add(brightness);

                  // Apply palette data attribute
                  document.documentElement.setAttribute('data-palette', settings.palette);

                  // Inject color CSS variables
                  const palettes = ${JSON.stringify(COLOR_PALETTES)};
                  const colors = palettes[settings.palette] || palettes.yellow;

                  // Helper to convert camelCase to kebab-case
                  const camelToKebab = (str) =>
                    str.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());

                  Object.entries(colors).forEach(([key, value]) => {
                    document.documentElement.style.setProperty('--color-' + camelToKebab(key), value);
                  });
                } catch (e) {
                  // Fallback to default yellow theme
                  console.warn('Theme initialization failed, using defaults', e);
                  document.documentElement.classList.add('light');
                  document.documentElement.setAttribute('data-palette', 'yellow');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}