import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

// Используем pdfjs-dist напрямую для лучшей совместимости с Vercel
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Сначала пробуем pdf-parse (более надежный для Node.js)
  try {
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;
    
    if (typeof pdfParse === 'function') {
      // Устанавливаем переменные окружения для pdfjs-dist (используется внутри pdf-parse)
      if (typeof process !== 'undefined') {
        process.env.CANVAS_PREBUILT = 'false';
      }
      
      const pdfData = await pdfParse(buffer);
      if (pdfData?.text?.trim()) {
        return pdfData.text;
      }
    }
  } catch (pdfParseError: any) {
    console.warn('pdf-parse не доступен, пробуем pdfjs-dist напрямую:', pdfParseError?.message || pdfParseError);
  }
  
  // Fallback на pdfjs-dist напрямую
  try {
    // Пробуем разные пути импорта для совместимости
    let pdfjs: any;
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjs = pdfjsLib;
    } catch {
      try {
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs = pdfjsLib;
      } catch {
        const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
        pdfjs = pdfjsLib;
      }
    }
    
    // Настройка для Node.js окружения
    if (typeof process !== 'undefined') {
      process.env.CANVAS_PREBUILT = 'false';
    }
    
    // Загружаем PDF документ
    const getDocument = pdfjs.getDocument || (pdfjs as any).default?.getDocument;
    if (!getDocument) {
      throw new Error('Не удалось найти getDocument в pdfjs-dist');
    }
    
    const loadingTask = getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      verbosity: 0, // Отключаем лишние логи
    });
    
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    const textContent: string[] = [];
    
    // Извлекаем текст со всех страниц
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textData = await page.getTextContent();
      
      // Объединяем текстовые элементы страницы
      const pageText = textData.items
        .map((item: any) => item.str || '')
        .join(' ');
      
      if (pageText.trim()) {
        textContent.push(pageText);
      }
    }
    
    const fullText = textContent.join('\n\n').trim();
    
    if (!fullText || fullText.length === 0) {
      throw new Error('Не удалось извлечь текст из PDF. Возможно, файл содержит только изображения.');
    }
    
    return fullText;
  } catch (error: any) {
    console.error('Ошибка при извлечении текста из PDF:', error);
    
    const errorMessage = error?.message || 'Неизвестная ошибка';
    if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
      throw new Error('PDF файл защищен паролем. Пожалуйста, загрузите незащищенный файл.');
    } else if (errorMessage.includes('corrupt') || errorMessage.includes('invalid')) {
      throw new Error('PDF файл поврежден или имеет неверный формат.');
    } else {
      throw new Error(`Ошибка при обработке PDF файла: ${errorMessage}`);
    }
  }
}

// Обработка документов и извлечение текста
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не предоставлен' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    let text = '';

    // Извлечение текста в зависимости от типа файла
    if (fileName.endsWith('.pdf')) {
      text = await extractTextFromPDF(buffer);
    } else if (fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (fileName.endsWith('.doc')) {
      // Для старых .doc файлов нужна дополнительная библиотека
      // Пока возвращаем ошибку
      return NextResponse.json(
        { error: 'Формат .doc не поддерживается. Используйте .docx' },
        { status: 400 }
      );
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.rtf') || fileName.endsWith('.odt')) {
      text = buffer.toString('utf-8');
    } else {
      return NextResponse.json(
        { error: 'Неподдерживаемый формат файла' },
        { status: 400 }
      );
    }

    // Разбиваем текст на чанки для лучшей обработки
    const chunks = splitTextIntoChunks(text, 1000); // 1000 символов на чанк

    return NextResponse.json({
      success: true,
      text,
      chunks,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error('Ошибка при обработке документа:', error);
    const errorMessage = error?.message || 'Ошибка при обработке документа';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Разбиение текста на чанки для векторного поиска
function splitTextIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]\s+/);
  
  let currentChunk = '';
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

