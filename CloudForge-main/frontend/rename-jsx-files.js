const fs = require('fs');
const path = require('path');

const jsxFiles = [
  'src/components/auth/login-page.js',
  'src/components/game/game-modal.js',
  'src/components/games/base-game-layout.js',
  'src/components/games/tic-tac-toe-page.js',
  'src/components/home/home-page.js',
  'src/contexts/auth-context.js',
  'src/contexts/realtime-context.js',
  'src/App.test.js',
  'src/index.js',
  'src/setupTests.js'
];

jsxFiles.forEach(oldPath => {
  if (fs.existsSync(oldPath)) {
    const newPath = oldPath.endsWith('.js')
      ? oldPath.replace(/\.js$/, '.jsx')
      : oldPath + 'x';
    
    // Read the file content
    const content = fs.readFileSync(oldPath, 'utf8');
    
    // Update any imports that might reference this file
    const updatedContent = content.replace(/\.js(['"])/g, '.jsx$1');
    
    // Write the updated content to the new file
    fs.writeFileSync(newPath, updatedContent);
    
    // Remove the old file
    fs.unlinkSync(oldPath);
    
    console.log(`Renamed ${oldPath} to ${newPath}`);
  }
});

console.log('File renaming complete!');
