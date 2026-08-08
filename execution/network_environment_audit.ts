#!/usr/bin/env node

/**
 * TASK 1: Network Environment Audit
 * 
 * This script audits the current network environment to determine:
 * - Public IP
 * - Country
 * - ASN
 * - ISP / hosting provider
 * - Proxy/VPN detection
 * - IPv4/IPv6
 * - DNS resolution
 * - TLS connectivity
 * - HTTP connectivity
 */

import https from 'https';
import http from 'http';
import dns from 'dns';
import { execSync } from 'child_process';

interface NetworkEnvironment {
  timestamp: string;
  public_ip: string;
  country: string;
  asn: string;
  isp: string;
  proxy_detected: boolean;
  vpn_detected: boolean;
  ipv4: string;
  ipv6: string;
  dns_resolution: {
    data_gov_ua: string;
    status: string;
  };
  tls_connectivity: {
    data_gov_ua: string;
    status: string;
  };
  http_connectivity: {
    data_gov_ua: string;
    status: string;
  };
}

async function getPublicIP(): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org?format=json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.ip);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function getIPInfo(ip: string): Promise<{ country: string; asn: string; isp: string }> {
  return new Promise((resolve, reject) => {
    https.get(`https://ipapi.co/${ip}/json/`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            country: json.country || 'Unknown',
            asn: json.asn || 'Unknown',
            isp: json.org || 'Unknown'
          });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function detectProxy(): boolean {
  try {
    // Check for common proxy environment variables
    const proxyVars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'ALL_PROXY', 'all_proxy'];
    for (const varName of proxyVars) {
      if (process.env[varName]) {
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

function detectVPN(): boolean {
  try {
    // Check for common VPN indicators
    // This is a basic check - real VPN detection is complex
    const vpnIndicators = [
      'tun', 'tap', 'ppp', 'vpn', 'nordvpn', 'expressvpn', 'cyberghost'
    ];
    
    try {
      const ifconfig = execSync('ifconfig', { encoding: 'utf8' });
      for (const indicator of vpnIndicators) {
        if (ifconfig.toLowerCase().includes(indicator)) {
          return true;
        }
      }
    } catch (e) {
      // ifconfig might not be available
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

function getLocalIPs(): { ipv4: string; ipv6: string } {
  try {
    const interfaces = require('os').networkInterfaces();
    let ipv4 = 'N/A';
    let ipv6 = 'N/A';
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (!iface.internal) {
          if (iface.family === 'IPv4') {
            ipv4 = iface.address;
          } else if (iface.family === 'IPv6') {
            ipv6 = iface.address;
          }
        }
      }
    }
    
    return { ipv4, ipv6 };
  } catch (e) {
    return { ipv4: 'N/A', ipv6: 'N/A' };
  }
}

async function checkDNSResolution(): Promise<{ data_gov_ua: string; status: string }> {
  return new Promise((resolve) => {
    dns.resolve('data.gov.ua', (err, addresses) => {
      if (err) {
        resolve({ data_gov_ua: 'N/A', status: `FAIL: ${err.message}` });
      } else {
        resolve({ data_gov_ua: addresses.join(', '), status: 'PASS' });
      }
    });
  });
}

async function checkTLSConnectivity(): Promise<{ data_gov_ua: string; status: string }> {
  return new Promise((resolve) => {
    const req = https.request('https://data.gov.ua', {
      method: 'HEAD',
      timeout: 10000
    }, (res) => {
      resolve({ 
        data_gov_ua: res.statusCode?.toString() || 'N/A', 
        status: 'PASS' 
      });
    });
    
    req.on('error', (err) => {
      resolve({ 
        data_gov_ua: 'N/A', 
        status: `FAIL: ${err.message}` 
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ 
        data_gov_ua: 'N/A', 
        status: 'FAIL: Timeout' 
      });
    });
    
    req.end();
  });
}

async function checkHTTPConnectivity(): Promise<{ data_gov_ua: string; status: string }> {
  return new Promise((resolve) => {
    const req = http.request('http://data.gov.ua', {
      method: 'HEAD',
      timeout: 10000
    }, (res) => {
      resolve({ 
        data_gov_ua: res.statusCode?.toString() || 'N/A', 
        status: 'PASS' 
      });
    });
    
    req.on('error', (err) => {
      resolve({ 
        data_gov_ua: 'N/A', 
        status: `FAIL: ${err.message}` 
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ 
        data_gov_ua: 'N/A', 
        status: 'FAIL: Timeout' 
      });
    });
    
    req.end();
  });
}

async function main() {
  console.log('TASK 1: Network Environment Audit');
  console.log('====================================');
  
  const environment: NetworkEnvironment = {
    timestamp: new Date().toISOString(),
    public_ip: 'N/A',
    country: 'N/A',
    asn: 'N/A',
    isp: 'N/A',
    proxy_detected: false,
    vpn_detected: false,
    ipv4: 'N/A',
    ipv6: 'N/A',
    dns_resolution: { data_gov_ua: 'N/A', status: 'PENDING' },
    tls_connectivity: { data_gov_ua: 'N/A', status: 'PENDING' },
    http_connectivity: { data_gov_ua: 'N/A', status: 'PENDING' }
  };
  
  try {
    console.log('1. Getting public IP...');
    environment.public_ip = await getPublicIP();
    console.log(`   Public IP: ${environment.public_ip}`);
  } catch (e) {
    console.log(`   ERROR: ${e.message}`);
  }
  
  if (environment.public_ip !== 'N/A') {
    try {
      console.log('2. Getting IP info...');
      const ipInfo = await getIPInfo(environment.public_ip);
      environment.country = ipInfo.country;
      environment.asn = ipInfo.asn;
      environment.isp = ipInfo.isp;
      console.log(`   Country: ${environment.country}`);
      console.log(`   ASN: ${environment.asn}`);
      console.log(`   ISP: ${environment.isp}`);
    } catch (e) {
      console.log(`   ERROR: ${e.message}`);
    }
  }
  
  console.log('3. Checking for proxy...');
  environment.proxy_detected = detectProxy();
  console.log(`   Proxy detected: ${environment.proxy_detected}`);
  
  console.log('4. Checking for VPN...');
  environment.vpn_detected = detectVPN();
  console.log(`   VPN detected: ${environment.vpn_detected}`);
  
  console.log('5. Getting local IPs...');
  const localIPs = getLocalIPs();
  environment.ipv4 = localIPs.ipv4;
  environment.ipv6 = localIPs.ipv6;
  console.log(`   IPv4: ${environment.ipv4}`);
  console.log(`   IPv6: ${environment.ipv6}`);
  
  console.log('6. Checking DNS resolution...');
  environment.dns_resolution = await checkDNSResolution();
  console.log(`   data.gov.ua: ${environment.dns_resolution.data_gov_ua}`);
  console.log(`   Status: ${environment.dns_resolution.status}`);
  
  console.log('7. Checking TLS connectivity...');
  environment.tls_connectivity = await checkTLSConnectivity();
  console.log(`   data.gov.ua: ${environment.tls_connectivity.data_gov_ua}`);
  console.log(`   Status: ${environment.tls_connectivity.status}`);
  
  console.log('8. Checking HTTP connectivity...');
  environment.http_connectivity = await checkHTTPConnectivity();
  console.log(`   data.gov.ua: ${environment.http_connectivity.data_gov_ua}`);
  console.log(`   Status: ${environment.http_connectivity.status}`);
  
  console.log('\n====================================');
  console.log('Network Environment Audit Complete');
  console.log('====================================');
  
  // Save to file
  const fs = require('fs');
  const path = require('path');
  const outputDir = '/Users/dima1203/Downloads/predator8/execution';
  const outputFile = path.join(outputDir, 'network_environment.json');
  
  fs.writeFileSync(outputFile, JSON.stringify(environment, null, 2));
  console.log(`\nSaved to: ${outputFile}`);
}

main().catch(console.error);
