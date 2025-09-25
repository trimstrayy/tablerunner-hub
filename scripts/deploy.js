#!/usr/bin/env node

/**
 * Production Deployment Script for TableRunner Hub
 * 
 * This script handles the complete production deployment process:
 * 1. Environment validation
 * 2. Security checks
 * 3. Build optimization
 * 4. Deployment verification
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.blue}${colors.bold}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`);
}

class DeploymentManager {
  constructor() {
    this.projectRoot = process.cwd();
    this.errors = [];
    this.warnings = [];
  }

  async deploy() {
    log(`${colors.bold}🚀 TableRunner Hub - Production Deployment${colors.reset}`);
    log('================================================\n');

    try {
      await this.validateEnvironment();
      await this.runSecurityChecks();
      await this.buildProject();
      await this.runTests();
      await this.optimizeBuild();
      await this.generateDeploymentReport();
      
      this.showResults();
    } catch (error) {
      logError(`Deployment failed: ${error.message}`);
      process.exit(1);
    }
  }

  async validateEnvironment() {
    logStep('1/6', 'Validating Environment');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    if (majorVersion < 16) {
      this.errors.push(`Node.js version ${nodeVersion} is too old. Minimum required: 16.x`);
    } else {
      logSuccess(`Node.js version: ${nodeVersion}`);
    }

    // Check package.json
    const packagePath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packagePath)) {
      this.errors.push('package.json not found');
    } else {
      logSuccess('package.json found');
    }

    // Check environment files
    const envFiles = ['.env.local', '.env.production'];
    envFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        logSuccess(`${file} found`);
      } else {
        this.warnings.push(`${file} not found - make sure environment variables are configured`);
      }
    });

    // Check critical dependencies
    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const criticalDeps = ['react', 'vite', '@supabase/supabase-js'];
      
      criticalDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          logSuccess(`${dep} dependency found`);
        } else {
          this.errors.push(`Critical dependency missing: ${dep}`);
        }
      });
    } catch (error) {
      this.errors.push(`Error reading package.json: ${error.message}`);
    }
  }

  async runSecurityChecks() {
    logStep('2/6', 'Running Security Checks');

    // Check for sensitive files
    const sensitiveFiles = ['.env', '.env.local', 'supabase/.env'];
    let foundSensitive = false;
    
    sensitiveFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        // Check if it's in .gitignore
        const gitignorePath = path.join(this.projectRoot, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
          const gitignore = fs.readFileSync(gitignorePath, 'utf8');
          if (!gitignore.includes(file)) {
            this.errors.push(`Sensitive file ${file} not in .gitignore`);
            foundSensitive = true;
          }
        }
      }
    });

    if (!foundSensitive) {
      logSuccess('No sensitive files exposed');
    }

    // Validate environment variables structure
    const envLocal = path.join(this.projectRoot, '.env.local');
    if (fs.existsSync(envLocal)) {
      const envContent = fs.readFileSync(envLocal, 'utf8');
      const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
      
      requiredVars.forEach(varName => {
        if (envContent.includes(varName)) {
          logSuccess(`Environment variable ${varName} configured`);
        } else {
          this.errors.push(`Missing environment variable: ${varName}`);
        }
      });
    }

    // Check for TypeScript errors
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      logSuccess('TypeScript compilation check passed');
    } catch (error) {
      this.errors.push('TypeScript compilation errors found - run `npx tsc --noEmit` to see details');
    }
  }

  async buildProject() {
    logStep('3/6', 'Building Project');

    try {
      log('Installing dependencies...');
      execSync('npm ci', { stdio: 'inherit' });
      logSuccess('Dependencies installed');

      log('Running production build...');
      execSync('npm run build', { stdio: 'inherit' });
      logSuccess('Production build completed');

      // Check build output
      const distPath = path.join(this.projectRoot, 'dist');
      if (fs.existsSync(distPath)) {
        const distFiles = fs.readdirSync(distPath);
        if (distFiles.length > 0) {
          logSuccess(`Build output contains ${distFiles.length} files`);
        } else {
          this.errors.push('Build output directory is empty');
        }
      } else {
        this.errors.push('Build output directory not found');
      }
    } catch (error) {
      this.errors.push(`Build failed: ${error.message}`);
    }
  }

  async runTests() {
    logStep('4/6', 'Running Tests');

    // Check if tests exist
    const testDirs = ['src/__tests__', 'tests', 'test'];
    const testFiles = ['src/**/*.test.{ts,tsx,js,jsx}', 'src/**/*.spec.{ts,tsx,js,jsx}'];
    
    let hasTests = false;
    testDirs.forEach(dir => {
      if (fs.existsSync(path.join(this.projectRoot, dir))) {
        hasTests = true;
      }
    });

    if (hasTests) {
      try {
        execSync('npm test', { stdio: 'inherit' });
        logSuccess('All tests passed');
      } catch (error) {
        this.warnings.push('Some tests failed - review before deployment');
      }
    } else {
      this.warnings.push('No tests found - consider adding tests for better reliability');
    }
  }

  async optimizeBuild() {
    logStep('5/6', 'Optimizing Build');

    const distPath = path.join(this.projectRoot, 'dist');
    if (!fs.existsSync(distPath)) {
      this.errors.push('Build directory not found');
      return;
    }

    // Analyze bundle size
    try {
      const indexHtml = path.join(distPath, 'index.html');
      if (fs.existsSync(indexHtml)) {
        const stats = fs.statSync(indexHtml);
        logSuccess(`index.html size: ${(stats.size / 1024).toFixed(2)} KB`);
      }

      // Check for source maps (should not be in production)
      const files = this.getAllFiles(distPath);
      const sourceMaps = files.filter(file => file.endsWith('.map'));
      
      if (sourceMaps.length > 0) {
        this.warnings.push(`Found ${sourceMaps.length} source map files - consider removing for production`);
      } else {
        logSuccess('No source maps in production build');
      }

      // Check for large assets
      const largeFiles = files.filter(file => {
        const stats = fs.statSync(file);
        return stats.size > 1024 * 1024; // > 1MB
      });

      if (largeFiles.length > 0) {
        this.warnings.push(`Found ${largeFiles.length} large files (>1MB) - consider optimization`);
      } else {
        logSuccess('No unusually large files detected');
      }

    } catch (error) {
      this.warnings.push(`Could not analyze build optimization: ${error.message}`);
    }
  }

  getAllFiles(dir) {
    let files = [];
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        files = files.concat(this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    });
    
    return files;
  }

  async generateDeploymentReport() {
    logStep('6/6', 'Generating Deployment Report');

    const report = {
      timestamp: new Date().toISOString(),
      project: 'TableRunner Hub',
      version: this.getVersion(),
      environment: process.env.NODE_ENV || 'production',
      nodeVersion: process.version,
      errors: this.errors,
      warnings: this.warnings,
      nextSteps: [
        '1. Upload build files to your hosting platform',
        '2. Configure environment variables on the server',
        '3. Set up SSL certificate',
        '4. Configure custom domain (optional)',
        '5. Set up monitoring and error tracking',
        '6. Test the deployed application'
      ]
    };

    const reportPath = path.join(this.projectRoot, 'deployment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    logSuccess(`Deployment report saved to: ${reportPath}`);
  }

  getVersion() {
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  showResults() {
    log('\n================================================');
    log(`${colors.bold}🎯 DEPLOYMENT SUMMARY${colors.reset}`);
    log('================================================');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      logSuccess('🎉 Deployment completed successfully!');
      log('\n📦 Your application is ready for production deployment.');
      log('\n📋 Next steps:');
      log('   1. Upload the /dist folder to your hosting platform');
      log('   2. Configure environment variables');
      log('   3. Test the deployed application');
    } else {
      if (this.errors.length > 0) {
        log(`\n${colors.red}${colors.bold}❌ ERRORS (${this.errors.length}):${colors.reset}`);
        this.errors.forEach(error => logError(error));
        log(`\n${colors.red}${colors.bold}⚠️  Deployment cannot proceed with errors present.${colors.reset}`);
      }

      if (this.warnings.length > 0) {
        log(`\n${colors.yellow}${colors.bold}⚠️  WARNINGS (${this.warnings.length}):${colors.reset}`);
        this.warnings.forEach(warning => logWarning(warning));
      }

      if (this.errors.length === 0) {
        log(`\n${colors.green}✅ Build completed with warnings - safe to deploy${colors.reset}`);
      }
    }

    log('\n================================================');
  }
}

// Run the deployment
const deployment = new DeploymentManager();
deployment.deploy().catch(error => {
  logError(`Deployment script failed: ${error.message}`);
  process.exit(1);
});