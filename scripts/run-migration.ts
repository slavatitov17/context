/**
 * Скрипт для выполнения SQL миграции в Supabase
 * Запуск: npx tsx scripts/run-migration.ts
 * 
 * Требуется Service Role Key в переменной окружения SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zuxzvxddgyoastjaylpx.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY не установлен в переменных окружения');
  console.log('Установите переменную: export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  try {
    const migrationPath = path.join(process.cwd(), 'lib/supabase/migrations/001_create_projects_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Выполнение миграции...');
    
    // Выполняем SQL через REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      // Альтернативный способ - через прямой SQL запрос
      console.log('⚠️  Попытка альтернативного способа...');
      console.log('📋 SQL миграция:');
      console.log(sql);
      console.log('\n💡 Выполните этот SQL вручную в Supabase Dashboard:');
      console.log('   1. Откройте https://supabase.com/dashboard');
      console.log('   2. Выберите ваш проект');
      console.log('   3. Перейдите в SQL Editor');
      console.log('   4. Вставьте SQL выше и выполните');
    } else {
      console.log('✅ Миграция выполнена успешно!');
    }
  } catch (error) {
    console.error('❌ Ошибка при выполнении миграции:', error);
    console.log('\n💡 Выполните SQL миграцию вручную в Supabase Dashboard');
  }
}

runMigration();

