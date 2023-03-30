# LeetTube Chrome Extension Documentation

## Description
LeetTube is a Chrome extension that enhances the LeetCode learning experience by automatically injecting relevant YouTube video solutions directly into the LeetCode Solutions tab.

## Overview
LeetTube injects YouTube video solutions alongside code in the LeetCode Solutions tab, providing users with valuable resources without the need to search for them manually.

## Objective
The objective of LeetTube is to improve the learning experience on LeetCode by providing users with relevant video solutions directly within the Solutions tab.

## Functionality
- LeetTube has the following functionalities:
- Automatically injects YouTube video solutions into the LeetCode Solutions tab.
- Retrieves video data from a local JSON file containing problem titles and their corresponding video URLs.

Ensures a smooth and user-friendly interface that allows resizing the video and code sections.
## Architecture
- LeetTube's architecture is comprised of the following components:
- Manifest: Defines the extension's metadata, content scripts, permissions, and web-accessible resources.
- Background script: Listens for tab updates and sends a message to the content script to inject the video when the LeetCode Solutions tab is loaded.
- Content script: Injects the YouTube video iframe into the Solutions tab, handles resizing functionality, and communicates with the background script.