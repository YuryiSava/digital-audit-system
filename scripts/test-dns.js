const dns = require('dns');

console.log('Testing DNS...');
dns.lookup('google.com', (err, address, family) => {
    if (err) console.log('❌ Google DNS failed:', err.code);
    else console.log('✅ Google resolved:', address);
});

dns.lookup('db.dvgnucppetrogunjqiti.supabase.co', (err, address, family) => {
    if (err) console.log('❌ Supabase DB DNS failed:', err.code);
    else console.log('✅ Supabase DB resolved:', address);
});
