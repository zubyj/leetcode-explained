import { loadLeetcodeData } from './leetcode-data-loader.js';
import { injectVideo } from './leetcode-problem-detected.js';

chrome.runtime.onInstalled.addListener(loadLeetcodeData);

chrome.tabs.onUpdated.addListener(injectVideo);
