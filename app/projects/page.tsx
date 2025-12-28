import Link from 'next/link';

export default function ProjectsPage() {
  const projects = [
    { 
      id: 'project1', 
      name: 'Frontend-разработка CASE-средства', 
      description: 'Работаем над клиентской частью CASE-средства',
      createdAt: '29.10.2025'
    },
    { 
      id: 'project2', 
      name: 'Проектирование CASE-средства', 
      description: 'Моделируем процессы, разрабатываем прототип CASE-средства',
      createdAt: '10.09.2025'
    },
    { 
      id: 'project3', 
      name: 'Техническая документация', 
      description: 'Сбор и систематизация технической документации проекта',
      createdAt: '05.08.2025'
    },
  ];

  return (
    <div>
      {/* Верхний блок: заголовок, описание и кнопка */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-medium mb-2">Проекты</h1>
          <p className="text-gray-600">Создавайте проекты и получайте ответы на вопросы по ним</p>
        </div>
        <Link href="/projects/new">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            + Создать проект
          </button>
        </Link>
      </div>

      {/* Таблица проектов */}
      <div>
        <h2 className="text-2xl font-medium mb-6">Мои проекты</h2>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 font-medium text-gray-900">Название</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Краткое описание</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Дата создания</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr 
                  key={project.id} 
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="py-4 px-6 text-gray-900 font-medium">
                    <Link href={`/projects/${project.id}`} className="block w-full h-full">
                      {project.name}
                    </Link>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    <Link href={`/projects/${project.id}`} className="block w-full h-full">
                      {project.description}
                    </Link>
                  </td>
                  <td className="py-4 px-6 text-gray-500">
                    <Link href={`/projects/${project.id}`} className="block w-full h-full">
                      {project.createdAt}
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