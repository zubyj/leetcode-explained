# Leetcode Explained 
![Downloads](https://img.shields.io/chrome-web-store/users/cofoinjfjcpgcjiinjhcpomcjoalijbe)
![Rating](https://img.shields.io/chrome-web-store/rating/cofoinjfjcpgcjiinjhcpomcjoalijbe)
![Version](https://img.shields.io/chrome-web-store/v/cofoinjfjcpgcjiinjhcpomcjoalijbe) 
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A free, open source browser extension that adds video solutions, company tags, and GPT code analysis into each Leetcode problem

[<img src="https://user-images.githubusercontent.com/3750161/214147732-c75e96a4-48a4-4b64-b407-c2402e899a75.PNG" height="40" alt="Chrome">](https://chrome.google.com/webstore/detail/leetcode-explained/cofoinjfjcpgcjiinjhcpomcjoalijbe)
[<img src="https://user-images.githubusercontent.com/3750161/214148610-acdef778-753e-470e-8765-6cc97bca85ed.png" height="40" alt="Firefox">](https://addons.mozilla.org/en-US/firefox/addon/leetcode-explained/)
[<img src="https://user-images.githubusercontent.com/3750161/233201810-d1026855-0482-44c8-b1ec-c7247134473e.png" height="40" alt="Chrome">](https://chrome.google.com/webstore/detail/leetcode-explained/cofoinjfjcpgcjiinjhcpomcjoalijbe)
### Features

1️⃣ Adds the top 5 youtube solution videos into each problems [solutions tab](https://leetcode.com/problems/two-sum/solutions)

2️⃣ Adds the top 5 companies that ask each problem into each problems [description tab](https://leetcode.com/problems/two-sum/description)

3️⃣ Reads your code and tells you the time and space complexity

4️⃣ Generates the optimized code for the given problem


Features 3️⃣ and 4️⃣ require  login to chat.openai.com (ChatGPT) in your browser.

### ⚙️ Installation


1. ``` git clone https://github.com/zubyj/leetcode-explained.git ```
2. ``` cd leetcode-explained ```
3. ``` npm install && tsc```
4. Open Google Chrome and navigate to ```chrome://extensions``` in the search bar.
5. Enable "Developer mode" (top right corner).
6. Click on "Load unpacked" and navigate to the extension directory, then click "Select".
7. Pin the extension. You should now see the extension icon next to the address bar.

Now you can test the latest dev version and contribute new features! After you make changes, remember to run tsc to compile the TS files into javascript.
### 📚 Tutorial

For solution videos open a Leetcode problems
[Solution videos](https://leetcode.com/problems/two-sum/solutions)

 If you pin the extension in the toolbar & login into ChatGPT in your browser, you can use the following 2 GPT buttons:

- Get your code complexity using ChatGPT
- Fix bugs in your code and return the optimal solution

Please ensure your Leetcode solution is open so the extension can read your code from the page.

### Contributing

We welcome contributions! Please see the [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on how to contribute to the project.

### Screenshots

<img src="src/assets/images/screenshots/add-video.png" alt="Add Video" width="600"/>
<img src="src/assets/images/screenshots/get-company-tags.png" alt="Company Tags" width="600"/>
<img src="src/assets/images/screenshots/get-complexity.png" alt="Code Complexity" width="600"/>
<img src="src/assets/images/screenshots/fix-code.png" alt="Fix Code" width="600"/>


### Code of Conduct

We aim to foster an inclusive and respectful environment. Please read the [CODE_OF_CONDUCT.md](docs/CODE_OF_CONDUCT.md) for more information.

### License

Leetcode Explained is [MIT licensed](docs/LICENSE).

### Support

If you encounter any issues or have any questions, please open an issue on this repository.

### Privacy

This extension doesn't collect any personal data. All the code analysis and generation happens on your local machine.

If you like the extension, please leave a review in the Reviews tab. For questions or bugs, feel free to open an issue on Github.

### References

Check out these cool datasets used in Leetcode Explained

[Problem elo ratings](https://github.com/zerotrac/leetcode_problem_rating) 

[Company tags](https://github.com/hxu296/leetcode-company-wise-problems-2022)

[Problem frequency by company](https://github.com/krishnadey30/LeetCode-Questions-CompanyWise/tree/master)