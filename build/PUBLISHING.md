Here are the steps to publishing the extension

Run this command 

`
rm -r .git .gitignore docs build src/background src/content-script src/popup.ts src/settings.ts images/
`

The only files that should be published are

1. dist folder
2. node modules 
3. HTML/CSS/JS files in src
4. Icons for logos and buttons

Everything else should be removed
- Hidden Git files (.git and .gitignore)
- All typescript files 
- Screenshots from images folder
- package, tsconfig, webpack files?

