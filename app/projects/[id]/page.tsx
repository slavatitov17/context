'use client';

import { useState } from 'react';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [filesUploaded, setFilesUploaded] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);

  const handleFileUpload = () => {
    setFilesUploaded(true);
    setMessages([{
      text: "Документы проанализированы. Теперь можно задавать вопросы по их содержимому.",
      isUser: false
    }]);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages(prev => [...prev, { text: message, isUser: true }]);
      setMessage('');

      // Имитация ответа системы
      setTimeout(() => {
        setMessages(prev => [...prev, {
          text: "На основе загруженных документов доступна следующая информация...",
          isUser: false
        }]);
      }, 1000);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-medium mb-6">Загрузка файлов</h1>
      {!filesUploaded ? (
        /* Область загрузки файлов - НА ВЕСЬ ЭКРАН */
        <div className="flex-1 flex flex-col">
          <div className="border-2 border-dashed border-gray-300 rounded-lg flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center">
              {/* Первая строка: текст и кнопка */}
              <div className="mb-4">
                <span className="text-gray-600 text-lg">Перетащите файлы сюда или </span>
                <button
                  onClick={handleFileUpload}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium ml-2"
                >
                  Загрузить файлы
                </button>
              </div>

              {/* Вторая строка: примечание */}
              <p className="text-gray-500 text-base">Поддерживаются: DOC, DOCX, TXT, PDF, ODT, RTF, CSV</p>
            </div>
          </div>
        </div>
      ) : (
        /* Область чата */
        <div className="flex-1 flex flex-col">
          {/* История сообщений */}
          <div className="flex-1 bg-gray-50 rounded-lg p-6 mb-6 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.isUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Поле ввода */}
          <div className="flex space-x-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Задайте вопрос по документам..."
              className="flex-1 border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="bg-blue-600 text-white px-8 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Отправить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}