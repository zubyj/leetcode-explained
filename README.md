# LeetCode Explained

LeetCode Explained is a Chrome extension that provides video explanations for LeetCode problems. This document provides a detailed explanation of the extension's components and how they interact with one another.

## Table of Contents

1. [Installation](#installation)
2. [Features](#features)
3. [Structure](#structure)
   - [Manifest](#manifest)
   - [Background](#background)
   - [Content Script](#content-script)
   - [ChatGPT Integration](#chatgpt-integration)
   - [Popup](#popup)

## Installation

1. Download the extension folder
2. Open Chrome, and navigate to `chrome://extensions`
3. Enable "Developer mode" in the top right corner
4. Click on "Load unpacked" and select the extension folder

## Features

- Injects video explanations for LeetCode problems
- Integrates with ChatGPT for generating responses

## Structure

### Manifest

`manifest.json` defines the extension's metadata, permissions, content scripts, and other settings.

### Background

`background/background.js` contains the main background script responsible for handling access tokens, login, and communication with content scripts.

### Content Script

`content-script/content_script.js` and `content-script/inject-solution-video.js` are content scripts that run in the context of a web page. They handle injecting video explanations into the LeetCode solution page.

### ChatGPT Integration

`chatgpt.js` provides functionality for interacting with the ChatGPT API.

### Popup

`popup.html` and `popup.js` define the extension's popup UI and interactions.
