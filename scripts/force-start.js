const { execSync, spawn } = require('child_process');
const os = require('os');

function killPort(port) {
    try {
        if (os.platform() === 'win32') {
            // Windows
            const output = execSync(`netstat -ano | findstr :${port}`).toString();
            const lines = output.split('\n').filter(line => line.includes('LISTENING'));

            if (lines.length > 0) {
                console.log(`🧹 Port ${port} is busy. Cleaning up...`);
                lines.forEach(line => {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    if (pid && pid !== '0') {
                        try {
                            execSync(`taskkill /F /PID ${pid} >nul 2>&1`);
                            console.log(`   - Killed process ${pid}`);
                        } catch (e) { /* ignore */ }
                    }
                });
            }
        } else {
            // Linux/Mac (lsof)
            try {
                const pid = execSync(`lsof -t -i:${port}`).toString().trim();
                if (pid) {
                    execSync(`kill -9 ${pid}`);
                    console.log(`   - Killed process ${pid}`);
                }
            } catch (e) { }
        }
    } catch (e) {
        // If netstat/lsof fails, usually means port is clear
    }
}

// 1. Kill Port 3000
killPort(3000);

// 2. Start Next.js
console.log('🚀 Starting Digital Audit System (LAN Mode) on Port 3000...');
console.log('   - Access: http://localhost:3000');
console.log('   - Network: http://<YOUR_IP>:3000');
console.log('');

const cmd = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
// Use IPv4 First to prevent hangs on networks without IPv6
const env = { ...process.env, NODE_OPTIONS: '--dns-result-order=ipv4first' };

const child = spawn(cmd, ['run', 'next:lan'], {
    stdio: 'inherit',
    shell: true,
    env: env
});

child.on('close', (code) => {
    process.exit(code);
});
