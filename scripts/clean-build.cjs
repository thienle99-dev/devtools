const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'dist-electron', 'pack');

function cleanBuildDir() {
  try {
    if (fs.existsSync(buildDir)) {
      console.log('Cleaning build directory...');
      fs.rmSync(buildDir, { recursive: true, force: true });
      console.log('✅ Build directory cleaned');
    } else {
      console.log('Build directory does not exist, skipping clean');
    }
  } catch (error) {
    console.error('Error cleaning build directory:', error.message);
    // Try to wait a bit and retry
    setTimeout(() => {
      try {
        if (fs.existsSync(buildDir)) {
          fs.rmSync(buildDir, { recursive: true, force: true });
          console.log('✅ Build directory cleaned on retry');
        }
      } catch (retryError) {
        console.warn('⚠️  Could not clean build directory:', retryError.message);
        console.warn('   Please manually delete:', buildDir);
        process.exit(0); // Don't fail the build
      }
    }, 1000);
  }
}

cleanBuildDir();
