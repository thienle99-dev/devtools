const { execSync } = require('child_process');
try {
  console.log('Running tests...');
  const output = execSync('npx vitest run', { encoding: 'utf-8' });
  console.log(output);
} catch (error) {
  console.error('Tests failed:');
  console.error(error.stdout || error.message);
  process.exit(1);
}
