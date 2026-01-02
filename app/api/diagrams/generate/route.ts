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
                      diagramType === 'ComponentMermaid' ||
                      diagramType === 'GanttMermaid' ||
                      diagramType === 'ERMermaid';

    // Определяем тип Mermaid диаграммы
    const getMermaidDiagramType = (type: string): string => {
      if (type === 'MindMapMermaid') return 'mindmap';
      if (type === 'SequenceMermaid') return 'sequenceDiagram';
      if (type === 'ClassMermaid') return 'classDiagram';
      if (type === 'StateMermaid') return 'stateDiagram-v2';
      if (type === 'ActivityMermaid') return 'flowchart';
      if (type === 'ComponentMermaid') return 'graph';
      if (type === 'GanttMermaid') return 'gantt';
      if (type === 'ERMermaid') return 'erDiagram';
      return 'mindmap';
    };

    const mermaidDiagramType = isMermaid ? getMermaidDiagramType(diagramType) : '';

    // Формируем промпт для генерации кода
    const systemPrompt = isMermaid 
      ? `Ты эксперт по созданию диаграмм в формате Mermaid. Твоя задача - создать корректный код Mermaid для ${mermaidDiagramType} диаграммы.

КРИТИЧЕСКИ ВАЖНО:
1. Генерируй только валидный код Mermaid, без дополнительных объяснений
2. Код должен начинаться с правильного типа диаграммы (${mermaidDiagramType})
3. Используй правильный синтаксис Mermaid для указанного типа диаграммы
4. ВСЕ НАЗВАНИЯ УЗЛОВ, КЛАССОВ, СОСТОЯНИЙ И ДРУГИХ ЭЛЕМЕНТОВ ДОЛЖНЫ БЫТЬ НА РУССКОМ ЯЗЫКЕ
5. Используй русские названия для всех элементов (например: "Институт", "Студент", "Преподаватель")
6. Синтаксис Mermaid остается на английском (classDiagram, sequenceDiagram, etc.), но содержимое - на русском
7. После кода диаграммы, добавь глоссарий в формате JSON массива объектов с полями "element" и "description"`
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
      'Class': 'UML диаграмма классов (Class Diagram)',
      'Sequence': 'UML диаграмма последовательности (Sequence Diagram)',
      'Activity': 'UML диаграмма активности (Activity Diagram)',
      'State': 'UML диаграмма состояний (State Diagram)',
      'Component': 'UML диаграмма компонентов (Component Diagram)',
      'UseCase': 'UML диаграмма прецедентов (Use Case Diagram)',
      'Object': 'UML диаграмма объектов (Object Diagram)',
      'ER': 'ER диаграмма (Entity-Relationship Diagram)',
      'MindMap': 'Интеллект-карта (Mind Map)',
      'MindMapMermaid': 'MindMap диаграмма (Mermaid)',
      'SequenceMermaid': 'Sequence диаграмма (Mermaid)',
      'ClassMermaid': 'Class диаграмма (Mermaid)',
      'StateMermaid': 'State диаграмма (Mermaid)',
      'ActivityMermaid': 'Activity диаграмма (Mermaid)',
      'ComponentMermaid': 'Component диаграмма (Mermaid)',
      'GanttMermaid': 'Gantt диаграмма (Mermaid)',
      'ERMermaid': 'ER диаграмма (Mermaid)',
      'Gantt': 'Диаграмма Ганта (Gantt Chart)',
      'Network': 'Сетевая диаграмма (Network Diagram)',
      'Archimate': 'ArchiMate диаграмма',
      'Timing': 'Диаграмма временных зависимостей (Timing Diagram)',
      'WBS': 'WBS диаграмма (Work Breakdown Structure)',
      'JSON': 'JSON диаграмма',
    };

    const typeDescription = diagramTypeDescriptions[diagramType] || diagramType;

    let userPrompt = '';
    
    if (isMermaid) {
      userPrompt = `Создай ${typeDescription} для следующего объекта/процесса:

${objectDescription}

ВАЖНО: Все названия узлов, классов, состояний и других элементов должны быть на русском языке. Используй русские названия для всех элементов (например: "Институт", "Студент", "Преподаватель", "Курс" и т.д.). Синтаксис Mermaid остается на английском (${mermaidDiagramType}, classDiagram, sequenceDiagram, etc.), но содержимое - на русском.

${diagramType === 'MindMapMermaid' ? 'ДЛЯ MERMAID MINDMAP: Используй правильный синтаксис Mermaid MindMap:\n- Начинай с "mindmap"\n- Используй отступы (2 пробела) для создания иерархии\n- Корневой узел можно обозначить как root((Название)) или просто как первый элемент' : ''}
${diagramType === 'SequenceMermaid' ? 'ДЛЯ MERMAID SEQUENCE: Используй правильный синтаксис sequenceDiagram:\n- Начинай с "sequenceDiagram"\n- Используй участников (participant) с русскими названиями\n- Используй стрелки (->, -->) для сообщений' : ''}
${diagramType === 'ClassMermaid' ? 'ДЛЯ MERMAID CLASS: Используй правильный синтаксис classDiagram:\n- Начинай с "classDiagram"\n- Определяй классы с русскими названиями\n- Используй отношения (-->, <|--, etc.)' : ''}
${diagramType === 'StateMermaid' ? 'ДЛЯ MERMAID STATE: Используй правильный синтаксис stateDiagram-v2:\n- Начинай с "stateDiagram-v2"\n- Определяй состояния с русскими названиями\n- Используй переходы (-->)' : ''}
${diagramType === 'ActivityMermaid' ? 'ДЛЯ MERMAID ACTIVITY: Используй правильный синтаксис flowchart:\n- Начинай с "flowchart TD" или "flowchart LR"\n- Используй узлы с русскими названиями\n- Используй стрелки (-->)' : ''}
${diagramType === 'ComponentMermaid' ? 'ДЛЯ MERMAID COMPONENT: Используй правильный синтаксис graph:\n- Начинай с "graph TD" или "graph LR"\n- Используй узлы с русскими названиями\n- Используй стрелки (-->)' : ''}
${diagramType === 'GanttMermaid' ? 'ДЛЯ MERMAID GANTT: Используй правильный синтаксис gantt:\n- Начинай с "gantt"\n- Определяй задачи с русскими названиями\n- Используй даты и длительности' : ''}
${diagramType === 'ERMermaid' ? 'ДЛЯ MERMAID ER: Используй правильный синтаксис erDiagram:\n- Начинай с "erDiagram"\n- Определяй сущности с русскими названиями\n- Используй отношения (||--||, }o--||, etc.)' : ''}`;

      if (context) {
        userPrompt += `\n\nДополнительный контекст из документов:\n${context.substring(0, 3000)}`;
      }

      userPrompt += `\n\nСгенерируй код Mermaid и глоссарий. Формат ответа:
\`\`\`mermaid
${mermaidDiagramType}
[код диаграммы с русскими названиями элементов]
\`\`\`

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
${diagramType === 'Timing' ? 'ДЛЯ TIMING: Используй синтаксис timing диаграммы: @startuml ... @enduml с clock, binary, analog сигналами. Пример: clock clk, binary "сигнал" as sig' : ''}
${diagramType === 'JSON' ? 'ДЛЯ JSON: Используй синтаксис @startjson ... @endjson. Внутри должен быть валидный JSON код. Пример: @startjson\n{\n  "ключ": "значение"\n}\n@endjson' : ''}
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

      // Извлекаем код в зависимости от типа диаграммы
      if (isMermaid) {
        // Извлекаем код Mermaid
        const mermaidMatch = responseText.match(/```mermaid\s*\n([\s\S]*?)\n```/i) ||
                           responseText.match(new RegExp(`${mermaidDiagramType}\\s*\\n([\\s\\S]*?)(?=\\n\`\`\`|$)`, 'i'));
        
        let mermaidCode = '';
        if (mermaidMatch) {
          mermaidCode = mermaidMatch[1].trim();
          
          // Убеждаемся, что код начинается с правильного типа диаграммы
          if (!mermaidCode.startsWith(mermaidDiagramType)) {
            mermaidCode = `${mermaidDiagramType}\n` + mermaidCode;
          }
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
          } else {
            mermaidCode = `${mermaidDiagramType}\n    ${objectDescription.split(' ')[0] || 'Элемент'}`;
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

