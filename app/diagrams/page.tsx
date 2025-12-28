import Link from 'next/link';

export default function DiagramsPage() {
  const diagrams = [
    { 
      id: 'diagram1', 
      name: 'Frontend-разработка CASE-средства', 
      description: 'Интеллект-карта разработки клиентской части',
      type: 'MindMap',
      createdAt: '29.10.2025'
    },
    { 
      id: 'diagram2', 
      name: 'Проектирование CASE-средства', 
      description: 'Последовательность шагов проектирования',
      type: 'FlowChart',
      createdAt: '10.09.2025'
    },
    { 
      id: 'diagram3', 
      name: 'Структура данных', 
      description: 'Диаграмма связей между таблицами базы данных',
      type: 'ER-диаграмма',
      createdAt: '15.08.2025'
    },
  ];

  return (
    <div>
      {/* Верхний блок: заголовок, описание и кнопка */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-medium mb-2">Диаграммы</h1>
          <p className="text-gray-600">Описывайте объекты и получайте готовые диаграммы</p>
        </div>
        <Link href="/diagrams/new">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            + Создать диаграмму
          </button>
        </Link>
      </div>

      {/* Таблица диаграмм */}
      <div>
        <h2 className="text-2xl font-medium mb-6">Мои диаграммы</h2>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 font-medium text-gray-900">Название</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Краткое описание</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Тип диаграммы</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Дата создания</th>
              </tr>
            </thead>
            <tbody>
              {diagrams.map((diagram) => (
                <tr 
                  key={diagram.id} 
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="py-4 px-6 text-gray-900 font-medium">
                    <Link href={`/diagrams/${diagram.id}`} className="block w-full h-full">
                      {diagram.name}
                    </Link>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    <Link href={`/diagrams/${diagram.id}`} className="block w-full h-full">
                      {diagram.description}
                    </Link>
                  </td>
                  <td className="py-4 px-6 text-gray-500">
                    <Link href={`/diagrams/${diagram.id}`} className="block w-full h-full">
                      {diagram.type}
                    </Link>
                  </td>
                  <td className="py-4 px-6 text-gray-500">
                    <Link href={`/diagrams/${diagram.id}`} className="block w-full h-full">
                      {diagram.createdAt}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}