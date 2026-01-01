import { NextRequest, NextResponse } from 'next/server';
import { deflateSync } from 'zlib';

// Функция для кодирования PlantUML кода в формат для PlantUML Server
// PlantUML использует специальный алгоритм: deflate -> base64 -> замена символов
function encodePlantUml(plantUmlCode: string): string {
  // Сжимаем код через deflate
  const compressed = deflateSync(plantUmlCode, { level: 9 });
  
  // Кодируем в base64
  const base64 = Buffer.from(compressed).toString('base64');
  
  // Заменяем символы согласно спецификации PlantUML
  const encoded = base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return encoded;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plantUmlCode } = body;

    if (!plantUmlCode || typeof plantUmlCode !== 'string') {
      return NextResponse.json(
        { error: 'Код PlantUML не предоставлен' },
        { status: 400 }
      );
    }

    try {
      // Кодируем код PlantUML
      const encoded = encodePlantUml(plantUmlCode);
      
      // Добавляем префикс ~1 для указания типа кодирования (HUFFMAN)
      // PlantUML сервер требует этот префикс для правильной обработки данных
      const encodedWithHeader = `~1${encoded}`;
      
      // Формируем URL для получения изображения
      // Используем публичный сервер PlantUML
      const imageUrl = `https://www.plantuml.com/plantuml/png/${encodedWithHeader}`;
      const svgUrl = `https://www.plantuml.com/plantuml/svg/${encodedWithHeader}`;
      
      return NextResponse.json({
        imageUrl,
        svgUrl,
      });
    } catch (encodeError) {
      console.error('Ошибка при кодировании PlantUML:', encodeError);
      return NextResponse.json(
        { error: `Ошибка при кодировании: ${encodeError instanceof Error ? encodeError.message : 'Неизвестная ошибка'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ошибка при рендеринге диаграммы:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка при обработке запроса' },
      { status: 500 }
    );
  }
}

