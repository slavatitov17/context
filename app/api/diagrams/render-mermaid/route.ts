// Создаем API-маршрут для рендеринга Mermaid диаграмм в SVG формат
import { NextRequest, NextResponse } from 'next/server';
import mermaid from 'mermaid';

// Инициализация Mermaid
mermaid.initialize({ 
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mermaidCode } = body;

    if (!mermaidCode || typeof mermaidCode !== 'string') {
      return NextResponse.json(
        { error: 'Код Mermaid не предоставлен' },
        { status: 400 }
      );
    }

    try {
      // Рендерим Mermaid диаграмму в SVG
      const { svg } = await mermaid.render('mermaid-diagram', mermaidCode);
      
      // Возвращаем SVG как строку
      return NextResponse.json({
        svg,
        success: true,
      });
    } catch (renderError) {
      console.error('Ошибка при рендеринге Mermaid:', renderError);
      return NextResponse.json(
        { 
          error: `Ошибка при рендеринге: ${renderError instanceof Error ? renderError.message : 'Неизвестная ошибка'}`,
          details: renderError instanceof Error ? renderError.stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ошибка при обработке запроса рендеринга Mermaid:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка при обработке запроса' },
      { status: 500 }
    );
  }
}

