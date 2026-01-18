// Создаем API-маршрут для рендеринга PlantUML диаграмм в изображения через публичный сервер
import { NextRequest, NextResponse } from 'next/server';
import plantumlEncoder from 'plantuml-encoder';

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
      // Кодируем код PlantUML используя правильный алгоритм из библиотеки
      // PlantUML использует специальный алгоритм: UTF-8 -> Deflate -> специальное base64-подобное кодирование
      const encoded = plantumlEncoder.encode(plantUmlCode);
      
      // Формируем URL для получения изображения
      // Используем публичный сервер PlantUML
      const imageUrl = `https://www.plantuml.com/plantuml/png/${encoded}`;
      const svgUrl = `https://www.plantuml.com/plantuml/svg/${encoded}`;
      
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

