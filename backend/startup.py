"""
Startup script for the bundled RedactFlow backend.
This script is the entry point for the PyInstaller executable.
"""
import sys
import os
import logging

# Set up file logging immediately
log_file = os.path.join(os.path.dirname(sys.executable) if getattr(sys, 'frozen', False) else os.path.dirname(__file__), 'startup.log')
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, mode='w'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

logger.info("=" * 60)
logger.info("RedactFlow Backend Starting")
logger.info("=" * 60)
logger.info(f"Python version: {sys.version}")
logger.info(f"Executable: {sys.executable}")
logger.info(f"Frozen: {getattr(sys, 'frozen', False)}")

# When running as a PyInstaller bundle, we need to set up the Python path
if getattr(sys, 'frozen', False):
    # Running in a PyInstaller bundle
    bundle_dir = sys._MEIPASS
    logger.info(f"Bundle directory: {bundle_dir}")
    # Add the bundle directory to the Python path
    sys.path.insert(0, bundle_dir)
    # Set environment variable to help with resource loading
    os.environ['PYINSTALLER_BUNDLE'] = '1'
    logger.info("PyInstaller bundle detected and configured")

# Import uvicorn
logger.info("Importing uvicorn...")
try:
    import uvicorn
    logger.info("✓ uvicorn imported successfully")
except Exception as e:
    logger.error(f"✗ Failed to import uvicorn: {e}")
    import traceback
    logger.error(traceback.format_exc())
    sys.exit(1)

# Import the FastAPI app
logger.info("Importing FastAPI app...")
try:
    from app.main import app
    logger.info("✓ FastAPI app imported successfully")
except Exception as e:
    logger.error(f"✗ Failed to import app: {e}")
    import traceback
    logger.error(traceback.format_exc())
    sys.exit(1)

def main():
    """
    Main entry point for the backend server.
    """
    logger.info("Starting main() function")
    
    # Get configuration from environment variables with defaults
    host = os.environ.get('REDACTFLOW_HOST', '127.0.0.1')
    port = int(os.environ.get('REDACTFLOW_PORT', '8000'))
    
    logger.info(f"Configuration: host={host}, port={port}")
    
    # Check if port is available, if not, try the next one
    import socket
    def is_port_available(port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind((host, port))
                return True
            except OSError:
                return False
    
    # Find an available port starting from the default
    original_port = port
    max_attempts = 10
    for attempt in range(max_attempts):
        if is_port_available(port):
            logger.info(f"Port {port} is available")
            break
        logger.warning(f"Port {port} is in use, trying {port + 1}")
        port += 1
    else:
        logger.error(f"Could not find an available port after {max_attempts} attempts starting from {original_port}")
        sys.exit(1)
    
    # Write the actual port to a file so Electron can read it
    port_file = os.path.join(os.path.dirname(sys.executable), 'backend.port')
    try:
        with open(port_file, 'w') as f:
            f.write(str(port))
        logger.info(f"Backend port written to: {port_file}")
    except Exception as e:
        logger.warning(f"Could not write port file: {e}")
    
    logger.info(f"Starting uvicorn server on {host}:{port}")
    
    # Run the uvicorn server
    try:
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level="info",
        )
    except Exception as e:
        logger.error(f"Error running uvicorn: {e}")
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)

if __name__ == "__main__":
    try:
        logger.info("Calling main()")
        main()
    except Exception as e:
        logger.error(f"Unhandled exception in startup: {e}")
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)
