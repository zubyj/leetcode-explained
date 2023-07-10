#!/bin/bash

# Ensure we are in the project root
cd "$(dirname "$0")"

# Remove the node_modules directory
rm -rf node_modules/

# Remove dev files not used in production
rm -rf .git .gitignore docs build src/background src/content-script \
src/popup/settings src/popup/popup.ts src/popup/settings.ts images/ \
LICENSE.txt README.md 

# Remove images not used in production
rm -rf src/assets/images/screenshots src/assets/images/marquee-promo-tile.png src/assets/images/small-promo-tile.png 

# Remove package, tsconfig, webpack files
rm -rf node_modules/ package.json package-lock.json tsconfig.json webpack.config.js src/webpack.config.js dist/webpack.config.js

# Remove all .ts files from src directory
find src -type f -name "*.ts" -exec rm -f {} \;

# Only keep referenced node_modules
# You should replace `required-module-1 required-module-2` with your actual required module names
npm prune --production

# Zip the project directory into leetcode-explained.zip
zip -r leetcode-explained.zip build/

