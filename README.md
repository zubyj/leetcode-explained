# LeetTube (Chrome Extension)

## Description
Enhances your LeetCode experience by automatically injecting YouTube video solutions in the LeetCode Solutions tab.

## Overview
LeetTube is a Chrome extension designed to help users learn more efficiently on LeetCode by injecting YouTube video solutions directly into the LeetCode Solutions tab. By providing relevant video solutions alongside the code, users can easily access valuable resources without the need to search for them manually.

## Design Document
### Title: LeetTube

### Objective
The primary objective of the LeetTube extension is to enhance the learning experience on LeetCode by injecting relevant YouTube video solutions directly into the LeetCode Solutions tab.

### Functionality
- Automatically inject YouTube video solutions into the LeetCode Solutions tab.
- Retrieve video data from a local JSON file containing problem titles and their corresponding video URLs.
- Ensure a smooth and user-friendly interface that allows resizing the video and code sections.

### Architecture
- **Manifest**: Define the extension's metadata, content scripts, permissions, and web-accessible resources.
- **Background script**: Listen for tab updates and send a message to the content script to inject the video when the LeetCode Solutions tab is loaded.
- **Content script**: Inject the YouTube video iframe into the Solutions tab, handle resizing functionality, and communicate with the background script.
