import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

// Используем pdfjs-dist напрямую для Node.js окружения
// Настройка для работы в серверном окружении без DOM
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Настройка окружения перед импортом
    if (typeof process !== 'undefined') {
      // Отключаем canvas и DOM зависимости
      process.env.CANVAS_PREBUILT = 'false';
      // Мокируем отсутствие DOM
      if (!(global as any).window) {
        (global as any).window = {} as any;
      }
      if (!(global as any).document) {
        (global as any).document = {} as any;
      }
    }
    
    // Импортируем pdfjs-dist
    // Пробуем разные варианты импорта
    let pdfjs: any;
    let getDocument: any;
    
    try {
      // Вариант 1: стандартный импорт
      const pdfjsModule = await import('pdfjs-dist');
      pdfjs = pdfjsModule;
      getDocument = (pdfjsModule as any).getDocument || (pdfjsModule as any).default?.getDocument;
    } catch (e1) {
      try {
        // Вариант 2: legacy build
        // @ts-ignore - pdfjs-dist/legacy может не иметь типов
        const pdfjsModule = await import('pdfjs-dist/legacy/build/pdf.mjs') as any;
        pdfjs = pdfjsModule;
        getDocument = pdfjsModule.getDocument || pdfjsModule.default?.getDocument;
      } catch (e2) {
        // Вариант 3: build версия
        // @ts-ignore - pdfjs-dist/build может не иметь типов
        const pdfjsModule = await import('pdfjs-dist/build/pdf.mjs') as any;
        pdfjs = pdfjsModule;
        getDocument = pdfjsModule.getDocument || pdfjsModule.default?.getDocument;
      }
    }
    
    if (!getDocument) {
      throw new Error('Не удалось загрузить pdfjs-dist');
    }
    
    // Загружаем PDF документ с минимальными зависимостями
    const loadingTask = getDocument({
      data: buffer,
      useSystemFonts: true,
      verbosity: 0,
      // Минимизируем зависимости
      disableFontFace: false,
      disableAutoFetch: false,
      disableStream: false,
      // Отключаем worker для Node.js
      useWorkerFetch: false,
      isEvalSupported: false,
    });
    
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    
    if (numPages === 0) {
      throw new Error('PDF файл не содержит страниц');
    }
    
    const textContent: string[] = [];
    
    // Извлекаем текст со всех страниц
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const textData = await page.getTextContent();
        
        // Извлекаем текст из items
        if (textData && textData.items && Array.isArray(textData.items)) {
          const pageText = textData.items
            .map((item: any) => {
              // Поддерживаем разные форматы данных
              if (typeof item === 'string') return item;
              if (item && typeof item === 'object') {
                return item.str || item.text || '';
              }
              return '';
            })
            .filter((text: string) => text && text.trim().length > 0)
            .join(' ');
          
          if (pageText.trim()) {
            textContent.push(pageText);
          }
        }
      } catch (pageError: any) {
        console.warn(`Ошибка при обработке страницы ${pageNum}:`, pageError?.message || pageError);
        // Продолжаем обработку других страниц
      }
    }
    
    const fullText = textContent.join('\n\n').trim();
    
    if (!fullText || fullText.length === 0) {
      throw new Error('Не удалось извлечь текст из PDF. Возможно, файл содержит только изображения.');
    }
    
    return fullText;
  } catch (error: any) {
    console.error('Ошибка при извлечении текста из PDF:', error);
    
    const errorMessage = error?.message || String(error) || 'Неизвестная ошибка';
    const errorString = String(errorMessage).toLowerCase();
    
    // Более информативные сообщения об ошибках
    if (errorString.includes('password') || errorString.includes('encrypted')) {
      throw new Error('PDF файл защищен паролем. Пожалуйста, загрузите незащищенный файл.');
    } else if (errorString.includes('corrupt') || errorString.includes('invalid') || errorString.includes('invalid pdf')) {
      throw new Error('PDF файл поврежден или имеет неверный формат.');
    } else if (errorString.includes('dommatrix') || errorString.includes('dom') || errorString.includes('window is not defined') || errorString.includes('document is not defined')) {
      // Это ошибка совместимости - используем более простой подход
      throw new Error('Ошибка совместимости с PDF библиотекой. Попробуйте конвертировать PDF в Word или другой формат.');
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

