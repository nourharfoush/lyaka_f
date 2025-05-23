// Test for syntax errors in app.js
try {
  console.log('Testing app.js for syntax errors...');
  const fs = require('fs');
  const appJs = fs.readFileSync('app.js', 'utf8');
  
  // If we can parse the file without errors, it's syntactically valid
  const syntaxCheck = new Function(appJs);
  console.log('No syntax errors found!');
} catch (error) {
  console.error('Syntax error found:', error.message, 'at line:', error.lineNumber);
}
