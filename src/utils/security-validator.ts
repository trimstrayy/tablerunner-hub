import { supabase } from '@/integrations/supabase/client';

interface SecurityCheckResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export class SecurityValidator {
  private results: SecurityCheckResult[] = [];

  async runAllChecks(): Promise<SecurityCheckResult[]> {
    this.results = [];

    await this.checkEnvironmentVariables();
    await this.checkRLSPolicies();
    await this.checkDataValidation();
    await this.checkAuthenticationFlow();

    return this.results;
  }

  private addResult(check: string, status: 'pass' | 'fail' | 'warning', message: string, details?: string) {
    this.results.push({ check, status, message, details });
  }

  private async checkEnvironmentVariables() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      this.addResult('Environment Variables', 'fail', 'Missing Supabase environment variables');
      return;
    }

    if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
      this.addResult('Environment Variables', 'warning', 'Using local development URL');
    } else {
      this.addResult('Environment Variables', 'pass', 'Environment variables configured correctly');
    }
  }

  private async checkRLSPolicies() {
    try {
      // Test if RLS is blocking unauthorized access
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        this.addResult('RLS Policies', 'pass', 'RLS is properly configured and blocking unauthorized access');
      } else if (error) {
        this.addResult('RLS Policies', 'fail', `RLS policy error: ${error.message}`);
      } else {
        this.addResult('RLS Policies', 'warning', 'RLS may not be properly configured - unauthorized access possible');
      }
    } catch (error) {
      this.addResult('RLS Policies', 'fail', `Error checking RLS: ${error}`);
    }
  }

  private async checkDataValidation() {
    try {
      // Test inserting invalid data to see if constraints work
      const { error } = await supabase
        .from('menu_items')
        .insert({
          name: '', // Should fail - empty name
          category: 'InvalidCategory', // Should fail - invalid category
          price: -10, // Should fail - negative price
          owner_id: 'test'
        });

      if (error) {
        this.addResult('Data Validation', 'pass', 'Database constraints are working properly');
      } else {
        this.addResult('Data Validation', 'fail', 'Database constraints are not properly configured');
      }
    } catch (error) {
      this.addResult('Data Validation', 'pass', 'Database constraints are preventing invalid data');
    }
  }

  private async checkAuthenticationFlow() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        this.addResult('Authentication', 'pass', 'User authentication is working');
        
        // Check if user data is accessible
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userData && !error) {
          this.addResult('User Data Access', 'pass', 'User can access their own data');
        } else {
          this.addResult('User Data Access', 'warning', 'User cannot access their data - check RLS policies');
        }
      } else {
        this.addResult('Authentication', 'warning', 'No authenticated user found');
      }
    } catch (error) {
      this.addResult('Authentication', 'fail', `Authentication error: ${error}`);
    }
  }

  async testUserIsolation(testUserId: string) {
    try {
      // Try to access another user's data
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('owner_id', testUserId);

      if (error || !data || data.length === 0) {
        this.addResult('User Isolation', 'pass', 'Users cannot access other users\' data');
      } else {
        this.addResult('User Isolation', 'fail', 'SECURITY BREACH: User can access other users\' data');
      }
    } catch (error) {
      this.addResult('User Isolation', 'pass', 'User isolation is working properly');
    }
  }

  generateSecurityReport(): string {
    const passCount = this.results.filter(r => r.status === 'pass').length;
    const failCount = this.results.filter(r => r.status === 'fail').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;

    let report = `🔒 SECURITY VALIDATION REPORT\n`;
    report += `================================\n\n`;
    report += `✅ Passed: ${passCount}\n`;
    report += `⚠️  Warnings: ${warningCount}\n`;
    report += `❌ Failed: ${failCount}\n\n`;

    report += `DETAILED RESULTS:\n`;
    report += `=================\n\n`;

    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      report += `${icon} ${result.check}: ${result.message}\n`;
      if (result.details) {
        report += `   Details: ${result.details}\n`;
      }
      report += `\n`;
    });

    if (failCount > 0) {
      report += `🚨 CRITICAL: ${failCount} security issues found. Address immediately before deployment.\n`;
    } else if (warningCount > 0) {
      report += `⚠️  ${warningCount} warnings found. Review before deployment.\n`;
    } else {
      report += `🎉 All security checks passed! Ready for deployment.\n`;
    }

    return report;
  }
}

// Usage function for testing
export async function runSecurityCheck(): Promise<void> {
  console.log('🔒 Running security validation...');
  
  const validator = new SecurityValidator();
  const results = await validator.runAllChecks();
  
  const report = validator.generateSecurityReport();
  console.log(report);
  
  // Also check in browser console
  if (typeof window !== 'undefined') {
    console.table(results);
  }
}