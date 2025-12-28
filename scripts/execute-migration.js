/**
 * Скрипт для выполнения SQL миграции в Supabase
 * Использует Service Role Key для выполнения SQL
 */

const SUPABASE_URL = 'https://jhcyshlxvnfwnpwuamcv.supabase.co';
const SERVICE_ROLE_KEY = 'sb_secret_4-8sA4yWVIzmK4nHqcmm9A_46P9d1Bs';
const fs = require('fs');
const path = require('path');

async function executeMigration() {
  try {
    // Читаем SQL файл
    const migrationPath = path.join(__dirname, '../lib/supabase/migrations/001_create_projects_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Выполнение SQL миграции...');
    console.log('SQL:', sql.substring(0, 100) + '...');

    // Выполняем SQL через PostgREST API
    // Supabase использует PostgREST, но для выполнения произвольного SQL нужен другой подход
    // Используем прямой запрос к PostgreSQL через REST API
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (response.ok) {
      console.log('✅ Миграция выполнена успешно!');
      return;
    }

    // Если первый способ не сработал, пробуем через прямой SQL endpoint
    console.log('⚠️  Попытка альтернативного способа...');
    
    // Разбиваем SQL на отдельные запросы
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));

    for (const query of queries) {
      if (query.trim()) {
        try {
          const queryResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({ sql: query }),
          });

          if (queryResponse.ok) {
            console.log(`✅ Выполнено: ${query.substring(0, 50)}...`);
          } else {
            const errorText = await queryResponse.text();
            console.log(`⚠️  Ошибка при выполнении: ${query.substring(0, 50)}...`);
            console.log(`   Ответ: ${errorText}`);
          }
        } catch (err) {
          console.log(`❌ Ошибка: ${err.message}`);
        }
      }
    }

    console.log('\n💡 Если миграция не выполнилась автоматически, выполните SQL вручную:');
    console.log('   1. Откройте https://supabase.com/dashboard');
    console.log('   2. Выберите проект Context');
    console.log('   3. Перейдите в SQL Editor');
    console.log('   4. Вставьте SQL из lib/supabase/migrations/001_create_projects_table.sql');
    
  } catch (error) {
    console.error('❌ Ошибка при выполнении миграции:', error);
    console.log('\n💡 Выполните SQL миграцию вручную в Supabase Dashboard SQL Editor');
  }
}

executeMigration();

