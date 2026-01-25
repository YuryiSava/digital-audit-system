require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSystemsTable() {
    const { data, error } = await supabase
        .from('systems')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Структура таблицы systems:');
        console.log(Object.keys(data[0]));
    } else {
        console.log('Таблица пуста');
    }
}

checkSystemsTable();
