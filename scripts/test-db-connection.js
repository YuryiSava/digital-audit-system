const net = require('net');

const host = 'db.dvgnucppetrogunjqiti.supabase.co';
const ports = [5432, 6543];

console.log(`🔍 Testing connectivity to ${host}...`);

ports.forEach(port => {
    const sock = new net.Socket();
    sock.setTimeout(5000);

    sock.on('connect', () => {
        console.log(`✅ Connection successful to port ${port}`);
        sock.destroy();
    });

    sock.on('timeout', () => {
        console.log(`❌ Timeout connecting to port ${port}`);
        sock.destroy();
    });

    sock.on('error', (err) => {
        console.log(`❌ Error connecting to port ${port}: ${err.message}`);
    });

    sock.connect(port, host);
});
