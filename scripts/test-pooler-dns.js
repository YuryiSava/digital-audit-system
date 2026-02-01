const dns = require('dns');

const poolers = [
    'aws-0-eu-central-1.pooler.supabase.com',
    'aws-0-ap-southeast-1.pooler.supabase.com',
    'aws-0-us-east-1.pooler.supabase.com',
    'aws-0-eu-west-1.pooler.supabase.com'
];

console.log('Testing Pooler DNS...');
poolers.forEach(host => {
    dns.lookup(host, (err, address, family) => {
        if (!err) console.log(`✅ ${host} -> ${address} (v${family})`);
    });
});
