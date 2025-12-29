import { NextRequest, NextResponse } from 'next/server';

// Генерация краткого описания документов
// Использует простой алгоритм извлечения ключевых фраз
// В будущем можно заменить на вызов Ollama или другой LLM
export async function POST(request: NextRequest) {
  try {
    const { documents } = await request.json();

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: 'Документы не предоставлены' },
        { status: 400 }
      );
    }

    // Извлекаем ключевую информацию из каждого документа
    const summaries = documents.map((doc: { text: string; fileName: string }) => {
      const text = doc.text || '';
      const sentences = text.split(/[.!?]\s+/).filter(s => s.length > 20);
      const firstSentences = sentences.slice(0, 3).join('. ');
      
      // Извлекаем ключевые слова (слова длиннее 4 символов, встречающиеся часто)
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 4);
      
      const wordFreq: Record<string, number> = {};
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
      
      const keywords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);

      return {
        fileName: doc.fileName,
        summary: firstSentences || 'Документ загружен, но текст не извлечен',
        keywords,
        length: text.length,
      };
    });

    // Общее описание всех документов
    const totalLength = summaries.reduce((sum, s) => sum + s.length, 0);
    const allKeywords = Array.from(new Set(summaries.flatMap(s => s.keywords)))
      .slice(0, 10);

    const generalSummary = `Загружено ${documents.length} документов (${formatFileSize(totalLength)} текста). 
Основные темы: ${allKeywords.join(', ')}. 
Система готова отвечать на вопросы по содержимому документов.`;

    return NextResponse.json({
      success: true,
      generalSummary,
      documentSummaries: summaries,
    });
  } catch (error) {
    console.error('Ошибка при создании описания:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании описания документов' },
      { status: 500 }
    );
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' символов';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

