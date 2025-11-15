#!/bin/bash

# AI Nexus - macOS Icon Generation Script
#
# This script converts public/logo-light.png into a macOS .icns icon file
# with all required resolutions (16x16 to 1024x1024).
#
# Requirements: macOS with sips and iconutil (built-in tools)
# Usage: ./scripts/build-icon.sh

set -e  # Exit on error

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🎨 AI Nexus Icon Generator${NC}"
echo ""

# Paths
SOURCE_IMAGE="app/icon.png"
ICONSET_DIR="resources/icon.iconset"
OUTPUT_ICON="resources/icon.icns"

# Verify source image exists
if [ ! -f "$SOURCE_IMAGE" ]; then
    echo -e "${RED}❌ Error: Source image not found at $SOURCE_IMAGE${NC}"
    exit 1
fi

echo -e "📂 Source image: ${GREEN}$SOURCE_IMAGE${NC}"

# Create iconset directory
echo -e "🗂️  Creating iconset directory..."
rm -rf "$ICONSET_DIR"
mkdir -p "$ICONSET_DIR"

# Generate all required icon sizes
# Format: icon_SIZExSIZE.png and icon_SIZExSIZE@2x.png

echo -e "🔄 Generating icon resolutions..."

# 16x16
sips -z 16 16 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_16x16.png" > /dev/null 2>&1
echo -e "  ✓ 16x16"

# 32x32 (16x16@2x)
sips -z 32 32 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_16x16@2x.png" > /dev/null 2>&1
echo -e "  ✓ 32x32 (16x16@2x)"

# 32x32
sips -z 32 32 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_32x32.png" > /dev/null 2>&1
echo -e "  ✓ 32x32"

# 64x64 (32x32@2x)
sips -z 64 64 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_32x32@2x.png" > /dev/null 2>&1
echo -e "  ✓ 64x64 (32x32@2x)"

# 128x128
sips -z 128 128 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_128x128.png" > /dev/null 2>&1
echo -e "  ✓ 128x128"

# 256x256 (128x128@2x)
sips -z 256 256 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_128x128@2x.png" > /dev/null 2>&1
echo -e "  ✓ 256x256 (128x128@2x)"

# 256x256
sips -z 256 256 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_256x256.png" > /dev/null 2>&1
echo -e "  ✓ 256x256"

# 512x512 (256x256@2x)
sips -z 512 512 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_256x256@2x.png" > /dev/null 2>&1
echo -e "  ✓ 512x512 (256x256@2x)"

# 512x512
sips -z 512 512 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_512x512.png" > /dev/null 2>&1
echo -e "  ✓ 512x512"

# 1024x1024 (512x512@2x)
sips -z 1024 1024 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_512x512@2x.png" > /dev/null 2>&1
echo -e "  ✓ 1024x1024 (512x512@2x)"

# Convert iconset to .icns
echo -e "📦 Converting iconset to .icns..."
iconutil -c icns "$ICONSET_DIR" -o "$OUTPUT_ICON"

# Clean up temporary iconset directory
echo -e "🧹 Cleaning up..."
rm -rf "$ICONSET_DIR"

# Verify output
if [ -f "$OUTPUT_ICON" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_ICON" | cut -f1)
    echo ""
    echo -e "${GREEN}✅ Success!${NC}"
    echo -e "📍 Icon created: ${GREEN}$OUTPUT_ICON${NC}"
    echo -e "📊 File size: ${GREEN}$FILE_SIZE${NC}"
    echo ""
    echo -e "You can now commit this icon to the repository."
else
    echo -e "${RED}❌ Error: Failed to create icon file${NC}"
    exit 1
fi
