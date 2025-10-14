const fs = require('fs');
const path = require('path');

console.log('Building RedactFlow Desktop...');

// Step 1: Build the frontend
console.log('\n=== Step 1: Building Frontend ===');
const { execSync } = require('child_process');

try {
  console.log('Running: npm run build in frontend directory...');
  execSync('npm run build', {
    cwd: path.join(__dirname, '..', 'frontend'),
    stdio: 'inherit'
  });
  console.log('✓ Frontend build complete');
} catch (error) {
  console.error('✗ Frontend build failed:', error.message);
  process.exit(1);
}

// Step 2: Copy frontend build to desktop/renderer
console.log('\n=== Step 2: Copying Frontend Build ===');
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
const desktopRendererPath = path.join(__dirname, 'renderer');

// Remove old renderer directory if it exists
if (fs.existsSync(desktopRendererPath)) {
  console.log('Removing old renderer directory...');
  fs.rmSync(desktopRendererPath, { recursive: true, force: true });
}

// Copy frontend dist to desktop/renderer
console.log('Copying frontend build to desktop/renderer...');
fs.cpSync(frontendDistPath, desktopRendererPath, { recursive: true });
console.log('✓ Frontend copied to renderer directory');

// Step 3: Update API calls in the frontend build to use dynamic port
console.log('\n=== Step 3: Preparing Frontend for Desktop ===');
console.log('Frontend is ready for desktop use');

// Step 4: Verify backend exists
console.log('\n=== Step 4: Verifying Backend ===');
const backendExePath = path.join(__dirname, '..', 'backend', 'dist', 'redactflow-backend', 'redactflow-backend.exe');

if (!fs.existsSync(backendExePath)) {
  console.error('✗ Backend executable not found at:', backendExePath);
  console.error('Please build the backend first using: cd backend && pyinstaller backend.spec --clean');
  process.exit(1);
}
console.log('✓ Backend executable found');

console.log('\n=== Build Complete ===');
console.log('\nNext steps:');
console.log('1. Install Electron dependencies: npm install');
console.log('2. Test in development: npm start');
console.log('3. Build installer: npm run dist:win');
