const dns = require('dns');

dns.lookup('dvgnucppetrogunjqiti.supabase.co', (err, address, family) => {
    if (err) console.log('❌ Main Supabase URL failed:', err.code);
    else console.log('✅ Main Supabase URL resolved:', address);
});
