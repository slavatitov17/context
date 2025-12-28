'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DiagramDetailPage({ params }: { params: { id: string } }) {
  const [selectedOption, setSelectedOption] = useState<'projects' | 'scratch' | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showDiagram, setShowDiagram] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; type?: 'diagram' | 'table' }>>([]);

  const projects = [
    { id: 'project1', name: 'Мой первый проект', files: 3 },
    { id: 'project2', name: 'Исследование рынка', files: 5 },
    { id: 'project3', name: 'Техническая документация', files: 8 },
  ];

  // Заглушка для Mermaid диаграммы
  const mermaidCode = `graph TD
    A[Основной объект] --> B[Подобъект 1]
    A --> C[Подобъект 2]
    B --> D[Элемент 1.1]
    B --> E[Элемент 1.2]
    C --> F[Элемент 2.1]
    C --> G[Элемент 2.2]`;

  const handleOptionSelect = (option: 'projects' | 'scratch') => {
    setSelectedOption(option);
    if (option === 'scratch') {
      // Для создания с нуля сразу переходим к чату
      setMessages([{
        text: "Опишите предметную область для построения диаграммы.",
        isUser: false
      }]);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    setMessages([{
      text: "Документы проанализированы. Диаграмму какого объекта требуется построить?",
      isUser: false
    }]);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages(prev => [...prev, { text: message, isUser: true }]);
      setMessage('');

      // Имитация построения диаграммы
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            text: "Диаграмма построена:",
            isUser: false
          },
          {
            text: mermaidCode,
            isUser: false,
            type: 'diagram'
          },
          {
            text: "Элементы диаграммы:",
            isUser: false,
            type: 'table'
          }
        ]);
        setShowDiagram(true);
      }, 1500);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-3xl font-medium mb-2">Создание диаграммы</h1>
      <p className="text-gray-600 mb-8 text-base">Выберите способ создания диаграммы</p>
      {!selectedOption ? (
        /* Выбор источника данных */
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-4xl w-full">
            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={() => handleOptionSelect('projects')}
                className="bg-blue-600 text-white p-8 rounded-lg text-center hover:bg-blue-700 transition-colors"
              >
                <div className="font-medium text-lg mb-2">Выбрать из моих проектов</div>
                <div className="text-sm opacity-90">Использовать данные из существующего проекта</div>
              </button>
              <button
                onClick={() => handleOptionSelect('scratch')}
                className="bg-blue-600 text-white p-8 rounded-lg text-center hover:bg-blue-700 transition-colors"
              >
                <div className="font-medium text-lg mb-2">Создать с нуля</div>
                <div className="text-sm opacity-90">Опишите предметную область вручную</div>
              </button>
            </div>
          </div>
        </div>
      ) : selectedOption === 'projects' && !selectedProject ? (
        /* Список проектов */
        <div>
          <h2 className="text-2xl font-medium mb-6">Выберите проект</h2>
          <div className="space-y-4">
            {projects.map((project, index) => (
              <div key={project.id} className={index < projects.length - 1 ? 'mb-6' : ''}>
                <div
                  onClick={() => handleProjectSelect(project.id)}
                  className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg text-gray-900">{project.name}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">{project.files} файлов</p>
                </div>
              </div>
            ))}
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
                  {msg.type === 'diagram' ? (
                    /* Блок диаграммы */
                    <div className="max-w-full w-full">
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium text-lg">MindMap диаграмма</h3>
                          <div className="flex space-x-2">
                            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                              Скачать PNG
                            </button>
                            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                              Скачать SVG
                            </button>
                            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                              Копировать код
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                          <div className="text-gray-500 mb-4">[Здесь будет визуализация Mermaid диаграммы]</div>
                          <div className="text-xs text-gray-400 font-mono bg-gray-100 p-4 rounded text-left">
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : msg.type === 'table' ? (
                    /* Блок таблицы */
                    <div className="max-w-full w-full">
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="font-medium text-lg mb-4">Элементы диаграммы</h4>
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 font-medium text-gray-900">Элемент</th>
                              <th className="text-left py-2 font-medium text-gray-900">Описание</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-gray-100">
                              <td className="py-3 text-gray-900">Основной объект</td>
                              <td className="py-3 text-gray-600">Центральный элемент системы</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-3 text-gray-900">Подобъект 1</td>
                              <td className="py-3 text-gray-600">Первая основная ветвь</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-3 text-gray-900">Подобъект 2</td>
                              <td className="py-3 text-gray-600">Вторая основная ветвь</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    /* Обычное сообщение */
                    <div className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.isUser
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  )}
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
              placeholder={selectedOption === 'projects' ? "Введите название объекта для диаграммы..." : "Опишите предметную область..."}
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