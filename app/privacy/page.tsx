// Создаем страницу политики конфиденциальности с описанием правил обработки персональных данных
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/storage';

export default function PrivacyPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = () => {
      const user = auth.getCurrentUser();
      setIsAuthenticated(!!user && auth.hasSession());
      // Автоматическое подтягивание почты для авторизованного пользователя
      if (user && user.email) {
        setEmail(user.email);
      }
    };
    checkAuth();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Сообщение отправлено (заглушка)\nEmail: ${email}\nСообщение: ${message}`);
    setEmail('');
    setMessage('');
  };

  const isFormValid = email.trim() !== '' && message.trim() !== '';

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className={isAuthenticated ? 'max-w-2xl' : 'max-w-2xl mx-auto'}>
      {/* Верхний блок: заголовок, описание */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        {!isAuthenticated && (
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-200 group relative mb-6"
          >
            <i className="fas fa-arrow-left text-sm"></i>
            <span className="relative z-10">Назад</span>
            {/* Подчеркивание при наведении */}
            <span className="absolute bottom-1 left-3 right-3 h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
          </button>
        )}
        <h1 className="text-3xl font-medium mb-2">Политика конфиденциальности</h1>
        <p className="text-gray-600 text-base">
          Узнайте, как мы собираем, используем и защищаем ваши персональные данные
        </p>
      </div>

      <div className="space-y-6">
        {/* Блок 1: Общие положения */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            1. Общие положения
          </h2>
          <div className="space-y-3 text-gray-700 text-base leading-relaxed">
            <p>
              Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей сервиса Context (далее — «Сервис»). 
              Используя Сервис, вы соглашаетесь с условиями настоящей Политики конфиденциальности.
            </p>
            <p>
              Администрация Сервиса обязуется соблюдать конфиденциальность персональных данных пользователей в соответствии с действующим законодательством.
            </p>
          </div>
        </div>

        {/* Блок 2: Собираемые данные */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            2. Собираемые данные
          </h2>
          <div className="space-y-3 text-gray-700 text-base leading-relaxed">
            <p>При использовании Сервиса мы собираем следующую информацию:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Электронный адрес (email) для идентификации пользователя</li>
              <li>Информация о проектах, созданных пользователем</li>
              <li>Загруженные пользователем файлы и документы</li>
              <li>Данные о взаимодействии с Сервисом (время использования, действия пользователя)</li>
            </ul>
          </div>
        </div>

        {/* Блок 3: Цели использования данных */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            3. Цели использования данных
          </h2>
          <div className="space-y-3 text-gray-700 text-base leading-relaxed">
            <p>Собранные данные используются для следующих целей:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Предоставление доступа к функциям Сервиса</li>
              <li>Идентификация и аутентификация пользователей</li>
              <li>Обработка и анализ загруженных файлов для ответов на вопросы</li>
              <li>Создание диаграмм на основе загруженных данных</li>
              <li>Улучшение качества работы Сервиса</li>
              <li>Обеспечение безопасности и предотвращение мошенничества</li>
              <li>Информирование пользователей об изменениях в Сервисе</li>
            </ul>
          </div>
        </div>

        {/* Блок 4: Защита данных */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            4. Защита персональных данных
          </h2>
          <div className="space-y-3 text-gray-700 text-base leading-relaxed">
            <p>
              Администрация Сервиса принимает необходимые технические и организационные меры для защиты персональных данных от неправомерного доступа, 
              уничтожения, изменения, блокирования, копирования, распространения, а также от иных неправомерных действий.
            </p>
          </div>
        </div>

        {/* Блок 5: Передача данных третьим лицам */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            5. Передача данных третьим лицам
          </h2>
          <div className="space-y-3 text-gray-700 text-base leading-relaxed">
            <p>
              Администрация Сервиса не передает персональные данные третьим лицам, за исключением следующих случаев:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Пользователь дал согласие на такие действия</li>
              <li>Передача предусмотрена законодательством в рамках установленной процедуры</li>
              <li>Передача необходима для работы Сервиса или его функций (например, обработка файлов с использованием внешних сервисов)</li>
            </ul>
          </div>
        </div>

        {/* Блок 6: Права пользователей */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            6. Права пользователей
          </h2>
          <div className="space-y-3 text-gray-700 text-base leading-relaxed">
            <p>Пользователь имеет право:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Получать информацию о своих персональных данных, обрабатываемых Сервисом</li>
              <li>Требовать уточнения, блокирования или уничтожения персональных данных</li>
              <li>Удалить свой аккаунт и связанные с ним данные</li>
            </ul>
            <p>
              Для реализации своих прав пользователь может обратиться к Администрации Сервиса через форму обратной связи на странице «О системе».
            </p>
          </div>
        </div>

        {/* Блок 7: Cookies */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            7. Использование Cookies
          </h2>
          <div className="space-y-3 text-gray-700 text-base leading-relaxed">
            <p>
              Сервис использует технологию cookies для обеспечения удобства использования и улучшения функциональности.
            </p>
            <p>
              Пользователь может настроить свой браузер для отказа от cookies, однако это может ограничить доступ к некоторым функциям Сервиса.
            </p>
          </div>
        </div>

        {/* Блок 8: Изменения в политике */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            8. Изменения в Политике конфиденциальности
          </h2>
          <div className="space-y-3 text-gray-700 text-base leading-relaxed">
            <p>
              Администрация Сервиса оставляет за собой право вносить изменения в настоящую Политику конфиденциальности. 
              Актуальная версия всегда доступна на данной странице.
            </p>
            <p>
              При внесении существенных изменений пользователи будут уведомлены через Сервис или по электронной почте.
            </p>
          </div>
        </div>

        {/* Блок 9: Контакты */}
        <div className="bg-white border border-gray-200 rounded-xl p-6" ref={formRef}>
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            9. Обратиться в поддержку
          </h2>
          <div className="space-y-4 text-gray-700 text-base leading-relaxed">
            <p>
              По всем вопросам, связанным с обработкой персональных данных, вы можете обратиться к Администрации Сервиса:
            </p>
            
            {/* Форма обратной связи */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <form onSubmit={handleSubmit}>
                {/* Поле Email */}
                <div className="mb-4">
                  <label className="block text-gray-900 font-medium mb-2">
                    Ваша электронная почта
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="example@mail.com"
                  />
                </div>

                {/* Поле Сообщение */}
                <div className="mb-6">
                  <label className="block text-gray-900 font-medium mb-2">
                    Ваше сообщение
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Опишите вашу проблему или вопрос..."
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      className="text-gray-500 hover:text-gray-700 text-base font-medium flex items-center hover:text-blue-600 transition-colors"
                      onClick={() => alert('Функция прикрепления файла (заглушка)')}
                    >
                      <i className="fas fa-paperclip mr-2 text-lg"></i>
                      Прикрепить файл
                    </button>
                  </div>
                </div>

                {/* Кнопка отправки */}
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    isFormValid
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Отправить
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

