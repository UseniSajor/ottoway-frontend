const fs = require('fs');
const path = require('path');

const pageMappings = {
  'ProjectsListPage': { 
    endpoint: 'projects', 
    title: 'Projects',
    apiMethod: 'api.projects.list()'
  },
  'PropertiesPage': { 
    endpoint: 'properties', 
    title: 'Properties',
    apiMethod: 'api.properties.list()'
  },
  'ContractsListPage': { 
    endpoint: 'contracts', 
    title: 'Contracts',
    apiMethod: 'api.contracts.list()'
  },
  'PermitsListPage': { 
    endpoint: 'permits', 
    title: 'Permits',
    apiMethod: 'api.permits.list()'
  },
  'EscrowListPage': { 
    endpoint: 'escrow', 
    title: 'Escrow Agreements',
    apiMethod: 'api.escrow.list()'
  },
  'CloseoutListPage': { 
    endpoint: 'closeout', 
    title: 'Closeouts',
    apiMethod: 'api.closeout.list()'
  },
  'ReadinessListPage': { 
    endpoint: 'readiness', 
    title: 'Readiness Checklists',
    apiMethod: 'api.readiness.list()'
  },
};

function addAPIHook(content, componentName, mapping) {
  // Check if already has API integration
  if (content.includes('api.') && content.includes('useEffect')) {
    return content; // Already has API integration
  }

  // Add imports if missing
  if (!content.includes("import { api }")) {
    const lastImportMatch = content.match(/^import .* from ['"].*['"];?$/gm);
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      const insertPos = content.indexOf(lastImport) + lastImport.length;
      content = content.slice(0, insertPos) + 
                "\nimport { api } from '../../lib/api';" + 
                content.slice(insertPos);
    }
  }

  // Add useState and useEffect if missing
  if (!content.includes('useState') && !content.includes('useEffect')) {
    const reactImport = content.match(/import.*from ['"]react['"]/);
    if (reactImport) {
      const insertPos = reactImport.index + reactImport[0].length;
      content = content.slice(0, insertPos) + 
                "\nimport { useState, useEffect } from 'react';" + 
                content.slice(insertPos);
    }
  }

  // Add state and loading logic
  const functionMatch = content.match(/export default function (\w+)\([^)]*\)\s*\{/);
  if (functionMatch) {
    const functionStart = functionMatch.index + functionMatch[0].length;
    
    // Check if state already exists
    if (!content.includes('const [data, setData]') && !content.includes('const [projects, setProjects]')) {
      const stateName = mapping.endpoint === 'projects' ? 'projects' : 
                       mapping.endpoint === 'properties' ? 'properties' :
                       'data';
      const setStateName = mapping.endpoint === 'projects' ? 'setProjects' :
                          mapping.endpoint === 'properties' ? 'setProperties' :
                          'setData';
      
      const stateCode = `
  const [${stateName}, ${setStateName}] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const result = await ${mapping.apiMethod};
      ${setStateName}(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load ${mapping.title.toLowerCase()}');
    } finally {
      setLoading(false);
    }
  };
`;
      
      content = content.slice(0, functionStart) + stateCode + content.slice(functionStart);
    }
  }

  // Add loading state UI
  if (!content.includes('if (loading)')) {
    const returnMatch = content.match(/return\s*\(/);
    if (returnMatch) {
      const returnPos = returnMatch.index;
      const loadingUI = `
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error}</p>
          <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
`;
      content = content.slice(0, returnPos) + loadingUI + content.slice(returnPos);
    }
  }

  return content;
}

function updatePageWithAPI(filePath, componentName) {
  const mapping = pageMappings[componentName];
  if (!mapping) return false;

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  content = addAPIHook(content, componentName, mapping);

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${componentName} with API integration`);
    return true;
  }
  
  return false;
}

function processPages() {
  const pagesDir = './src/pages';
  let updatedCount = 0;

  Object.keys(pageMappings).forEach(componentName => {
    const possiblePaths = [
      path.join(pagesDir, 'owner', `${componentName}.tsx`),
      path.join(pagesDir, 'pm', `${componentName}.tsx`),
      path.join(pagesDir, 'contractor', `${componentName}.tsx`),
      path.join(pagesDir, `${componentName}.tsx`),
    ];

    possiblePaths.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        if (updatePageWithAPI(filePath, componentName)) {
          updatedCount++;
        }
      }
    });
  });

  return updatedCount;
}

console.log('🔗 Connecting pages to API...');
console.log('');
const updatedCount = processPages();
console.log('');
console.log(`✅ Updated ${updatedCount} pages with API integration!`);
console.log('');
console.log('Next steps:');
console.log('1. Review changes: git diff');
console.log('2. Test locally: npm run dev');
console.log('3. Commit: git add . && git commit -m "Connect pages to API"');


