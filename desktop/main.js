const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess = null;
let backendPort = 8000;

// Determine if we're running in development or production
const isDev = !app.isPackaged;

function getBackendPath() {
  if (isDev) {
    // Development: use the built backend from ../backend/dist
    return path.join(__dirname, '..', 'backend', 'dist', 'redactflow-backend', 'redactflow-backend.exe');
  } else {
    // Production: backend is bundled in resources
    return path.join(process.resourcesPath, 'backend', 'redactflow-backend.exe');
  }
}

function startBackend() {
  return new Promise((resolve, reject) => {
    const backendExe = getBackendPath();
    
    console.log('Starting backend from:', backendExe);
    
    if (!fs.existsSync(backendExe)) {
      reject(new Error(`Backend executable not found at: ${backendExe}`));
      return;
    }

    // Start the backend process
    backendProcess = spawn(backendExe, [], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true // Hide console window by default in packaged app
    });

    let startupTimeout = setTimeout(() => {
      reject(new Error('Backend startup timeout'));
    }, 30000); // 30 second timeout

    const handleStreamData = (data) => {
      const message = data.toString();
      console.log(`Backend output: ${message}`);

      // Check if backend has started
      if (message.includes('Uvicorn running on')) {
        clearTimeout(startupTimeout);
        
        // Try to read the port from the port file
        const portFile = path.join(path.dirname(backendExe), 'backend.port');
        if (fs.existsSync(portFile)) {
          try {
            backendPort = parseInt(fs.readFileSync(portFile, 'utf8').trim());
            console.log(`Backend started on port: ${backendPort}`);
          } catch (err) {
            console.warn('Could not read port file, using default port 8000');
          }
        }
        
        resolve();
      }
    };

    // Capture backend output from both stdout and stderr
    backendProcess.stdout.on('data', handleStreamData);
    backendProcess.stderr.on('data', handleStreamData);

    backendProcess.on('error', (error) => {
      clearTimeout(startupTimeout);
      reject(error);
    });

    backendProcess.on('exit', (code) => {
      console.log(`Backend process exited with code ${code}`);
      backendProcess = null;
    });
  });
}

function stopBackend() {
  if (backendProcess) {
    console.log('Stopping backend...');
    backendProcess.kill();
    backendProcess = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  // Load the frontend
  if (isDev) {
    // Development: load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load from built files
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  try {
    console.log('Starting RedactFlow...');
    
    // Start the backend first
    await startBackend();
    console.log('Backend started successfully');
    
    // Create the window
    createWindow();
    
    // Send backend port to renderer
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('backend-port', backendPort);
    });
    
  } catch (error) {
    console.error('Failed to start backend:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

// IPC handlers
ipcMain.handle('get-backend-port', () => {
  return backendPort;
});
