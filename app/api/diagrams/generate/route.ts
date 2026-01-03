import { NextRequest, NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';

// Инициализация Mistral AI клиента
function getMistralClient(): Mistral | null {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Mistral({ apiKey });
}

// Функция для получения контекста из документов
function getContextFromDocuments(documents: any[]): string {
  const allChunks: string[] = [];
  documents.forEach((doc: any) => {
    if (doc.chunks && Array.isArray(doc.chunks)) {
      allChunks.push(...doc.chunks);
    } else if (doc.text) {
      const chunkSize = 1000;
      for (let i = 0; i < doc.text.length; i += chunkSize) {
        allChunks.push(doc.text.substring(i, i + chunkSize));
      }
    }
  });
  return allChunks.join('\n\n---\n\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { diagramType, objectDescription, documents, isFromProject } = body;

    if (!diagramType || typeof diagramType !== 'string') {
      return NextResponse.json(
        { error: 'Тип диаграммы не предоставлен' },
        { status: 400 }
      );
    }

    if (!objectDescription || typeof objectDescription !== 'string') {
      return NextResponse.json(
        { error: 'Описание объекта не предоставлено' },
        { status: 400 }
      );
    }

    // Получаем клиент Mistral AI
    const client = getMistralClient();

    if (!client) {
      return NextResponse.json(
        { error: 'Mistral AI API ключ не настроен. Установите MISTRAL_API_KEY в переменных окружения.' },
        { status: 500 }
      );
    }

    // Формируем контекст из документов (если есть)
    let context = '';
    if (isFromProject && documents && Array.isArray(documents) && documents.length > 0) {
      context = getContextFromDocuments(documents);
    }

    // Проверяем, является ли это Mermaid диаграммой
    const isMermaid = diagramType === 'MindMapMermaid' || 
                      diagramType === 'SequenceMermaid' ||
                      diagramType === 'ClassMermaid' ||
                      diagramType === 'StateMermaid' ||
                      diagramType === 'ActivityMermaid' ||
                      diagramType === 'GanttMermaid' ||
                      diagramType === 'ERMermaid' ||
                      diagramType === 'Architecture' ||
                      diagramType === 'C4' ||
                      diagramType === 'Git' ||
                      diagramType === 'Kanban' ||
                      diagramType === 'Pie' ||
                      diagramType === 'Quadrant' ||
                      diagramType === 'Radar' ||
                      diagramType === 'Timeline' ||
                      diagramType === 'UserJourney' ||
                      diagramType === 'XY';

    // Определяем тип Mermaid диаграммы
    const getMermaidDiagramType = (type: string): string => {
      if (type === 'MindMapMermaid') return 'mindmap';
      if (type === 'SequenceMermaid') return 'sequenceDiagram';
      if (type === 'ClassMermaid') return 'classDiagram';
      if (type === 'StateMermaid') return 'stateDiagram-v2';
      if (type === 'ActivityMermaid') return 'flowchart';
      if (type === 'GanttMermaid') return 'gantt';
      if (type === 'ERMermaid') return 'erDiagram';
      if (type === 'Architecture') return 'graph';
      if (type === 'C4') return 'C4Context';
      if (type === 'Git') return 'gitGraph';
      if (type === 'Kanban') return 'kanban';
      if (type === 'Pie') return 'pie';
      if (type === 'Quadrant') return 'quadrantChart';
      if (type === 'Radar') return 'radar';
      if (type === 'Timeline') return 'timeline';
      if (type === 'UserJourney') return 'journey';
      if (type === 'XY') return 'xychart-beta';
      return 'mindmap';
    };

    // Функция для получения детальных инструкций по синтаксису для каждого типа диаграммы
    const getMermaidSyntaxInstructions = (type: string, diagramType: string): string => {
      const instructions: Record<string, string> = {
        'MindMapMermaid': `ДЛЯ MERMAID MINDMAP (${diagramType}):
- Начинай с "mindmap"
- Используй отступы (2 пробела) для создания иерархии
- Формат: mindmap\\n  root((Корневой узел))\\n    Подтема 1\\n      Деталь 1.1\\n    Подтема 2
- Корневой узел можно обозначить как root((Название)) или просто как первый элемент
- Каждый уровень иерархии должен иметь правильный отступ (2 пробела на уровень)
- НЕ используй специальные символы в названиях узлов, которые могут сломать синтаксис`,

        'SequenceMermaid': `ДЛЯ MERMAID SEQUENCE (${diagramType}):
- Начинай с "sequenceDiagram"
- Используй participant для определения участников: participant Название
- Используй стрелки для сообщений: Название1->>Название2: Сообщение
- Типы стрелок: -> (сплошная), --> (пунктирная), ->> (сплошная с наконечником), -->> (пунктирная с наконечником)
- Можно использовать активацию: activate Название и deactivate Название
- Пример: sequenceDiagram\\n    participant A as Участник1\\n    participant B as Участник2\\n    A->>B: Сообщение`,

        'ClassMermaid': `ДЛЯ MERMAID CLASS (${diagramType}):
- Начинай с "classDiagram"
- Определяй классы: class НазваниеКласса
- Добавляй атрибуты: НазваниеКласса : +атрибут
- Добавляй методы: НазваниеКласса : +метод()
- Используй отношения: Название1 --> Название2 (ассоциация), Название1 <|-- Название2 (наследование)
- Типы отношений: --> (ассоциация), <|-- (наследование), *-- (композиция), o-- (агрегация)
- Пример: classDiagram\\n    class Класс1\\n    class Класс2\\n    Класс1 --> Класс2`,

        'StateMermaid': `ДЛЯ MERMAID STATE (${diagramType}):
- Начинай с "stateDiagram-v2" (обязательно v2!)
- Определяй состояния: state НазваниеСостояния
- Используй переходы: Название1 --> Название2 : Событие
- Можно использовать составные состояния: state Составное {\\n    Состояние1\\n    Состояние2\\n}
- Пример: stateDiagram-v2\\n    [*] --> Состояние1\\n    Состояние1 --> Состояние2 : Событие`,

        'ActivityMermaid': `ДЛЯ MERMAID ACTIVITY (${diagramType}):
- Начинай с "flowchart TD" (сверху вниз) или "flowchart LR" (слева направо)
- Используй узлы: Название[Текст] (прямоугольник), Название{Условие} (ромб), Название((Круг))
- Используй стрелки: Название1 --> Название2
- Форматы узлов: [Текст] (прямоугольник), {Условие} (ромб), ((Круг)), (Скругленный)
- Пример: flowchart TD\\n    A[Начало] --> B{Условие?}\\n    B -->|Да| C[Действие1]\\n    B -->|Нет| D[Действие2]`,

        'GanttMermaid': `ДЛЯ MERMAID GANTT (${diagramType}):
- Начинай с "gantt"
- Добавляй заголовок: title Название проекта
- Определяй формат даты: dateFormat YYYY-MM-DD
- Добавляй секции: section Название секции
- Добавляй задачи: Название задачи :done, Название, Дата начала, Длительность
- Статусы: :done (выполнено), :active (активно), :crit (критично), :milestone (веха)
- Пример: gantt\\n    title Проект\\n    dateFormat YYYY-MM-DD\\n    section Секция1\\n    Задача1 :done, 2024-01-01, 5d`,

        'ERMermaid': `ДЛЯ MERMAID ER (${diagramType}):
- Начинай с "erDiagram"
- Определяй сущности: НазваниеСущности {\\n    тип поле\\n    тип поле2\\n}
- Используй отношения: Сущность1 ||--|| Сущность2 (один к одному), Сущность1 }o--|| Сущность2 (многие к одному)
- Типы отношений: ||--|| (один к одному), }o--|| (многие к одному), ||--o{ (один ко многим), }o--o{ (многие ко многим)
- Пример: erDiagram\\n    СУЩНОСТЬ1 {\\n        int id\\n        string название\\n    }\\n    СУЩНОСТЬ1 ||--|| СУЩНОСТЬ2`,

        'Architecture': `ДЛЯ ARCHITECTURE (${diagramType}):
- Начинай с "graph TD" (сверху вниз) или "graph LR" (слева направо)
- Используй узлы для компонентов: Название[Компонент]
- Используй стрелки для связей: Название1 --> Название2
- Можно использовать подграфы: subgraph Название\\n    Узел1\\n    Узел2\\n    end
- Форматы узлов: [Текст] (прямоугольник), {Текст} (ромб), ((Текст)) (круг)
- Пример: graph TD\\n    A[Компонент1] --> B[Компонент2]\\n    B --> C[Компонент3]`,

        'C4': `ДЛЯ C4 (${diagramType}):
- Начинай с "C4Context" для контекстной диаграммы
- Используй Person для людей: Person(alias, "Название", "Описание")
- Используй System для систем: System(alias, "Название", "Описание")
- Используй SystemDb для баз данных: SystemDb(alias, "Название", "Описание")
- Используй Rel для связей: Rel(откуда, куда, "Связь", "Технология")
- Все параметры в кавычках должны быть на русском
- Пример: C4Context\\n    Person(user, "Пользователь", "Использует систему")\\n    System(system, "Веб-система", "Основная система")\\n    Rel(user, system, "Использует", "HTTPS")`,

        'Git': `ДЛЯ GIT (${diagramType}):
- Начинай с "gitGraph"
- Используй commit для коммитов: commit id: "Название коммита"
- Используй branch для веток: branch название_ветки
- Используй checkout для переключения: checkout название_ветки
- Используй merge для слияния: merge название_ветки
- Названия коммитов в кавычках должны быть на русском
- Пример: gitGraph\\n    commit id: "Первый коммит"\\n    branch develop\\n    checkout develop\\n    commit id: "Коммит в develop"\\n    checkout main\\n    merge develop`,

        'Kanban': `ДЛЯ KANBAN (${diagramType}):
- Начинай с "kanban"
- Определяй колонки: section Название колонки
- Добавляй задачи в колонки: Название задачи
- Можно использовать статусы: Название задачи :done (выполнено), :active (активно), :crit (критично)
- Названия колонок и задач должны быть на русском
- Пример: kanban\\n    section Сделать\\n    Задача 1\\n    Задача 2 :active\\n    section В работе\\n    Задача 3\\n    section Готово\\n    Задача 4 :done`,

        'Pie': `ДЛЯ PIE (${diagramType}):
- Начинай с "pie"
- Добавляй заголовок: title "Название диаграммы" (заголовок в кавычках)
- Определяй доли: "Название" : значение
- Значения должны быть числами (без кавычек)
- Названия элементов в кавычках должны быть на русском
- Пример: pie title "Распределение"\\n    "Элемент1" : 30\\n    "Элемент2" : 50\\n    "Элемент3" : 20`,

        'Quadrant': `ДЛЯ QUADRANT (${diagramType}):
- Начинай с "quadrantChart"
- Определяй оси: x-axis Название1 --> Название2
- Определяй квадранты: quadrant Название квадранта
- Добавляй точки: Название точки: [x, y]
- Пример: quadrantChart\\n    x-axis Низкий --> Высокий\\n    y-axis Низкий --> Высокий\\n    quadrant Q1\\n    Точка1: [0.5, 0.5]`,

        'Radar': `ДЛЯ RADAR (${diagramType}):
- Начинай с "radar"
- Определяй оси: x-axis Название оси
- Добавляй серии данных: Название серии --> значение1, значение2, значение3
- Количество значений должно соответствовать количеству осей
- Пример: radar\\n    x-axis Ось1, Ось2, Ось3\\n    Серия1 --> 5, 3, 4\\n    Серия2 --> 2, 4, 3`,

        'Timeline': `ДЛЯ TIMELINE (${diagramType}):
- Начинай с "timeline"
- Определяй события: title Название события
- Можно группировать по периодам: section Период\\n    Событие1 : Событие2
- Пример: timeline\\n    title История\\n    section Период1\\n    Событие1 : Событие2\\n    section Период2\\n    Событие3`,

        'UserJourney': `ДЛЯ USER JOURNEY (${diagramType}):
- Начинай с "journey"
- Определяй этапы: title Название этапа : оценка
- Оценки: 0-5 (0 - очень плохо, 5 - отлично)
- Можно использовать несколько этапов подряд
- Пример: journey\\n    title Пользовательский путь\\n    Этап1 : 5\\n    Этап2 : 3\\n    Этап3 : 4`,

        'XY': `ДЛЯ XY (${diagramType}):
- Начинай с "xychart-beta"
- Определяй оси: x-axis [значение1, значение2, ...] или x-axis [min..max]
- Определяй серии: line [значение1, значение2, ...] или bar [значение1, значение2, ...]
- Количество значений в серии должно соответствовать количеству точек на оси X
- Пример: xychart-beta\\n    x-axis [1, 2, 3, 4, 5]\\n    y-axis [0, 100]\\n    line [10, 20, 30, 40, 50]`
      };

      return instructions[type] || '';
    };

    const mermaidDiagramType = isMermaid ? getMermaidDiagramType(diagramType) : '';

    // Формируем промпт для генерации кода
    const systemPrompt = isMermaid 
      ? `Ты эксперт по созданию диаграмм в формате Mermaid. Твоя задача - создать КОРРЕКТНЫЙ и ВАЛИДНЫЙ код Mermaid для ${mermaidDiagramType} диаграммы, который БЕЗ ОШИБОК отрендерится в Mermaid.

КРИТИЧЕСКИ ВАЖНО:
1. Генерируй ТОЛЬКО валидный код Mermaid, который может быть успешно отрендерен
2. Код ДОЛЖЕН начинаться с правильного типа диаграммы (${mermaidDiagramType}) - это ОБЯЗАТЕЛЬНО
3. Используй СТРОГО правильный синтаксис Mermaid для указанного типа диаграммы согласно официальной документации
4. ВСЕ НАЗВАНИЯ УЗЛОВ, КЛАССОВ, СОСТОЯНИЙ И ДРУГИХ ЭЛЕМЕНТОВ ДОЛЖНЫ БЫТЬ НА РУССКОМ ЯЗЫКЕ
5. Используй русские названия для всех элементов (например: "Институт", "Студент", "Преподаватель")
6. Синтаксис Mermaid остается на английском (classDiagram, sequenceDiagram, etc.), но содержимое - на русском
7. ПРОВЕРЬ код перед отправкой: все скобки закрыты, правильные разделители, правильное количество элементов
8. НЕ используй специальные символы в названиях, которые могут сломать синтаксис (кавычки внутри названий узлов, незакрытые скобки)
9. После кода диаграммы, добавь глоссарий в формате JSON массива объектов с полями "element" и "description"
10. Если сомневаешься в синтаксисе - используй простые конструкции, которые точно работают`
      : `Ты эксперт по созданию диаграмм в формате PlantUML. Твоя задача - создать корректный код PlantUML для указанного типа диаграммы.

КРИТИЧЕСКИ ВАЖНО:
1. Генерируй только валидный код PlantUML, без дополнительных объяснений
2. Код должен начинаться с @startuml и заканчиваться @enduml
3. Используй правильный синтаксис для указанного типа диаграммы (английские ключевые слова: class, interface, component, etc.)
4. ВСЕ НАЗВАНИЯ ОБЪЕКТОВ, КЛАССОВ, МЕТОДОВ, АТРИБУТОВ И ДРУГИХ ЭЛЕМЕНТОВ ДОЛЖНЫ БЫТЬ НА РУССКОМ ЯЗЫКЕ
5. Используй русские названия для всех сущностей в диаграмме (например: "Институт" вместо "Institute", "Студент" вместо "Student")
6. Синтаксис PlantUML остается на английском (class, interface, ->, etc.), но содержимое - на русском
7. После кода диаграммы, добавь глоссарий в формате JSON массива объектов с полями "element" и "description"`;

    const diagramTypeDescriptions: Record<string, string> = {
      'UseCase': 'UML диаграмма прецедентов (Use Case Diagram)',
      'Object': 'UML диаграмма объектов (Object Diagram)',
      'SequenceMermaid': 'Sequence диаграмма (Mermaid)',
      'ClassMermaid': 'Class диаграмма (Mermaid)',
      'StateMermaid': 'State диаграмма (Mermaid)',
      'ActivityMermaid': 'Activity диаграмма (Mermaid)',
      'GanttMermaid': 'Gantt диаграмма (Mermaid)',
      'ERMermaid': 'ER диаграмма (Mermaid)',
      'MindMapMermaid': 'MindMap диаграмма (Mermaid)',
      'Sequence': 'UML диаграмма последовательности (Sequence Diagram)',
      'Class': 'UML диаграмма классов (Class Diagram)',
      'State': 'UML диаграмма состояний (State Diagram)',
      'Activity': 'UML диаграмма активности (Activity Diagram)',
      'Gantt': 'Диаграмма Ганта (Gantt Chart)',
      'ER': 'ER диаграмма (Entity-Relationship Diagram)',
      'MindMap': 'Интеллект-карта (Mind Map)',
      'Architecture': 'Architecture диаграмма (Mermaid)',
      'C4': 'C4 диаграмма (Mermaid)',
      'Git': 'Git диаграмма (Mermaid)',
      'Kanban': 'Kanban диаграмма (Mermaid)',
      'Pie': 'Pie диаграмма (Mermaid)',
      'Quadrant': 'Quadrant диаграмма (Mermaid)',
      'Radar': 'Radar диаграмма (Mermaid)',
      'Timeline': 'Timeline диаграмма (Mermaid)',
      'UserJourney': 'User Journey диаграмма (Mermaid)',
      'XY': 'XY диаграмма (Mermaid)',
    };

    const typeDescription = diagramTypeDescriptions[diagramType] || diagramType;

    let userPrompt = '';
    
    if (isMermaid) {
      // Получаем детальные инструкции по синтаксису для данного типа диаграммы
      const syntaxInstructions = getMermaidSyntaxInstructions(diagramType, mermaidDiagramType);
      
      userPrompt = `Создай ${typeDescription} для следующего объекта/процесса:

${objectDescription}

КРИТИЧЕСКИ ВАЖНО:
1. Все названия узлов, классов, состояний и других элементов должны быть на русском языке
2. Используй русские названия для всех элементов (например: "Институт", "Студент", "Преподаватель", "Курс" и т.д.)
3. Синтаксис Mermaid остается на английском (${mermaidDiagramType}, classDiagram, sequenceDiagram, etc.), но содержимое - на русском
4. СТРОГО следуй синтаксису Mermaid для типа ${mermaidDiagramType}
5. Проверь, что код валидный и может быть отрендерен без ошибок
6. НЕ используй специальные символы в названиях, которые могут сломать синтаксис (например: кавычки, скобки в неправильных местах)
7. Используй правильные отступы и форматирование

${syntaxInstructions}

ПРИМЕРЫ ПРАВИЛЬНОГО СИНТАКСИСА:
- Всегда начинай с правильного ключевого слова типа диаграммы
- Используй правильные разделители и синтаксические конструкции
- Проверь соответствие количества элементов (например, в Radar количество значений должно соответствовать количеству осей)
- Убедись, что все скобки, кавычки и другие символы правильно закрыты`;

      if (context) {
        userPrompt += `\n\nДополнительный контекст из документов:\n${context.substring(0, 3000)}`;
      }

      userPrompt += `\n\nСгенерируй код Mermaid и глоссарий. Формат ответа:
\`\`\`mermaid
${mermaidDiagramType}
[код диаграммы с русскими названиями элементов - ОБЯЗАТЕЛЬНО валидный синтаксис Mermaid]
\`\`\`

ВАЖНО ПЕРЕД ОТПРАВКОЙ:
- Проверь, что код начинается с правильного ключевого слова (${mermaidDiagramType})
- Убедись, что все синтаксические конструкции правильные
- Проверь, что нет незакрытых скобок, кавычек или других символов
- Убедись, что количество элементов соответствует требованиям типа диаграммы
- Код должен быть готов к рендерингу без ошибок

\`\`\`json
[
  {"element": "Название элемента на русском", "description": "Описание элемента на русском"},
  ...
]
\`\`\``;
    } else {
      userPrompt = `Создай ${typeDescription} для следующего объекта/процесса:

${objectDescription}

ВАЖНО: Все названия объектов, классов, методов, атрибутов и других элементов должны быть на русском языке. Используй русские названия для всех сущностей (например: "Институт", "Студент", "Преподаватель", "Курс" и т.д.). Синтаксис PlantUML остается на английском (class, interface, ->, etc.), но содержимое - на русском.

${diagramType === 'MindMap' ? 'ДЛЯ MINDMAP: Используй правильный синтаксис @startmindmap ... @endmindmap. Структура: * Центральная тема ** Подтема 1 *** Подподтема 1.1 ** Подтема 2. НЕ используй просто "mindmap" без @startmindmap/@endmindmap!' : ''}
${diagramType === 'Activity' ? 'ДЛЯ ACTIVITY: Используй правильный синтаксис activity диаграммы: start, :действие;, if (условие) then, else, endif, fork, fork again, end fork, stop. НЕ используй split/join, используй fork/fork again/end fork!' : ''}
${diagramType === 'Class' ? 'ДЛЯ CLASS: Для длинных русских названий классов используй пробелы или разбивай на несколько слов. Например: "Федеральное Государственное Образовательное Учреждение" вместо "ФедеральноеГосударственноеОбразовательноеУчреждение". Используй кавычки для названий с пробелами: class "Название с пробелами" as Алиас' : ''}`;

      if (context) {
        userPrompt += `\n\nДополнительный контекст из документов:\n${context.substring(0, 3000)}`;
      }

      userPrompt += `\n\nСгенерируй код PlantUML и глоссарий. Формат ответа:
\`\`\`plantuml
@startuml
[код диаграммы с русскими названиями объектов]
@enduml
\`\`\`

\`\`\`json
[
  {"element": "Название элемента на русском", "description": "Описание элемента на русском"},
  ...
]
\`\`\``;
    }

    try {
      // Вызываем модель Mistral AI
      const chatResponse = await client.chat.complete({
        model: 'pixtral-12b-2409',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        maxTokens: 4096,
        temperature: 0.3, // Низкая температура для более точного кода
      });

      const responseContent = chatResponse.choices?.[0]?.message?.content;
      let responseText = '';
      if (typeof responseContent === 'string') {
        responseText = responseContent;
      } else if (Array.isArray(responseContent)) {
        responseText = responseContent
          .map(c => {
            if (typeof c === 'string') return c;
            if ('text' in c && typeof (c as any).text === 'string') return (c as any).text;
            return '';
          })
          .join('');
      } else {
        responseText = String(responseContent || '');
      }

      // Функция для постобработки и исправления кода Mermaid
      const fixMermaidCode = (code: string, diagramType: string): string => {
        let fixed = code.trim();
        
        // Убеждаемся, что код начинается с правильного типа диаграммы
        if (!fixed.startsWith(diagramType)) {
          // Удаляем возможные префиксы и добавляем правильный
          fixed = fixed.replace(/^(flowchart|graph|mindmap|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|quadrantChart|radar|timeline|journey|xychart|gitGraph|kanban|C4Context|C4Container)\s*/i, '');
          fixed = `${diagramType}\n${fixed}`;
        }
        
        // Исправляем распространенные ошибки
        // Удаляем лишние пробелы в начале строк
        fixed = fixed.split('\n').map(line => line.trimStart()).join('\n');
        
        // Исправляем незакрытые скобки в flowchart/graph (добавляем закрывающие скобки для узлов)
        if (diagramType.startsWith('flowchart') || diagramType.startsWith('graph')) {
          // Убеждаемся, что узлы правильно закрыты
          fixed = fixed.replace(/(\[[^\]]*)$/gm, (match) => {
            if (!match.includes(']')) {
              return match + ']';
            }
            return match;
          });
          fixed = fixed.replace(/(\{[^\}]*)$/gm, (match) => {
            if (!match.includes('}')) {
              return match + '}';
            }
            return match;
          });
        }
        
        // Исправляем проблемы с кавычками в названиях
        // Заменяем неправильные кавычки на правильные
        fixed = fixed.replace(/[""]/g, '"').replace(/['']/g, "'");
        
        // Удаляем пустые строки в начале и конце
        fixed = fixed.trim();
        
        return fixed;
      };

      // Извлекаем код в зависимости от типа диаграммы
      if (isMermaid) {
        // Извлекаем код Mermaid
        const mermaidMatch = responseText.match(/```mermaid\s*\n([\s\S]*?)\n```/i) ||
                           responseText.match(new RegExp(`${mermaidDiagramType}\\s*\\n([\\s\\S]*?)(?=\\n\`\`\`|$)`, 'i'));
        
        let mermaidCode = '';
        if (mermaidMatch) {
          mermaidCode = mermaidMatch[1].trim();
          
          // Применяем постобработку для исправления ошибок
          mermaidCode = fixMermaidCode(mermaidCode, mermaidDiagramType);
        } else {
          // Fallback: создаем базовую Mermaid диаграмму в зависимости от типа
          if (mermaidDiagramType === 'mindmap') {
            const rootNode = objectDescription.split(' ')[0] || 'Корневой узел';
            mermaidCode = `mindmap
  root((${rootNode}))
    Подтема 1
      Деталь 1.1
    Подтема 2
      Деталь 2.1`;
          } else if (mermaidDiagramType === 'flowchart' || mermaidDiagramType === 'graph') {
            const nodeName = objectDescription.split(' ')[0] || 'Элемент';
            mermaidCode = `${mermaidDiagramType} TD
    A[${nodeName}]
    B[Подэлемент 1]
    C[Подэлемент 2]
    A --> B
    A --> C`;
          } else if (mermaidDiagramType === 'pie') {
            mermaidCode = `pie title ${objectDescription.split(' ')[0] || 'Диаграмма'}
    "Элемент 1" : 30
    "Элемент 2" : 50
    "Элемент 3" : 20`;
          } else {
            mermaidCode = `${mermaidDiagramType}\n    ${objectDescription.split(' ')[0] || 'Элемент'}`;
          }
          
          // Применяем постобработку к fallback коду
          mermaidCode = fixMermaidCode(mermaidCode, mermaidDiagramType);
        }

        // Извлекаем глоссарий
        const glossaryMatch = responseText.match(/```json\s*\n([\s\S]*?)\n```/i);
        let glossary: Array<{ element: string; description: string }> = [];
        
        if (glossaryMatch) {
          try {
            glossary = JSON.parse(glossaryMatch[1]);
          } catch (e) {
            console.error('Ошибка парсинга глоссария:', e);
            glossary = [{ element: objectDescription, description: 'Основной объект диаграммы' }];
          }
        } else {
          glossary = [{ element: objectDescription, description: 'Основной объект диаграммы' }];
        }

        // Валидация глоссария
        if (!Array.isArray(glossary)) {
          glossary = [{ element: objectDescription, description: 'Основной объект диаграммы' }];
        }

        return NextResponse.json({
          mermaidCode,
          glossary,
        });
      } else {
        // Извлекаем код PlantUML
        // Для разных типов диаграмм нужны разные теги
        const isMindMap = diagramType === 'MindMap';
        const isJSON = diagramType === 'JSON';
        
        const startTag = isMindMap ? '@startmindmap' : (isJSON ? '@startjson' : '@startuml');
        const endTag = isMindMap ? '@endmindmap' : (isJSON ? '@endjson' : '@enduml');
        
        const plantUmlMatch = responseText.match(/```plantuml\s*\n([\s\S]*?)\n```/i) || 
                             responseText.match(new RegExp(`${startTag}\\s*\\n([\\s\\S]*?)${endTag}`, 'i')) ||
                             responseText.match(/@startuml\s*\n([\s\S]*?)@enduml/i);
        
        let plantUmlCode = '';
        if (plantUmlMatch) {
          plantUmlCode = plantUmlMatch[1].trim();
          
          // Удаляем неправильные теги, если они есть
          plantUmlCode = plantUmlCode.replace(/@startuml\s*/gi, '');
          plantUmlCode = plantUmlCode.replace(/@enduml\s*/gi, '');
          plantUmlCode = plantUmlCode.replace(/@startmindmap\s*/gi, '');
          plantUmlCode = plantUmlCode.replace(/@endmindmap\s*/gi, '');
          plantUmlCode = plantUmlCode.replace(/@startjson\s*/gi, '');
          plantUmlCode = plantUmlCode.replace(/@endjson\s*/gi, '');
          plantUmlCode = plantUmlCode.replace(/mindmap\s*/gi, ''); // Удаляем просто "mindmap" если есть
          plantUmlCode = plantUmlCode.replace(/split\s*/gi, 'fork'); // Заменяем split на fork для Activity
          plantUmlCode = plantUmlCode.replace(/join\s*/gi, 'end fork'); // Заменяем join на end fork для Activity
          
          // Для Class: исправляем длинные названия классов без пробелов
          if (diagramType === 'Class') {
            // Заменяем длинные слитные русские слова на слова с пробелами в кавычках
            plantUmlCode = plantUmlCode.replace(/class\s+([А-ЯЁ][а-яё]{20,})\s+as\s+(\w+)/gi, (match, className, alias) => {
              // Разбиваем длинное слово на части (каждые 15-20 символов)
              const words = className.match(/.{1,20}/g);
              const spacedName = words ? words.join(' ') : className;
              return `class "${spacedName}" as ${alias}`;
            });
            // Также обрабатываем случаи без "as"
            plantUmlCode = plantUmlCode.replace(/class\s+([А-ЯЁ][а-яё]{20,})\s*{/gi, (match, className) => {
              const words = className.match(/.{1,20}/g);
              const spacedName = words ? words.join(' ') : className;
              return `class "${spacedName}" {`;
            });
          }
          
          // Добавляем правильные теги
          if (!plantUmlCode.includes(startTag)) {
            plantUmlCode = `${startTag}\n` + plantUmlCode;
          }
          if (!plantUmlCode.includes(endTag)) {
            plantUmlCode = plantUmlCode + `\n${endTag}`;
          }
        } else {
          // Если не нашли в markdown, ищем напрямую
          const startIndex = responseText.indexOf(startTag);
          const endIndex = responseText.indexOf(endTag);
          if (startIndex !== -1 && endIndex !== -1) {
            plantUmlCode = responseText.substring(startIndex, endIndex + endTag.length).trim();
          } else {
            // Fallback: создаем базовую диаграмму в зависимости от типа
            if (isMindMap) {
              plantUmlCode = `${startTag}
* ${objectDescription.split(' ')[0]}
** Подтема 1
*** Деталь 1.1
** Подтема 2
${endTag}`;
            } else {
              plantUmlCode = `${startTag}
class ${objectDescription.split(' ')[0]} {
  + описание
}
${endTag}`;
            }
          }
        }

        // Извлекаем глоссарий
        const glossaryMatch = responseText.match(/```json\s*\n([\s\S]*?)\n```/i);
        let glossary: Array<{ element: string; description: string }> = [];
        
        if (glossaryMatch) {
          try {
            glossary = JSON.parse(glossaryMatch[1]);
          } catch (e) {
            console.error('Ошибка парсинга глоссария:', e);
            // Создаем простой глоссарий на основе кода
            glossary = [{ element: objectDescription, description: 'Основной объект диаграммы' }];
          }
        } else {
          // Если глоссарий не найден, создаем базовый
          glossary = [{ element: objectDescription, description: 'Основной объект диаграммы' }];
        }

        // Валидация глоссария
        if (!Array.isArray(glossary)) {
          glossary = [{ element: objectDescription, description: 'Основной объект диаграммы' }];
        }

        return NextResponse.json({
          plantUmlCode,
          glossary,
        });
      }
    } catch (apiError) {
      console.error('Ошибка при вызове Mistral AI API:', apiError);
      return NextResponse.json(
        { error: `Ошибка при генерации диаграммы: ${apiError instanceof Error ? apiError.message : 'Неизвестная ошибка'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ошибка при обработке запроса генерации диаграммы:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка при обработке запроса' },
      { status: 500 }
    );
  }
}

