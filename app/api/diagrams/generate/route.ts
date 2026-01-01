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

Важно:
1. Генерируй только валидный код PlantUML, без дополнительных объяснений
2. Код должен начинаться с @startuml и заканчиваться @enduml
3. Используй правильный синтаксис для указанного типа диаграммы
4. Добавь комментарии на русском языке для лучшей читаемости
5. После кода диаграммы, добавь глоссарий в формате JSON массива объектов с полями "element" и "description"`;

    const diagramTypeDescriptions: Record<string, string> = {
      'UML': 'UML диаграмма классов (Class Diagram)',
      'ER': 'ER диаграмма (Entity-Relationship Diagram)',
      'Sequence': 'UML диаграмма последовательности (Sequence Diagram)',
      'Activity': 'UML диаграмма активности (Activity Diagram)',
      'Class': 'UML диаграмма классов (Class Diagram)',
    };

    const typeDescription = diagramTypeDescriptions[diagramType] || diagramType;

    let userPrompt = `Создай ${typeDescription} для следующего объекта/процесса:

${objectDescription}`;

    if (context) {
      userPrompt += `\n\nДополнительный контекст из документов:\n${context.substring(0, 3000)}`;
    }

    userPrompt += `\n\nСгенерируй код PlantUML и глоссарий. Формат ответа:
\`\`\`plantuml
@startuml
[код диаграммы]
@enduml
\`\`\`

\`\`\`json
[
  {"element": "Название элемента", "description": "Описание элемента"},
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

      const responseText = chatResponse.choices?.[0]?.message?.content || '';

      // Извлекаем код PlantUML
      const plantUmlMatch = responseText.match(/```plantuml\s*\n([\s\S]*?)\n```/i) || 
                           responseText.match(/@startuml\s*\n([\s\S]*?)@enduml/i);
      
      let plantUmlCode = '';
      if (plantUmlMatch) {
        plantUmlCode = plantUmlMatch[1].trim();
        // Убеждаемся, что код содержит @startuml и @enduml
        if (!plantUmlCode.includes('@startuml')) {
          plantUmlCode = '@startuml\n' + plantUmlCode;
        }
        if (!plantUmlCode.includes('@enduml')) {
          plantUmlCode = plantUmlCode + '\n@enduml';
        }
      } else {
        // Если не нашли в markdown, ищем напрямую
        const startIndex = responseText.indexOf('@startuml');
        const endIndex = responseText.indexOf('@enduml');
        if (startIndex !== -1 && endIndex !== -1) {
          plantUmlCode = responseText.substring(startIndex, endIndex + 8).trim();
        } else {
          // Fallback: создаем базовую диаграмму
          plantUmlCode = `@startuml
class ${objectDescription.split(' ')[0]} {
  + описание
}
@enduml`;
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

