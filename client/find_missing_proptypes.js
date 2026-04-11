/* global require, process */
const fs = require('fs');
const path = require('path');

function findFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        findFiles(fullPath, files);
      }
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

const srcDir = path.join(process.cwd(), 'src');
const allFiles = findFiles(srcDir);

const problematicFiles = [];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('PropTypes.') && !content.includes("import PropTypes from 'prop-types'")) {
    problematicFiles.push(file);
  }
}

console.log(JSON.stringify(problematicFiles, null, 2));
