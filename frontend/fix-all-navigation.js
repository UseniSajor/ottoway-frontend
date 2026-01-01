const fs = require('fs');
const path = require('path');

function fixNavigationInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Add React Router imports if missing
  if (content.includes('<button') && !content.includes('useNavigate') && !content.includes('from \'react-router-dom\'')) {
    // Find the last import statement
    const lastImportMatch = content.match(/^import .* from ['"].*['"];?$/gm);
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      const insertPos = content.indexOf(lastImport) + lastImport.length;
      content = content.slice(0, insertPos) + 
                "\nimport { useNavigate } from 'react-router-dom';" + 
                content.slice(insertPos);
      modified = true;
    }
  }

  // Add navigate hook in component if missing
  if (content.includes('export default function') && 
      !content.includes('const navigate = useNavigate()') &&
      (content.includes('navigate(') || content.includes('<button'))) {
    const functionMatch = content.match(/export default function (\w+)\([^)]*\)\s*\{/);
    if (functionMatch) {
      const insertPos = functionMatch.index + functionMatch[0].length;
      content = content.slice(0, insertPos) + 
                "\n  const navigate = useNavigate();" + 
                content.slice(insertPos);
      modified = true;
    }
  }

  // Fix buttons without onClick that should navigate
  const buttonPattern = /<button([^>]*?)className="([^"]*)"([^>]*?)>(.*?)<\/button>/gs;
  content = content.replace(buttonPattern, (match, before, className, after, text) => {
    if (!match.includes('onClick') && !match.includes('disabled')) {
      const route = determineRoute(text, className);
      if (route) {
        modified = true;
        return `<button${before}onClick={() => navigate('${route}')}${after} className="${className}">${text}</button>`;
      }
    }
    return match;
  });

  // Make cards clickable if they have project/contract/etc info
  if (content.includes('bg-white') && content.includes('rounded') && 
      !content.includes('onClick') && 
      (content.includes('project') || content.includes('contract') || content.includes('permit'))) {
    // Find divs that look like cards
    content = content.replace(
      /<div className="(bg-white[^"]*rounded[^"]*)"([^>]*)>/g,
      (match, classes, rest) => {
        if (!match.includes('onClick')) {
          modified = true;
          return `<div onClick={() => navigate('/details')} className="${classes} cursor-pointer hover:shadow-lg transition"${rest}>`;
        }
        return match;
      }
    );
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  return false;
}

function determineRoute(text, className) {
  const lowerText = text.toLowerCase();
  const lowerClass = className.toLowerCase();

  const routeMap = {
    'new project': '/owner/projects/new',
    'create project': '/owner/projects/new',
    'add project': '/owner/projects/new',
    'add property': '/owner/properties/new',
    'view projects': '/owner/projects',
    'projects': '/owner/projects',
    'view contracts': '/owner/contracts',
    'contracts': '/owner/contracts',
    'view permits': '/owner/permits',
    'permits': '/owner/permits',
    'manage escrow': '/owner/escrow',
    'escrow': '/owner/escrow',
    'dashboard': '/owner/dashboard',
    'closeout': '/owner/closeout',
    'readiness': '/owner/readiness',
  };

  for (const [key, route] of Object.entries(routeMap)) {
    if (lowerText.includes(key) || lowerClass.includes(key)) {
      return route;
    }
  }

  // Default routes based on button text patterns
  if (lowerText.includes('new') || lowerText.includes('create') || lowerText.includes('add')) {
    return '/owner/projects/new';
  }

  return null;
}

function walkDir(dir) {
  let fixedCount = 0;
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory() && !filePath.includes('node_modules')) {
      fixedCount += walkDir(filePath);
    } else if (file.endsWith('.tsx') && !file.endsWith('.test.tsx')) {
      if (fixNavigationInFile(filePath)) {
        fixedCount++;
      }
    }
  });
  
  return fixedCount;
}

console.log('🔧 Fixing all navigation and buttons...');
console.log('');
const fixedCount = walkDir('./src/pages');
console.log('');
console.log(`✅ Fixed ${fixedCount} files!`);
console.log('');
console.log('Next steps:');
console.log('1. Review changes: git diff');
console.log('2. Test locally: npm run dev');
console.log('3. Commit: git add . && git commit -m "Activate all navigation"');

