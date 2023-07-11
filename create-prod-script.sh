#!/bin/bash

# Ensure we are in the project root
cd "$(dirname "$0")"

# Create necessary directories in build
mkdir -p prod prod/node_modules prod/src/assets/images prod/src/popup

# Copy necessary files to the build directory
cp -r dist/* prod
cp -r node_modules/eventsource-parser/ prod/node_modules/eventsource-parser 
cp -r node_modules/lodash-es/ prod/node_modules/lodash-es
cp manifest.json prod
cp src/assets prod  # copy all files under assets
cp -r src prod  # copy all files under popup

# Find and copy all .html, .css and .js files from src directory to build
find src -type f \( -iname \*.html -o -iname \*.css -o -iname \*.js \) -exec cp --parents \{\} build/ \;

# Remove all .ts files from build directory
find prod/src -type f -name "*.ts" -exec rm -f {} \;

# Zip the build directory into leetcode-explained.zip
cd prod
zip -r ../leetcode-explained.zip .
cd ..
