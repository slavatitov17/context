# Context

Система для анализа файлов и создания диаграмм. Context позволяет загружать документы, получать ответы на вопросы по их содержимому и автоматически создавать диаграммы с помощью Mermaid.

## Возможности

- **Управление проектами**: Создание и управление проектами с загрузкой файлов
- **Анализ документов**: Получение ответов на вопросы по загруженным документам
- **Создание диаграмм**: Автоматическое создание диаграмм на основе документов или с нуля

## Технологии

- **Next.js 16** - React фреймворк
- **TypeScript** - типизированный JavaScript
- **Tailwind CSS 4** - утилитарный CSS фреймворк
- **Firebase** - Backend-as-a-Service (аутентификация и база данных)

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/ваш-username/context.git
cd context
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env.local` в корне проекта (см. раздел "Переменные окружения")

4. Запустите сервер разработки:
```bash
npm run dev
```

5. Откройте [http://localhost:3000](http://localhost:3000) в браузере

## Переменные окружения

Создайте файл `.env.local` в корне проекта:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

Получите эти значения в [Firebase Console](https://console.firebase.google.com): Project Settings > Your apps > Web app

## Структура проекта

```
app/
  ├── about/          # Страница "О системе"
  ├── components/     # Компоненты (LayoutWrapper и др.)
  ├── diagrams/       # Страницы работы с диаграммами
  ├── login/          # Страница входа
  ├── register/       # Страница регистрации
  ├── privacy/        # Политика конфиденциальности
  ├── profile/        # Профиль пользователя
  ├── projects/       # Страницы работы с проектами
  └── settings/       # Настройки приложения
lib/
  └── firebase/       # Конфигурация Firebase клиента
```

## Скрипты

- `npm run dev` - запуск сервера разработки
- `npm run build` - сборка проекта для продакшена
- `npm run start` - запуск продакшен сервера
- `npm run lint` - проверка кода линтером

## Основные страницы

- `/login` - Вход в систему
- `/register` - Регистрация нового пользователя
- `/projects` - Список проектов
- `/projects/new` - Создание нового проекта
- `/projects/[id]` - Страница проекта с чатом
- `/diagrams` - Список диаграмм
- `/diagrams/new` - Создание новой диаграммы
- `/profile` - Профиль пользователя
- `/settings` - Настройки приложения
- `/about` - О системе
- `/privacy` - Политика конфиденциальности

## Статус разработки

Проект находится в активной разработке. Реализованы основные страницы интерфейса, интегрирована аутентификация через Firebase Auth. Планируется интеграция с Firestore для хранения данных проектов и диаграмм.

## Требования

- Node.js 18.0 или выше
- npm или yarn
- Аккаунт Firebase для настройки backend
