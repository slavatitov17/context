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

    // Формируем промпт для генерации PlantUML кода
    const systemPrompt = `Ты эксперт по созданию диаграмм в формате PlantUML. Твоя задача - создать корректный код PlantUML для указанного типа диаграммы.

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
      'Gantt': 'Диаграмма Ганта (Gantt Chart)',
      'MindMap': 'Интеллект-карта (Mind Map)',
      'Network': 'Сетевая диаграмма (Network Diagram)',
      'Archimate': 'ArchiMate диаграмма',
      'Timing': 'Диаграмма временных зависимостей (Timing Diagram)',
      'WBS': 'WBS диаграмма (Work Breakdown Structure)',
      'JSON': 'JSON диаграмма',
    };

    const typeDescription = diagramTypeDescriptions[diagramType] || diagramType;

    let userPrompt = `Создай ${typeDescription} для следующего объекта/процесса:

${objectDescription}

ВАЖНО: Все названия объектов, классов, методов, атрибутов и других элементов должны быть на русском языке. Используй русские названия для всех сущностей (например: "Институт", "Студент", "Преподаватель", "Курс" и т.д.). Синтаксис PlantUML остается на английском (class, interface, ->, etc.), но содержимое - на русском.

${diagramType === 'MindMap' ? 'ДЛЯ MINDMAP: Используй правильный синтаксис @startmindmap ... @endmindmap. Структура: * Центральная тема ** Подтема 1 *** Подподтема 1.1 ** Подтема 2. НЕ используй просто "mindmap" без @startmindmap/@endmindmap!' : ''}
${diagramType === 'Gantt' ? 'ДЛЯ GANTT: ОБЯЗАТЕЛЬНО используй синтаксис @startgantt ... @endgantt. В НАЧАЛЕ добавь projecttitle "Название проекта". Формат задач: [YYYY-MM-DD, YYYY-MM-DD] Название задачи. Пример: @startgantt\nprojecttitle "Проект"\n[2025-01-01, 2025-01-07] Задача 1\n@endgantt' : ''}
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

      // Извлекаем код PlantUML
      // Для разных типов диаграмм нужны разные теги
      const isMindMap = diagramType === 'MindMap';
      const isGantt = diagramType === 'Gantt';
      const isSalt = diagramType === 'Salt';
      const isDitaa = diagramType === 'Ditaa';
      
      const startTag = isMindMap ? '@startmindmap' : (isGantt ? '@startgantt' : (isSalt ? '@startsalt' : (isDitaa ? '@startditaa' : '@startuml')));
      const endTag = isMindMap ? '@endmindmap' : (isGantt ? '@endgantt' : (isSalt ? '@endsalt' : (isDitaa ? '@endditaa' : '@enduml')));
      
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
        plantUmlCode = plantUmlCode.replace(/@startgantt\s*/gi, '');
        plantUmlCode = plantUmlCode.replace(/@endgantt\s*/gi, '');
        plantUmlCode = plantUmlCode.replace(/@startjson\s*/gi, '');
        plantUmlCode = plantUmlCode.replace(/@endjson\s*/gi, '');
        plantUmlCode = plantUmlCode.replace(/mindmap\s*/gi, ''); // Удаляем просто "mindmap" если есть
        plantUmlCode = plantUmlCode.replace(/deployment\s+Diagram\s+as\s+\w+\s*/gi, ''); // Удаляем "deployment Diagram as ..."
        plantUmlCode = plantUmlCode.replace(/split\s*/gi, 'fork'); // Заменяем split на fork для Activity
        plantUmlCode = plantUmlCode.replace(/join\s*/gi, 'end fork'); // Заменяем join на end fork для Activity
        
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

