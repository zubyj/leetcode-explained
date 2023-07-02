# Publishing the extension

1. Make sure the version number is updated in manifest.json

2. Remove dev files not used in production
```
rm -r .git .gitignore docs build src/background src/content-script src/popup.ts src/settings.ts images/
```

The only files that remain should be

1. dist folder (Compiled TS files)
2. node modules (only the referenced node modules in GPT folder)
3. HTML/CSS/JS files in src directory
4. Icons for logos and buttons

Everything else should be removed
- Hidden Git files (.git and .gitignore)
- All typescript files 
- Screenshots from images folder
- package, tsconfig, webpack files

Then zip the file into leetcode-explained.zip and submit. I like to use [Keka](https://www.keka.io/en/).

