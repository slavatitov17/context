/**
 * Выполнение SQL миграции через Supabase Management API
 */

const SUPABASE_URL = 'https://jhcyshlxvnfwnpwuamcv.supabase.co';
const SERVICE_ROLE_KEY = 'sb_secret_4-8sA4yWVIzmK4nHqcmm9A_46P9d1Bs';
const fs = require('fs');
const path = require('path');

async function executeMigration() {
  try {
    const migrationPath = path.join(__dirname, '../lib/supabase/migrations/001_create_projects_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Выполнение SQL миграции через Management API...\n');

    // Supabase Management API для выполнения SQL
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

    const responseText = await response.text();
    console.log('Ответ сервера:', responseText);

    if (!response.ok) {
      // Попробуем через другой endpoint
      console.log('\n⚠️  Попытка через альтернативный метод...');
      
      // Используем прямой SQL запрос через pg_rest
      // Но Supabase не поддерживает произвольный SQL через REST API
      // Нужно использовать SQL Editor в Dashboard
      
      console.log('\n❌ Автоматическое выполнение SQL через API не поддерживается Supabase.');
      console.log('💡 Выполните SQL миграцию вручную:\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(sql);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('📋 Инструкция:');
      console.log('   1. Откройте https://supabase.com/dashboard/project/jhcyshlxvnfwnpwuamcv');
      console.log('   2. В левом меню выберите "SQL Editor"');
      console.log('   3. Создайте новый запрос (New query)');
      console.log('   4. Скопируйте SQL выше и вставьте в редактор');
      console.log('   5. Нажмите "Run" или Ctrl+Enter');
      console.log('\n✅ После выполнения миграции все будет работать автоматически!\n');
    } else {
      console.log('✅ Миграция выполнена успешно!');
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.log('\n💡 Выполните SQL миграцию вручную в Supabase Dashboard SQL Editor');
  }
}

executeMigration();

