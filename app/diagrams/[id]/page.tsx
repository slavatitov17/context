'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { auth, projects as projectsStorage, diagrams as diagramsStorage, type Project, type Diagram, type DiagramType } from '@/lib/storage';
import mermaid from 'mermaid';

// Инициализация Mermaid с кастомной темой для строгих цветов
mermaid.initialize({ 
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#ffffff',
    primaryTextColor: '#000000',
    primaryBorderColor: '#000000',
    lineColor: '#666666',
    secondaryColor: '#f5f5f5',
    tertiaryColor: '#e5e5e5',
    background: '#ffffff',
    mainBkg: '#ffffff',
    secondBkg: '#f5f5f5',
    tertiaryBkg: '#e5e5e5',
    textColor: '#000000',
    secondaryTextColor: '#333333',
    tertiaryTextColor: '#666666',
    secondaryBorderColor: '#666666',
    tertiaryBorderColor: '#999999',
    noteBkgColor: '#f5f5f5',
    noteTextColor: '#000000',
    noteBorderColor: '#666666',
    actorBorder: '#000000',
    actorBkg: '#ffffff',
    actorTextColor: '#000000',
    actorLineColor: '#666666',
    signalColor: '#000000',
    signalTextColor: '#000000',
    labelBoxBkgColor: '#ffffff',
    labelBoxBorderColor: '#000000',
    labelTextColor: '#000000',
    loopTextColor: '#000000',
    activationBorderColor: '#000000',
    activationBkgColor: '#f5f5f5',
    sequenceNumberColor: '#000000',
    sectionBkgColor: '#e5e5e5',
    altBkgColor: '#f5f5f5',
    clusterBkg: '#f5f5f5',
    clusterBorder: '#666666',
    defaultLinkColor: '#000000',
    titleColor: '#000000',
    edgeLabelBackground: '#ffffff',
    compositeBackground: '#ffffff',
    compositeTitleBackground: '#e5e5e5',
    compositeBorder: '#000000',
    compositeTitleColor: '#000000',
    cScale0: '#ffffff',
    cScale1: '#e5e5e5',
    cScale2: '#cccccc',
    pie1: '#ffffff',
    pie2: '#e5e5e5',
    pie3: '#cccccc',
    pie4: '#b3b3b3',
    pie5: '#999999',
    pie6: '#808080',
    pie7: '#666666',
    pieTitleTextSize: '16px',
    pieTitleTextColor: '#000000',
    pieSectionTextSize: '14px',
    pieSectionTextColor: '#000000',
    pieLegendTextSize: '14px',
    pieLegendTextColor: '#000000',
    pieStrokeColor: '#000000',
    pieStrokeWidth: '2px',
    pieOuterStrokeWidth: '2px',
    pieOuterStrokeColor: '#000000',
    pieOpacity: '1',
  },
  securityLevel: 'loose',
});

// Компонент для рендеринга Mermaid диаграммы
function MermaidDiagram({ code, index, onSvgReady }: { code: string; index: number; onSvgReady?: (svg: string) => void }) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [mermaidSvg, setMermaidSvg] = useState<string>('');
  const [mermaidError, setMermaidError] = useState<string>('');
  
  useEffect(() => {
    if (code) {
      const renderMermaid = async () => {
        try {
          const id = `mermaid-${index}-${Date.now()}`;
          const { svg } = await mermaid.render(id, code);
          setMermaidSvg(svg);
          setMermaidError('');
          if (onSvgReady) {
            onSvgReady(svg);
          }
        } catch (error) {
          console.error('Ошибка рендеринга Mermaid:', error);
          setMermaidError(error instanceof Error ? error.message : 'Ошибка рендеринга');
        }
      };
      renderMermaid();
    }
  }, [code, index, onSvgReady]);

  // Применяем строгие цвета к SVG после рендеринга
  useEffect(() => {
    if (mermaidSvg && mermaidRef.current) {
      const svgElement = mermaidRef.current.querySelector('svg');
      if (svgElement) {
        // Применяем стили для строгих цветов
        svgElement.style.setProperty('color', '#000000');
        // Находим все элементы и применяем цвета
        const allElements = svgElement.querySelectorAll('*');
        allElements.forEach((el: Element) => {
          const htmlEl = el as HTMLElement;
          // Заменяем цветные заливки на серые оттенки
          const fill = htmlEl.getAttribute('fill');
          if (fill && fill !== 'none' && fill !== 'transparent' && fill !== '#ffffff' && fill !== '#f5f5f5' && fill !== '#e5e5e5' && fill !== '#cccccc' && fill !== '#000000') {
            // Определяем цвет и заменяем на серый оттенок
            const fillLower = fill.toLowerCase();
            if (fillLower.includes('yellow') || fillLower.match(/^#(ff|ffff)/)) {
              htmlEl.setAttribute('fill', '#e5e5e5');
            } else if (fillLower.includes('green') || fillLower.match(/^#(00|0a)/)) {
              htmlEl.setAttribute('fill', '#f5f5f5');
            } else if (fillLower.includes('purple') || fillLower.includes('violet') || fillLower.match(/^#(ff00ff|f0f)/)) {
              htmlEl.setAttribute('fill', '#cccccc');
            } else if (fillLower.includes('blue') || fillLower.match(/^#(00f|0000ff)/)) {
              htmlEl.setAttribute('fill', '#e5e5e5');
            } else if (fill && fill !== '#000000') {
              htmlEl.setAttribute('fill', '#e5e5e5');
            }
          }
          // Заменяем цветные обводки на черные/серые
          const stroke = htmlEl.getAttribute('stroke');
          if (stroke && stroke !== 'none' && stroke !== 'transparent' && stroke !== '#000000' && stroke !== '#666666' && stroke !== '#999999') {
            const strokeLower = stroke.toLowerCase();
            if (strokeLower !== '#ffffff' && strokeLower !== '#f5f5f5' && strokeLower !== '#e5e5e5') {
              htmlEl.setAttribute('stroke', '#000000');
            }
          }
        });
      }
    }
  }, [mermaidSvg]);
  
  if (mermaidError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium mb-2">Ошибка рендеринга:</p>
        <p className="text-sm">{mermaidError}</p>
        <div className="mt-4 bg-gray-900 text-gray-100 font-mono text-xs p-4 rounded overflow-x-auto">
          <pre className="whitespace-pre-wrap">{code}</pre>
        </div>
      </div>
    );
  }
  
  if (mermaidSvg) {
    return (
      <div ref={mermaidRef} className="bg-gray-50 border border-gray-200 rounded-lg p-4" dangerouslySetInnerHTML={{ __html: mermaidSvg }} />
    );
  }
  
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-center">
      <div className="text-gray-500">Рендеринг диаграммы...</div>
    </div>
  );
}

// Компонент модального окна поддержки
function SupportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<Array<{ id: string; file: File; preview?: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setMessage('');
      setAttachedFiles([]);
    }
  }, [isOpen]);

  // Обработка Ctrl+V для вставки изображений из буфера обмена
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const id = `file-${Date.now()}-${Math.random()}`;
              setAttachedFiles(prev => [...prev, {
                id,
                file: new File([file], `screenshot-${Date.now()}.png`, { type: file.type }),
                preview: e.target?.result as string
              }]);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [isOpen]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const id = `file-${Date.now()}-${Math.random()}`;
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachedFiles(prev => [...prev, {
            id,
            file,
            preview: e.target?.result as string
          }]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachedFiles(prev => [...prev, { id, file }]);
      }
    });
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filesInfo = attachedFiles.map(f => f.file.name).join(', ');
    alert(`Сообщение отправлено (заглушка)\nEmail: ${email}\nСообщение: ${message}${filesInfo ? `\nФайлы: ${filesInfo}` : ''}`);
    setEmail('');
    setMessage('');
    setAttachedFiles([]);
    onClose();
  };

  const isFormValid = email.trim() !== '' && message.trim() !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Блюр фон */}
      <div 
        className="absolute inset-0 bg-white/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Модальное окно */}
      <div className="relative bg-white border border-gray-200 rounded-xl p-6 max-w-lg w-full shadow-xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium text-gray-900">Обратиться в поддержку</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-900 font-medium mb-2">
              Ваша электронная почта
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@mail.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-900 font-medium mb-2">
              Ваше сообщение
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Опишите вашу проблему или вопрос..."
            />
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-500 hover:text-gray-700 text-base font-medium flex items-center hover:text-blue-600 transition-colors"
              >
                <i className="fas fa-paperclip mr-2 text-lg"></i>
                Прикрепить файл
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
            
            {/* Список прикрепленных файлов */}
            {attachedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachedFiles.map((fileData) => (
                  <div key={fileData.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    {fileData.preview ? (
                      <img src={fileData.preview} alt={fileData.file.name} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <i className="fas fa-file text-gray-400"></i>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{fileData.file.name}</div>
                      <div className="text-xs text-gray-500">{formatFileSize(fileData.file.size)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(fileData.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              isFormValid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Отправить
          </button>
        </form>
      </div>
    </div>
  );
}

// Компонент для отображения унифицированного сообщения с двумя форматами (PlantUML и Mermaid)
function DualFormatMessage({
  msg,
  index,
  dateStr,
  timeStr,
  viewModes,
  setViewModes,
  formatSelectors,
  setFormatSelectors,
  generationTime,
  onOpenSupport
}: {
  msg: { plantUmlCode?: string; mermaidCode?: string; plantUmlGlossary?: Array<{ element: string; description: string }>; mermaidGlossary?: Array<{ element: string; description: string }>; diagramImageUrl?: string };
  index: number;
  dateStr: string;
  timeStr: string;
  viewModes: Map<number, 'diagram' | 'code'>;
  setViewModes: (modes: Map<number, 'diagram' | 'code'>) => void;
  formatSelectors: Map<number, 'plantuml' | 'mermaid'>;
  setFormatSelectors: (selectors: Map<number, 'plantuml' | 'mermaid'>) => void;
  generationTime?: number;
  onOpenSupport: () => void;
}) {
  const [mermaidSvg, setMermaidSvg] = useState<string>('');
  const currentViewMode = viewModes.get(index) || 'diagram';
  const currentFormat = formatSelectors.get(index) || 'mermaid';
  
  // Функция для скачивания PNG для Mermaid
  const downloadMermaidPNG = async () => {
    if (mermaidSvg) {
      try {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(mermaidSvg, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;
        const scale = 3;
        let svgWidth = 800;
        let svgHeight = 600;
        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
          const parts = viewBox.split(/\s+/);
          if (parts.length >= 4) {
            svgWidth = parseFloat(parts[2]) || 800;
            svgHeight = parseFloat(parts[3]) || 600;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = svgWidth * scale;
        canvas.height = svgHeight * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Не удалось получить контекст canvas');
        ctx.scale(scale, scale);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, svgWidth, svgHeight);
        svgElement.setAttribute('width', svgWidth.toString());
        svgElement.setAttribute('height', svgHeight.toString());
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            try {
              ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
              canvas.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `mermaid-diagram-${index}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  resolve();
                } else {
                  reject(new Error('Не удалось создать PNG blob'));
                }
              }, 'image/png');
            } catch (error) {
              reject(error);
            }
          };
          img.onerror = () => reject(new Error('Ошибка загрузки SVG изображения'));
          img.src = svgDataUrl;
        });
      } catch (error) {
        console.error('Ошибка при создании PNG:', error);
        alert(`Не удалось создать PNG файл: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      }
    }
  };

  // Функция для скачивания PNG для PlantUML
  const downloadPlantUmlPNG = () => {
    if (msg.diagramImageUrl) {
      const a = document.createElement('a');
      a.href = msg.diagramImageUrl;
      a.download = `plantuml-diagram-${index}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const currentCode = currentFormat === 'plantuml' ? msg.plantUmlCode : msg.mermaidCode;
  const currentGlossary = currentFormat === 'plantuml' ? msg.plantUmlGlossary : msg.mermaidGlossary;

  return (
    <div className="flex flex-col items-start">
      <div className="text-base text-gray-500 mb-1 px-1">
        {dateStr} {timeStr}
      </div>
      <div className="max-w-full w-full">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {/* Верхняя панель: таймер и кнопка слева, свитчер по центру, кнопки справа */}
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            {/* Левая часть: таймер и кнопка "Сообщить об ошибке" */}
            <div className="flex items-center gap-3">
              {generationTime !== undefined && (
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-mono font-medium text-gray-700">
                    {Math.floor(generationTime / 60)}:{(generationTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              <button
                onClick={onOpenSupport}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Сообщить об ошибке
              </button>
            </div>

            {/* Свитчер Диаграмма/Код (по центру) */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 mx-auto">
              <button
                onClick={() => {
                  const newModes = new Map(viewModes);
                  newModes.set(index, 'diagram');
                  setViewModes(newModes);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  currentViewMode === 'diagram'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Диаграмма
              </button>
              <button
                onClick={() => {
                  const newModes = new Map(viewModes);
                  newModes.set(index, 'code');
                  setViewModes(newModes);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  currentViewMode === 'code'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Код
              </button>
            </div>

            {/* Кнопки действий (справа) */}
            <div className="flex items-center gap-4">
              {/* Выпадающий список формата */}
              <div className="relative">
                <select
                  value={currentFormat}
                  onChange={(e) => {
                    const newSelectors = new Map(formatSelectors);
                    newSelectors.set(index, e.target.value as 'plantuml' | 'mermaid');
                    setFormatSelectors(newSelectors);
                  }}
                  className="border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px] appearance-none pr-10 bg-white"
                >
                  <option value="mermaid">Mermaid</option>
                  <option value="plantuml">PlantUML</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              <div className="flex space-x-2">
                {currentFormat === 'mermaid' && mermaidSvg && (
                  <button
                    onClick={downloadMermaidPNG}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Скачать PNG
                  </button>
                )}
                {currentFormat === 'plantuml' && msg.diagramImageUrl && (
                  <button
                    onClick={downloadPlantUmlPNG}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Скачать PNG
                  </button>
                )}
                <button
                  onClick={() => {
                    if (currentCode) {
                      navigator.clipboard.writeText(currentCode);
                      alert('Код скопирован в буфер обмена');
                    }
                  }}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Скопировать код
                </button>
              </div>
            </div>
          </div>

          {/* Область диаграммы/кода */}
          {currentViewMode === 'diagram' && (
            <>
              {currentFormat === 'mermaid' && msg.mermaidCode && (
                <MermaidDiagram 
                  code={msg.mermaidCode || ''} 
                  index={index}
                  onSvgReady={setMermaidSvg}
                />
              )}
              {currentFormat === 'plantuml' && msg.diagramImageUrl && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <img
                    src={msg.diagramImageUrl}
                    alt="PlantUML диаграмма"
                    className="max-w-full h-auto mx-auto"
                  />
                </div>
              )}
            </>
          )}
          {currentViewMode === 'code' && currentCode && (
            <div className="bg-gray-900 text-gray-100 font-mono text-xs p-4 rounded overflow-x-auto">
              <pre className="whitespace-pre-wrap">{currentCode}</pre>
            </div>
          )}

          {/* Глоссарий (внизу, в том же сообщении) */}
          {currentGlossary && currentGlossary.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-lg mb-4">Глоссарий элементов диаграммы</h4>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-900">Элемент</th>
                    <th className="text-left py-2 font-medium text-gray-900">Описание</th>
                  </tr>
                </thead>
                <tbody>
                  {currentGlossary.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900 font-medium">{item.element}</td>
                      <td className="py-3 text-gray-600">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Компонент для отображения Mermaid сообщения
function MermaidMessage({ 
  msg, 
  index, 
  dateStr, 
  timeStr, 
  viewModes, 
  setViewModes,
  generationTime,
  onOpenSupport
}: { 
  msg: { mermaidCode?: string; glossary?: Array<{ element: string; description: string }> }; 
  index: number; 
  dateStr: string; 
  timeStr: string;
  viewModes: Map<number, 'diagram' | 'code'>;
  setViewModes: (modes: Map<number, 'diagram' | 'code'>) => void;
  generationTime?: number;
  onOpenSupport: () => void;
}) {
  const [mermaidSvg, setMermaidSvg] = useState<string>('');
  const currentViewMode = viewModes.get(index) || 'diagram';
  
  // Функция для скачивания PNG
  const downloadPNG = async () => {
    if (mermaidSvg) {
      try {
        // Создаем временный элемент для парсинга SVG
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(mermaidSvg, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;
        
        // Коэффициент масштабирования для высокого разрешения (3x для четкости)
        const scale = 3;
        
        // Получаем размеры SVG из viewBox (это более надежно)
        let svgWidth = 800;
        let svgHeight = 600;
        
        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
          const parts = viewBox.split(/\s+/);
          if (parts.length >= 4) {
            svgWidth = parseFloat(parts[2]) || 800;
            svgHeight = parseFloat(parts[3]) || 600;
          }
        } else {
          // Если нет viewBox, пытаемся получить из width и height
          const widthAttr = svgElement.getAttribute('width');
          const heightAttr = svgElement.getAttribute('height');
          if (widthAttr && heightAttr) {
            svgWidth = parseFloat(widthAttr.replace('px', '')) || 800;
            svgHeight = parseFloat(heightAttr.replace('px', '')) || 600;
          }
        }
        
        // Создаем canvas с увеличенным разрешением
        const canvas = document.createElement('canvas');
        canvas.width = svgWidth * scale;
        canvas.height = svgHeight * scale;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Не удалось получить контекст canvas');
        }
        
        // Масштабируем контекст для высокого разрешения
        ctx.scale(scale, scale);
        
        // Заполняем белым фоном
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, svgWidth, svgHeight);
        
        // Убеждаемся, что SVG имеет правильные размеры
        svgElement.setAttribute('width', svgWidth.toString());
        svgElement.setAttribute('height', svgHeight.toString());
        
        // Создаем data URL из SVG (это избегает проблемы с CORS)
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
        
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Важно для избежания tainted canvas
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            try {
              // Рисуем изображение на canvas с правильными размерами
              ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
              
              // Конвертируем в PNG и скачиваем
              canvas.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `mermaid-diagram-${index}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  resolve();
                } else {
                  reject(new Error('Не удалось создать PNG blob'));
                }
              }, 'image/png');
            } catch (error) {
              reject(error);
            }
          };
          
          img.onerror = () => {
            reject(new Error('Ошибка загрузки SVG изображения'));
          };
          
          // Используем data URL вместо blob URL
          img.src = svgDataUrl;
        });
      } catch (error) {
        console.error('Ошибка при создании PNG:', error);
        alert(`Не удалось создать PNG файл: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      }
    }
  };
  
  return (
    <div className="flex flex-col items-start">
      <div className="text-base text-gray-500 mb-1 px-1">
        {dateStr} {timeStr}
      </div>
      <div className="max-w-full w-full">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            {/* Левая часть: таймер и кнопка "Сообщить об ошибке" */}
            <div className="flex items-center gap-3">
              {generationTime !== undefined && (
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-mono font-medium text-gray-700">
                    {Math.floor(generationTime / 60)}:{(generationTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              <button
                onClick={onOpenSupport}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Сообщить об ошибке
              </button>
            </div>

            {/* Свитчер Диаграмма/Код (по центру) */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 mx-auto">
              <button
                onClick={() => {
                  const newModes = new Map(viewModes);
                  newModes.set(index, 'diagram');
                  setViewModes(newModes);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  currentViewMode === 'diagram'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Диаграмма
              </button>
              <button
                onClick={() => {
                  const newModes = new Map(viewModes);
                  newModes.set(index, 'code');
                  setViewModes(newModes);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  currentViewMode === 'code'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Код
              </button>
            </div>

            {/* Кнопки действий (справа) */}
            <div className="flex space-x-2">
              {mermaidSvg && (
                <button
                  onClick={downloadPNG}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Скачать PNG
                </button>
              )}
              <button
                onClick={() => {
                  if (msg.mermaidCode) {
                    navigator.clipboard.writeText(msg.mermaidCode);
                    alert('Код скопирован в буфер обмена');
                  }
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Скопировать код
              </button>
            </div>
          </div>
          {/* Показываем диаграмму или код в зависимости от выбранного режима */}
          {currentViewMode === 'diagram' && (
            <MermaidDiagram 
              code={msg.mermaidCode || ''} 
              index={index}
              onSvgReady={setMermaidSvg}
            />
          )}
          {currentViewMode === 'code' && (
            <div className="bg-gray-900 text-gray-100 font-mono text-xs p-4 rounded overflow-x-auto">
              <pre className="whitespace-pre-wrap">{msg.mermaidCode}</pre>
            </div>
          )}

          {/* Глоссарий (внизу, в том же сообщении) */}
          {msg.glossary && msg.glossary.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-lg mb-4">Глоссарий элементов диаграммы</h4>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-900">Элемент</th>
                    <th className="text-left py-2 font-medium text-gray-900">Описание</th>
                  </tr>
                </thead>
                <tbody>
                  {msg.glossary.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900 font-medium">{item.element}</td>
                      <td className="py-3 text-gray-600">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  progress: number;
}

export default function DiagramDetailPage({ params }: { params: { id: string } }) {
  const routeParams = useParams();
  const diagramId = routeParams?.id as string;
  const [diagramData, setDiagramData] = useState<Diagram | null>(null);
  const [selectedOption, setSelectedOption] = useState<'projects' | 'scratch' | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedProjectData, setSelectedProjectData] = useState<Project | null>(null);
  const [diagramType, setDiagramType] = useState<DiagramType | null>(null);
  const [showDiagram, setShowDiagram] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; type?: 'diagram' | 'table' | 'code' | 'mermaid' | 'mindmap2' | 'dualformat'; plantUmlCode?: string; mermaidCode?: string; diagramImageUrl?: string; glossary?: Array<{ element: string; description: string }>; plantUmlGlossary?: Array<{ element: string; description: string }>; mermaidGlossary?: Array<{ element: string; description: string }>; timestamp?: Date; generationTime?: number }>>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'processing' | 'generating' | 'creating'>('processing');
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [viewModes, setViewModes] = useState<Map<number, 'diagram' | 'code'>>(new Map());
  const [formatSelectors, setFormatSelectors] = useState<Map<number, 'plantuml' | 'mermaid'>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  
  // Состояния для поиска, фильтров и сортировки типов диаграмм
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStandard, setSelectedStandard] = useState<string>('Все');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('Все');
  const [selectedTag, setSelectedTag] = useState<string>('Все');
  const [sortBy, setSortBy] = useState<'alphabet' | 'popularity'>('alphabet');

  // Загрузка диаграммы
  useEffect(() => {
    const loadDiagram = () => {
      if (!diagramId) return;

      try {
        setLoading(true);
        
        const currentUser = auth.getCurrentUser();
        if (!currentUser) {
          setLoading(false);
          return;
        }

        // Загружаем диаграмму
        const diagram = diagramsStorage.getById(diagramId, currentUser.id);
        
        if (!diagram) {
          setLoading(false);
          return;
        }

        setDiagramData(diagram);

        // Загружаем проекты
        loadProjects(currentUser.id);

        // Восстанавливаем состояние диаграммы
        if (diagram.selectedOption) {
          setSelectedOption(diagram.selectedOption);
        }
        
        if (diagram.diagramType) {
          setDiagramType(diagram.diagramType);
        }
        
        if (diagram.selectedProject) {
          setSelectedProject(diagram.selectedProject);
          
          // Загружаем данные проекта
          const projectData = projectsStorage.getById(diagram.selectedProject, currentUser.id);
          if (projectData) {
            setSelectedProjectData(projectData);
            
            // Загружаем файлы из проекта
            if (projectData.files && Array.isArray(projectData.files) && projectData.files.length > 0) {
              setUploadedFiles(projectData.files.map((file: any) => ({
                id: file.id || `file-${Date.now()}`,
                name: file.name || 'Неизвестный файл',
                size: file.size || 0,
                status: 'success' as const,
                progress: 100,
              })));
            }
          }
        }

        // Загружаем файлы диаграммы (если есть)
        if (diagram.files && Array.isArray(diagram.files) && diagram.files.length > 0) {
          setUploadedFiles(prev => {
            const existingIds = new Set(prev.map(f => f.id));
            const newFiles = diagram.files!.map((file: any) => ({
              id: file.id || `file-${Date.now()}`,
              name: file.name || 'Неизвестный файл',
              size: file.size || 0,
              status: 'success' as const,
              progress: 100,
            })).filter(f => !existingIds.has(f.id));
            return [...prev, ...newFiles];
          });
        }

        // Загружаем сообщения
        if (diagram.messages && Array.isArray(diagram.messages) && diagram.messages.length > 0) {
          setMessages(diagram.messages.map((msg: any) => {
            // Если это Mermaid диаграмма и есть plantUmlCode, конвертируем в mermaidCode
            // Удалена проверка на MindMapMermaid, так как этот тип больше не используется
            if (false && msg.plantUmlCode && !msg.mermaidCode) {
              return {
                text: msg.text || '',
                isUser: msg.isUser || false,
                type: 'mermaid' as const,
                mermaidCode: msg.plantUmlCode,
                glossary: msg.glossary,
                timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
              };
            }
            return {
              text: msg.text || '',
              isUser: msg.isUser || false,
              type: msg.type,
              plantUmlCode: msg.plantUmlCode,
              mermaidCode: msg.mermaidCode,
              diagramImageUrl: msg.diagramImageUrl,
              glossary: msg.glossary,
              plantUmlGlossary: msg.plantUmlGlossary,
              mermaidGlossary: msg.mermaidGlossary,
              generationTime: msg.generationTime,
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            };
          }));
        } else if (diagram.selectedOption === 'scratch') {
          // Если создание с нуля и нет сообщений, показываем приветственное
          setMessages([{
            text: "Опишите предметную область и конкретный объект, диаграмму которого нужно будет построить",
            isUser: false,
            timestamp: new Date()
          }]);
        } else if (diagram.selectedProject) {
          // Если выбран проект и нет сообщений, показываем приветственное
          const projectData = projectsStorage.getById(diagram.selectedProject, currentUser.id);
          if (projectData && projectData.files && Array.isArray(projectData.files) && projectData.files.length > 0) {
            const filesList = projectData.files.map((file: any) => {
              const sizeKB = Math.round((file.size || 0) / 1024);
              return `${file.name || 'Неизвестный файл'} (${sizeKB} KB)`;
            }).join(', ');
            setMessages([{
              text: `Обработаны документы: ${filesList}. Теперь можно выбрать объект, по которому будет построена диаграмма.`,
              isUser: false,
              timestamp: new Date()
            }]);
          } else {
            setMessages([{
              text: "Теперь можно выбрать объект, по которому будет построена диаграмма.",
              isUser: false,
              timestamp: new Date()
            }]);
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке диаграммы:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDiagram();
  }, [diagramId]);

  useEffect(() => {
    const checkUser = () => {
      const currentUser = auth.getCurrentUser();
      if (currentUser) {
        loadProjects(currentUser.id);
      }
    };

    checkUser();
  }, []);

  const loadProjects = (userId: string) => {
    try {
      setLoading(true);
      const userProjects = projectsStorage.getAll(userId);
      // Сортируем по дате создания (новые первые)
      userProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setProjects(userProjects);
    } catch (error) {
      console.error('Ошибка при загрузке проектов:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Заглушка для Mermaid диаграммы
  const mermaidCode = `graph TD
    A[Основной объект] --> B[Подобъект 1]
    A --> C[Подобъект 2]
    B --> D[Элемент 1.1]
    B --> E[Элемент 1.2]
    C --> F[Элемент 2.1]
    C --> G[Элемент 2.2]`;

  // Автоматическое сохранение изменений
  const saveDiagram = useCallback((updates: Partial<Diagram>) => {
    if (!diagramId || !diagramData) return;

    const currentUser = auth.getCurrentUser();
    if (!currentUser) return;

    try {
      const updated = diagramsStorage.update(diagramId, currentUser.id, updates);
      if (updated) {
        setDiagramData(updated);
      }
    } catch (error) {
      console.error('Ошибка при сохранении диаграммы:', error);
    }
  }, [diagramId, diagramData]);

  // Сохранение файлов
  useEffect(() => {
    if (uploadedFiles.length > 0 && !loading && diagramData) {
      const timer = setTimeout(() => {
        const filesData = uploadedFiles.map(file => ({
          id: file.id,
          name: file.name,
          size: file.size,
        }));
        saveDiagram({ 
          files: filesData as any,
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [uploadedFiles, loading, diagramData, saveDiagram]);

        // Сохранение сообщений
  useEffect(() => {
    if (messages.length > 0 && !loading && diagramData) {
      const timer = setTimeout(() => {
        const messagesData = messages.map(msg => ({
          text: msg.text,
          isUser: msg.isUser,
          type: msg.type,
          plantUmlCode: msg.plantUmlCode,
          diagramImageUrl: msg.diagramImageUrl,
          glossary: msg.glossary,
          timestamp: msg.timestamp || new Date(),
        }));
        saveDiagram({ messages: messagesData as any });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages, loading, diagramData, saveDiagram]);

  const handleDiagramTypeSelect = (type: DiagramType) => {
    setDiagramType(type);
    
    const currentUser = auth.getCurrentUser();
    if (currentUser && diagramId) {
      saveDiagram({ diagramType: type });
    }
  };

  const handleOptionSelect = (option: 'projects' | 'scratch') => {
    setSelectedOption(option);
    
    const currentUser = auth.getCurrentUser();
    if (currentUser && diagramId) {
      saveDiagram({ selectedOption: option });
    }
    
    if (option === 'scratch') {
      // Для создания с нуля сразу переходим в чат
      setMessages([{
        text: "Опишите предметную область и конкретный объект, диаграмму которого нужно будет построить",
        isUser: false,
        timestamp: new Date()
      }]);
      setUploadedFiles([]);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    
    const currentUser = auth.getCurrentUser();
    if (currentUser && diagramId) {
      saveDiagram({ selectedProject: projectId });
    }
    
    // Загружаем данные проекта
    if (currentUser) {
      const projectData = projectsStorage.getById(projectId, currentUser.id);
      if (projectData) {
        setSelectedProjectData(projectData);
        
        // Загружаем файлы из проекта
        if (projectData.files && Array.isArray(projectData.files) && projectData.files.length > 0) {
          setUploadedFiles(projectData.files.map((file: any) => ({
            id: file.id || `file-${Date.now()}`,
            name: file.name || 'Неизвестный файл',
            size: file.size || 0,
            status: 'success' as const,
            progress: 100,
          })));
          
          // Формируем сообщение со списком документов
          const filesList = projectData.files.map((file: any) => {
            const sizeKB = Math.round((file.size || 0) / 1024);
            return `${file.name || 'Неизвестный файл'} (${sizeKB} KB)`;
          }).join(', ');
          
          setMessages([{
            text: `Обработаны документы: ${filesList}. Теперь можно выбрать объект, по которому будет построена диаграмма.`,
            isUser: false,
            timestamp: new Date()
          }]);
        } else {
          setUploadedFiles([]);
          setMessages([{
            text: "Теперь можно выбрать объект, по которому будет построена диаграмма.",
            isUser: false,
            timestamp: new Date()
          }]);
        }
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      'txt': 'fa-file-alt',
      'csv': 'fa-file-csv',
      'md': 'fa-file-alt',
      'markdown': 'fa-file-alt',
      'pdf': 'fa-file-pdf',
      'docx': 'fa-file-word',
      'xlsx': 'fa-file-excel',
      'xls': 'fa-file-excel',
      'xlsm': 'fa-file-excel',
    };
    return iconMap[ext || ''] || 'fa-file';
  };

  // Функция для анимации прогресс-бара
  const animateProgress = useCallback((fileId: string, startProgress: number, targetProgress: number, onComplete?: () => void) => {
    let currentProgress = startProgress;
    const interval = setInterval(() => {
      currentProgress += 2; // Увеличиваем на 2% за раз для плавной анимации
      
      if (currentProgress >= targetProgress) {
        currentProgress = targetProgress;
        clearInterval(interval);
        if (onComplete) {
          onComplete();
        }
      }
      
      setUploadedFiles(prev => prev.map(f => {
        if (f.id === fileId) {
          return { ...f, progress: currentProgress };
        }
        return f;
      }));
    }, 50); // Обновляем каждые 50мс для плавной анимации
    
    return interval;
  }, []);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newFiles: UploadedFile[] = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      status: 'uploading' as const,
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Обрабатываем каждый файл через API
    const processedDocuments: any[] = [];
    const progressIntervals = new Map<string, NodeJS.Timeout>();
    
    for (let i = 0; i < newFiles.length; i++) {
      const fileItem = newFiles[i];
      const file = Array.from(files)[i];
      
      // Проверяем формат файла
      const fileName = file.name.toLowerCase();
      const extension = fileName.substring(fileName.lastIndexOf('.'));
      const supportedExtensions = ['.txt', '.md', '.markdown', '.pdf', '.docx', '.xlsx', '.xls', '.xlsm', '.csv'];
      
      if (!supportedExtensions.includes(extension)) {
        // Для неподдерживаемых файлов сразу показываем ошибку
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'error' as const, progress: 100 } : f
        ));
        continue;
      }

      // Запускаем анимацию прогресса от 0 до 90% (будет продолжаться во время загрузки)
      const interval = animateProgress(fileItem.id, 0, 90);
      progressIntervals.set(fileItem.id, interval);

      try {
        // Отправляем файл на обработку
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/documents/process', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Ошибка обработки файла: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Останавливаем предыдущую анимацию
        const currentInterval = progressIntervals.get(fileItem.id);
        if (currentInterval) {
          clearInterval(currentInterval);
          progressIntervals.delete(fileItem.id);
        }
        
        // Получаем текущий прогресс из состояния через функциональное обновление
        setUploadedFiles(prevFiles => {
          const currentFile = prevFiles.find(f => f.id === fileItem.id);
          const currentProgress = currentFile?.progress || 90;
          
          // Запускаем анимацию от текущего значения до 100%
          const newInterval = animateProgress(fileItem.id, currentProgress, 100, () => {
            // После достижения 100% показываем галочку
            setUploadedFiles(prev => prev.map(f => 
              f.id === fileItem.id ? { ...f, status: 'success' as const, progress: 100 } : f
            ));
          });
          progressIntervals.set(fileItem.id, newInterval);
          
          return prevFiles;
        });

        // Сохраняем обработанный документ
        processedDocuments.push({
          fileName: data.fileName,
          text: data.text,
          chunks: data.chunks,
        });
      } catch (error) {
        console.error(`Ошибка при обработке файла ${file.name}:`, error);
        // Останавливаем анимацию и показываем ошибку
        const currentInterval = progressIntervals.get(fileItem.id);
        if (currentInterval) {
          clearInterval(currentInterval);
          progressIntervals.delete(fileItem.id);
        }
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'error' as const, progress: 100 } : f
        ));
      }
    }

    // Сохраняем файлы в диаграмму
    if (newFiles.length > 0 && diagramId) {
      const currentFiles = uploadedFiles.filter(f => f.status === 'success');
      const allFiles = [...currentFiles, ...newFiles.filter(f => f.status === 'success')];
      const filesData = allFiles.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
      }));
      
      const currentUser = auth.getCurrentUser();
      if (currentUser) {
        saveDiagram({ files: filesData as any });
      }
    }

    // Вычисляем общий размер файлов в КБ
    const totalSizeBytes = newFiles.reduce((sum, file) => sum + file.size, 0);
    const totalSizeKB = Math.round(totalSizeBytes / 1024);

    // Добавляем сообщение о загрузке документов
    if (processedDocuments.length > 0) {
      setMessages(prev => [...prev, {
        text: `Загружено и обработано документов: ${processedDocuments.length} из ${newFiles.length} (${totalSizeKB} КБ)`,
        isUser: false,
        timestamp: new Date(),
      }]);
    }
    
    setIsProcessing(false);
  }, [animateProgress, diagramId, uploadedFiles, saveDiagram]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Управление этапами загрузки и таймером
  useEffect(() => {
    if (!isProcessing) {
      setLoadingStage('processing');
      setLoadingStartTime(null);
      setElapsedSeconds(0);
      setLoadingMessages([]);
      return;
    }

    // Запускаем таймер
    const startTime = Date.now();
    setLoadingStartTime(startTime);
    setElapsedSeconds(0);
    
    // Список статусов загрузки (каждый отображается 3 секунды)
    const statusMessages = [
      'Обработка запроса',
      'Определение требований',
      'Формирование кода',
      'Проверка кода',
      'Рендеринг диаграммы',
      'Проверка качества',
    ];
    setLoadingMessages(statusMessages);
    setLoadingStage('processing');

    // Обновляем таймер каждую секунду
    const timerInterval = setInterval(() => {
      if (isProcessing) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(elapsed);
      }
    }, 1000);

    // Меняем статус каждые 3 секунды
    let statusIndex = 0;
    const statusInterval = setInterval(() => {
      if (isProcessing && statusMessages.length > 0) {
        statusIndex = (statusIndex + 1) % statusMessages.length;
        // Обновляем loadingStage для совместимости
        if (statusIndex < 2) {
          setLoadingStage('processing');
        } else if (statusIndex < 4) {
          setLoadingStage('generating');
        } else {
          setLoadingStage('creating');
        }
      }
    }, 3000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(statusInterval);
    };
  }, [isProcessing]);

  const handleSendMessage = async () => {
    if (message.trim() && !isProcessing && diagramType) {
      const objectDescription = message.trim();
      const newMessage = {
        text: objectDescription,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      
      // Сохраняем время начала генерации ПЕРЕД началом обработки
      const generationStartTime = Date.now();
      setIsProcessing(true);
      setLoadingStage('processing');

      try {
        // Собираем документы из проекта (если есть)
        let documents: any[] = [];
        if (selectedOption === 'projects' && selectedProjectData && selectedProjectData.processedDocuments) {
          documents = selectedProjectData.processedDocuments;
        }

        // Вызываем API для генерации PlantUML кода
        const generateResponse = await fetch('/api/diagrams/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            diagramType,
            objectDescription,
            documents,
            isFromProject: selectedOption === 'projects',
          }),
        });

        if (!generateResponse.ok) {
          throw new Error('Ошибка при генерации диаграммы');
        }

        const generateData = await generateResponse.json();
        const isMermaid = diagramType === 'MindMapMax' || diagramType === 'ActivityMax';
        const isDualFormat = diagramType.endsWith('2');
        // Проверяем, является ли тип чисто Mermaid (новые типы)
        const isPureMermaid = ['MindMapMax', 'ActivityMax', 'Architecture', 'C4', 'Git', 'Kanban', 'Pie', 'Quadrant', 'Radar', 'Timeline', 'UserJourney', 'XY'].includes(diagramType);
        const plantUmlCode = generateData.plantUmlCode;
        const mermaidCode = generateData.mermaidCode;
        const glossary = generateData.glossary;

        // Сохраняем данные в диаграмму
        const currentUser = auth.getCurrentUser();
        
        // Функция для получения базового типа диаграммы
        const getBaseType = (type: DiagramType): string => {
          if (type === 'MindMap2') return 'MindMap';
          if (type === 'Sequence2') return 'Sequence';
          if (type === 'Class2') return 'Class';
          if (type === 'State2') return 'State';
          if (type === 'Activity2') return 'Activity';
          if (type === 'Gantt2') return 'Gantt';
          if (type === 'ER2') return 'ER';
          return type;
        };

        // Функция для получения Mermaid типа диаграммы
        const getMermaidType = (type: DiagramType): string => {
          if (type === 'MindMap2') return 'MindMapMermaid';
          if (type === 'Sequence2') return 'SequenceMermaid';
          if (type === 'Class2') return 'ClassMermaid';
          if (type === 'State2') return 'StateMermaid';
          if (type === 'Activity2') return 'ActivityMermaid';
          if (type === 'Gantt2') return 'GanttMermaid';
          if (type === 'ER2') return 'ERMermaid';
          return type;
        };
        
        if (isDualFormat) {
          // Для всех (2) типов генерируем оба формата
          const baseType = getBaseType(diagramType);
          const mermaidType = getMermaidType(diagramType);
          
          // Сначала генерируем Mermaid (так как он показывается первым)
          const mermaidResponse = await fetch('/api/diagrams/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              diagramType: mermaidType,
              objectDescription,
              documents,
              isFromProject: selectedOption === 'projects',
            }),
          });

          if (!mermaidResponse.ok) {
            throw new Error('Ошибка при генерации Mermaid диаграммы');
          }

          const mermaidData = await mermaidResponse.json();
          const mermaidCodeForDual = mermaidData.mermaidCode;
          const mermaidGlossary = mermaidData.glossary;

          // Генерируем PlantUML
          const plantUmlResponse = await fetch('/api/diagrams/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              diagramType: baseType,
              objectDescription,
              documents,
              isFromProject: selectedOption === 'projects',
            }),
          });

          if (!plantUmlResponse.ok) {
            throw new Error('Ошибка при генерации PlantUML диаграммы');
          }

          const plantUmlData = await plantUmlResponse.json();
          const plantUmlCodeForDual = plantUmlData.plantUmlCode;
          const plantUmlGlossary = plantUmlData.glossary;

          // Рендерим PlantUML
          const renderResponse = await fetch('/api/diagrams/render', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              plantUmlCode: plantUmlCodeForDual,
            }),
          });

          if (!renderResponse.ok) {
            throw new Error('Ошибка при рендеринге PlantUML диаграммы');
          }

          const { imageUrl } = await renderResponse.json();

          if (currentUser && diagramId) {
            saveDiagram({
              diagramType,
              selectedObject: objectDescription,
              plantUmlCode: plantUmlCodeForDual,
              diagramImageUrl: imageUrl,
              glossary: plantUmlGlossary,
            });
          }

          // Сохраняем время генерации (минимум 3 секунды)
          const finalElapsedSeconds = Math.max(3, Math.floor((Date.now() - generationStartTime) / 1000));
          
          // Добавляем единое сообщение с обоими форматами
          setMessages(prev => [
            ...prev,
            {
              text: '',
              isUser: false,
              type: 'dualformat',
              plantUmlCode: plantUmlCodeForDual,
              mermaidCode: mermaidCodeForDual,
              plantUmlGlossary,
              mermaidGlossary,
              diagramImageUrl: imageUrl,
              generationTime: finalElapsedSeconds,
              timestamp: new Date()
            }
          ]);
          setShowDiagram(true);
        } else if (isPureMermaid && mermaidCode) {
          // Для новых Mermaid диаграмм рендерим на клиенте
          if (currentUser && diagramId) {
            saveDiagram({
              diagramType,
              selectedObject: objectDescription,
              plantUmlCode: mermaidCode, // Сохраняем как plantUmlCode для совместимости
              glossary,
            });
          }

          // Сохраняем время генерации (минимум 3 секунды)
          const finalElapsedSeconds = Math.max(3, Math.floor((Date.now() - generationStartTime) / 1000));
          
          // Добавляем сообщение с результатами (объединяем диаграмму и глоссарий)
          setMessages(prev => [
            ...prev,
            {
              text: mermaidCode,
              isUser: false,
              type: 'mermaid',
              mermaidCode,
              glossary,
              generationTime: finalElapsedSeconds,
              timestamp: new Date()
            }
          ]);
          setShowDiagram(true);
        } else if (isMermaid && mermaidCode) {
          // Для старых Mermaid диаграмм рендерим на клиенте
          if (currentUser && diagramId) {
            saveDiagram({
              diagramType,
              selectedObject: objectDescription,
              plantUmlCode: mermaidCode, // Сохраняем как plantUmlCode для совместимости
              glossary,
            });
          }

          // Сохраняем время генерации (минимум 3 секунды)
          const finalElapsedSeconds = Math.max(3, Math.floor((Date.now() - generationStartTime) / 1000));
          
          // Добавляем сообщение с результатами (объединяем диаграмму и глоссарий)
          setMessages(prev => [
            ...prev,
            {
              text: mermaidCode,
              isUser: false,
              type: 'mermaid',
              mermaidCode,
              glossary,
              generationTime: finalElapsedSeconds,
              timestamp: new Date()
            }
          ]);
          setShowDiagram(true);
        } else if (plantUmlCode) {
          // Для PlantUML диаграмм используем API рендеринга
          const renderResponse = await fetch('/api/diagrams/render', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              plantUmlCode,
            }),
          });

          if (!renderResponse.ok) {
            throw new Error('Ошибка при рендеринге диаграммы');
          }

          const { imageUrl } = await renderResponse.json();

          if (currentUser && diagramId) {
            saveDiagram({
              diagramType,
              selectedObject: objectDescription,
              plantUmlCode,
              diagramImageUrl: imageUrl,
              glossary,
            });
          }

          // Сохраняем время генерации (минимум 3 секунды)
          const finalElapsedSeconds = Math.max(3, Math.floor((Date.now() - generationStartTime) / 1000));
          
          // Добавляем сообщение с результатами (объединяем диаграмму и глоссарий)
          setMessages(prev => [
            ...prev,
            {
              text: plantUmlCode,
              isUser: false,
              type: 'code',
              plantUmlCode,
              diagramImageUrl: imageUrl,
              glossary,
              generationTime: finalElapsedSeconds,
              timestamp: new Date()
            }
          ]);
          setShowDiagram(true);
        } else {
          throw new Error('Не удалось получить код диаграммы');
        }
      } catch (error) {
        console.error('Ошибка при создании диаграммы:', error);
        setMessages(prev => [...prev, {
          text: `Ошибка при создании диаграммы: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
          isUser: false,
          timestamp: new Date()
        }]);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!diagramData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Диаграмма не найдена</div>
      </div>
    );
  }

  // Определяем порядок шагов: тип диаграммы -> способ создания -> проект/чат
  const diagramTypeNames: Record<DiagramType, string> = {
    'UseCase': 'UML диаграмма прецедентов',
    'UseCasePlantUML': 'Use Case (PlantUML)',
    'Object': 'UML диаграмма объектов',
    'MindMap2': 'MindMap (2)',
    'MindMapMax': 'MindMap (Max)',
    'MindMapPlantUML': 'MindMap (PlantUML)',
    'Sequence2': 'Sequence (2)',
    'SequencePlantUML': 'Sequence (PlantUML)',
    'Class2': 'Class (2)',
    'State2': 'State (2)',
    'Activity2': 'Activity (2)',
    'ActivityMax': 'Activity (Max)',
    'Gantt2': 'Gantt (2)',
    'ER2': 'ER (2)',
    'Architecture': 'Architecture диаграмма',
    'C4': 'C4 диаграмма',
    'Git': 'Git диаграмма',
    'Kanban': 'Kanban диаграмма',
    'Pie': 'Pie диаграмма',
    'Quadrant': 'Quadrant диаграмма',
    'Radar': 'Radar диаграмма',
    'Timeline': 'Timeline диаграмма',
    'UserJourney': 'User Journey диаграмма',
    'XY': 'XY диаграмма',
  };

  // Расширенная информация о типах диаграмм
  interface DiagramTypeInfo {
    type: DiagramType;
    name: string;
    description: string;
    standard: string;
    purpose: string;
    tags: string[];
    popularity: number; // для сортировки по популярности
  }

  const diagramTypesInfo: DiagramTypeInfo[] = [
    {
      type: 'UseCase',
      name: 'UseCase',
      description: 'Описывает функциональные требования системы через взаимодействие актеров и прецедентов использования',
      standard: 'UML',
      purpose: 'Требования',
      tags: ['UML', 'Требования', 'Прецеденты'],
      popularity: 8
    },
    {
      type: 'UseCasePlantUML',
      name: 'Use Case (PlantUML)',
      description: 'Диаграмма вариантов использования PlantUML с максимально детальными инструкциями для ИИ-модели и строгими цветами (белый, черный, серый) - гарантирует отсутствие ошибок рендеринга',
      standard: 'PlantUML',
      purpose: 'Требования',
      tags: ['UML', 'Требования', 'Прецеденты', 'PlantUML', 'Максимальное качество'],
      popularity: 10
    },
    {
      type: 'Object',
      name: 'Object',
      description: 'Показывает конкретные экземпляры классов и их связи в определенный момент времени',
      standard: 'UML',
      purpose: 'Моделирование',
      tags: ['UML', 'Объекты', 'Экземпляры'],
      popularity: 5
    },
    {
      type: 'MindMap2',
      name: 'MindMap (2)',
      description: 'Интеллект-карта с возможностью выбора между PlantUML и Mermaid форматами',
      standard: 'Общее',
      purpose: 'Идеи',
      tags: ['Идеи', 'Мозговой штурм', 'Концептуальные', 'PlantUML', 'Mermaid'],
      popularity: 8
    },
    {
      type: 'MindMapMax',
      name: 'MindMap (Max)',
      description: 'Интеллект-карта Mermaid с максимально детальными инструкциями для ИИ-модели - гарантирует отсутствие ошибок рендеринга',
      standard: 'Mermaid',
      purpose: 'Идеи',
      tags: ['Идеи', 'Мозговой штурм', 'Концептуальные', 'Mermaid', 'Максимальное качество'],
      popularity: 10
    },
    {
      type: 'MindMapPlantUML',
      name: 'MindMap (PlantUML)',
      description: 'Интеллект-карта PlantUML с максимально детальными инструкциями для ИИ-модели и строгими цветами (белый, черный, серый) - гарантирует отсутствие ошибок рендеринга',
      standard: 'PlantUML',
      purpose: 'Идеи',
      tags: ['Идеи', 'Мозговой штурм', 'Концептуальные', 'PlantUML', 'Максимальное качество'],
      popularity: 10
    },
    {
      type: 'Sequence2',
      name: 'Sequence (2)',
      description: 'Диаграмма последовательности с возможностью выбора между PlantUML и Mermaid форматами',
      standard: 'UML',
      purpose: 'Взаимодействие',
      tags: ['UML', 'Взаимодействие', 'Временные последовательности', 'PlantUML', 'Mermaid'],
      popularity: 8
    },
    {
      type: 'SequencePlantUML',
      name: 'Sequence (PlantUML)',
      description: 'Диаграмма последовательности PlantUML с максимально детальными инструкциями для ИИ-модели и строгими цветами (белый, черный, серый) - гарантирует отсутствие ошибок рендеринга',
      standard: 'PlantUML',
      purpose: 'Взаимодействие',
      tags: ['UML', 'Взаимодействие', 'Временные последовательности', 'PlantUML', 'Максимальное качество'],
      popularity: 10
    },
    {
      type: 'Class2',
      name: 'Class (2)',
      description: 'Диаграмма классов с возможностью выбора между PlantUML и Mermaid форматами',
      standard: 'UML',
      purpose: 'Архитектура',
      tags: ['UML', 'Архитектура', 'PlantUML', 'Mermaid'],
      popularity: 9
    },
    {
      type: 'State2',
      name: 'State (2)',
      description: 'Диаграмма состояний с возможностью выбора между PlantUML и Mermaid форматами',
      standard: 'UML',
      purpose: 'Моделирование состояний',
      tags: ['UML', 'Состояния', 'Жизненный цикл', 'PlantUML', 'Mermaid'],
      popularity: 7
    },
    {
      type: 'Activity2',
      name: 'Activity (2)',
      description: 'Диаграмма активности с возможностью выбора между PlantUML и Mermaid форматами',
      standard: 'UML',
      purpose: 'Бизнес-процессы',
      tags: ['UML', 'Бизнес-процессы', 'Workflow', 'PlantUML', 'Mermaid'],
      popularity: 8
    },
    {
      type: 'ActivityMax',
      name: 'Activity (Max)',
      description: 'Диаграмма активности Mermaid с максимально детальными инструкциями для ИИ-модели - гарантирует отсутствие ошибок рендеринга',
      standard: 'Mermaid',
      purpose: 'Бизнес-процессы',
      tags: ['Бизнес-процессы', 'Workflow', 'Mermaid', 'Максимальное качество'],
      popularity: 10
    },
    {
      type: 'Gantt2',
      name: 'Gantt (2)',
      description: 'Диаграмма Ганта с возможностью выбора между PlantUML и Mermaid форматами',
      standard: 'Общее',
      purpose: 'Управление проектами',
      tags: ['Управление проектами', 'Планирование', 'График', 'PlantUML', 'Mermaid'],
      popularity: 7
    },
    {
      type: 'ER2',
      name: 'ER (2)',
      description: 'ER диаграмма с возможностью выбора между PlantUML и Mermaid форматами',
      standard: 'ER',
      purpose: 'База данных',
      tags: ['База данных', 'Сущности', 'Схема данных', 'PlantUML', 'Mermaid'],
      popularity: 9
    },
    {
      type: 'Architecture',
      name: 'Architecture',
      description: 'Архитектурная диаграмма для визуализации структуры системы и компонентов',
      standard: 'Mermaid',
      purpose: 'Архитектура',
      tags: ['Mermaid', 'Архитектура', 'Система'],
      popularity: 8
    },
    {
      type: 'C4',
      name: 'C4',
      description: 'C4 модель для описания архитектуры программного обеспечения на разных уровнях абстракции',
      standard: 'Mermaid',
      purpose: 'Архитектура',
      tags: ['Mermaid', 'C4', 'Архитектура', 'Софт'],
      popularity: 9
    },
    {
      type: 'Git',
      name: 'Git',
      description: 'Диаграмма Git для визуализации ветвления и истории коммитов в репозитории',
      standard: 'Mermaid',
      purpose: 'Разработка',
      tags: ['Mermaid', 'Git', 'Версионирование', 'Разработка'],
      popularity: 7
    },
    {
      type: 'Kanban',
      name: 'Kanban',
      description: 'Канбан-доска для визуализации рабочих процессов и задач',
      standard: 'Mermaid',
      purpose: 'Управление проектами',
      tags: ['Mermaid', 'Kanban', 'Управление', 'Задачи'],
      popularity: 8
    },
    {
      type: 'Pie',
      name: 'Pie',
      description: 'Круговая диаграмма для отображения пропорций и долей данных',
      standard: 'Mermaid',
      purpose: 'Визуализация данных',
      tags: ['Mermaid', 'Pie', 'Данные', 'Статистика'],
      popularity: 7
    },
    {
      type: 'Quadrant',
      name: 'Quadrant',
      description: 'Квадрантная диаграмма для анализа и категоризации элементов по двум осям',
      standard: 'Mermaid',
      purpose: 'Анализ',
      tags: ['Mermaid', 'Quadrant', 'Анализ', 'Категоризация'],
      popularity: 6
    },
    {
      type: 'Radar',
      name: 'Radar',
      description: 'Радарная диаграмма для сравнения множественных метрик и характеристик',
      standard: 'Mermaid',
      purpose: 'Визуализация данных',
      tags: ['Mermaid', 'Radar', 'Данные', 'Сравнение'],
      popularity: 6
    },
    {
      type: 'Timeline',
      name: 'Timeline',
      description: 'Временная шкала для отображения событий и процессов во времени',
      standard: 'Mermaid',
      purpose: 'Временной анализ',
      tags: ['Mermaid', 'Timeline', 'Время', 'События'],
      popularity: 8
    },
    {
      type: 'UserJourney',
      name: 'User Journey',
      description: 'Карта пользовательского пути для визуализации взаимодействия пользователя с продуктом',
      standard: 'Mermaid',
      purpose: 'UX/UI',
      tags: ['Mermaid', 'User Journey', 'UX', 'Пользователь'],
      popularity: 8
    },
    {
      type: 'XY',
      name: 'XY',
      description: 'XY диаграмма для отображения зависимостей между двумя переменными',
      standard: 'Mermaid',
      purpose: 'Визуализация данных',
      tags: ['Mermaid', 'XY', 'Данные', 'Зависимости'],
      popularity: 7
    }
  ];

  // Получаем уникальные значения для фильтров
  const allStandards = Array.from(new Set(diagramTypesInfo.map(d => d.standard)));
  const allPurposes = Array.from(new Set(diagramTypesInfo.map(d => d.purpose)));
  const allTags = Array.from(new Set(diagramTypesInfo.flatMap(d => d.tags)));

  // Проверяем, применены ли фильтры
  const hasActiveFilters = selectedStandard !== 'Все' || selectedPurpose !== 'Все' || selectedTag !== 'Все';

  // Функция для сброса всех фильтров
  const handleClearFilters = () => {
    setSelectedStandard('Все');
    setSelectedPurpose('Все');
    setSelectedTag('Все');
  };

  // Фильтрация и сортировка
  const filteredAndSortedTypes = diagramTypesInfo
    .filter(diagram => {
      // Поиск по названию и описанию
      const matchesSearch = searchQuery === '' || 
        diagram.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        diagram.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        diagram.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Фильтр по стандарту
      const matchesStandard = selectedStandard === 'Все' || diagram.standard === selectedStandard;
      
      // Фильтр по цели
      const matchesPurpose = selectedPurpose === 'Все' || diagram.purpose === selectedPurpose;
      
      // Фильтр по тегу
      const matchesTag = selectedTag === 'Все' || diagram.tags.includes(selectedTag);
      
      return matchesSearch && matchesStandard && matchesPurpose && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === 'alphabet') {
        return a.name.localeCompare(b.name, 'ru');
      } else {
        return b.popularity - a.popularity;
      }
    });

  return (
    <div className="h-full flex flex-col">
      {!diagramType ? (
        /* Выбор типа диаграммы */
        <div>
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-3xl font-medium mb-2">Тип диаграммы</h1>
            <p className="text-gray-600 text-base">Выберите тип диаграммы</p>
          </div>

          {/* Панель управления: Поиск, Фильтры, Сортировка */}
          <div className="mb-8 space-y-6">
            {/* Поиск и Сортировка в одной строке */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Поиск */}
              <div className="flex-1">
                <label className="block text-xl font-medium text-gray-900 mb-2">Поиск</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Введите название или описание диаграммы"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Сортировка */}
              <div className="md:w-64">
                <label className="block text-xl font-medium text-gray-900 mb-2">Сортировка</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'alphabet' | 'popularity')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="alphabet">По алфавиту</option>
                  <option value="popularity">По популярности</option>
                </select>
              </div>
            </div>

            {/* Фильтры */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-medium text-gray-900">Фильтры</h3>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-base text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Убрать фильтры
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Фильтр по стандарту/нотации */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-2">
                    Стандарт или нотация
                  </label>
                  <select
                    value={selectedStandard}
                    onChange={(e) => setSelectedStandard(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="Все">Все</option>
                    {allStandards.map(standard => (
                      <option key={standard} value={standard}>{standard}</option>
                    ))}
                  </select>
                </div>

                {/* Фильтр по цели использования */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-2">
                    Цель использования
                  </label>
                  <select
                    value={selectedPurpose}
                    onChange={(e) => setSelectedPurpose(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="Все">Все</option>
                    {allPurposes.map(purpose => (
                      <option key={purpose} value={purpose}>{purpose}</option>
                    ))}
                  </select>
                </div>

                {/* Фильтр по тегам */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-2">
                    Теги
                  </label>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="Все">Все</option>
                    {allTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Карточки типов диаграмм */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedTypes.map((diagram, index) => (
              <button
                key={diagram.type}
                onClick={() => handleDiagramTypeSelect(diagram.type)}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:bg-blue-50 transition-all text-left relative group"
              >
                {/* Индикатор номера */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600 group-hover:bg-blue-100">
                  {index + 1}
                </div>
                
                {/* Заголовок */}
                <h3 className="text-xl font-medium text-gray-900 mb-3 pr-10">{diagram.name}</h3>
                
                {/* Описание */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {diagram.description}
                </p>
                
                {/* Теги */}
                <div className="flex flex-wrap gap-2">
                  {diagram.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-[#EAEEFF] text-[#3B5AE4] text-sm rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Сообщение, если ничего не найдено */}
          {filteredAndSortedTypes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Диаграммы не найдены</p>
              <p className="text-gray-400 text-sm mt-2">Попробуйте изменить параметры поиска или фильтры</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-medium mb-2">{diagramData.name}</h1>
          <p className="text-gray-600 mb-8 text-base">{diagramData.description || ''}</p>
          {!selectedOption ? (
        /* Выбор источника данных */
        <div className="max-w-2xl space-y-6">
          {/* Блок 1: Выбрать из проектов */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-medium text-gray-900 mb-2">Выбрать из моих проектов</h2>
                <p className="text-gray-500 text-base">
                  Использовать данные из существующего проекта
                </p>
              </div>
              <button
                onClick={() => handleOptionSelect('projects')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 min-w-[180px] justify-center"
              >
                Выбрать проект
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>

          {/* Блок 2: Создать с нуля */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-medium text-gray-900 mb-2">Создать с нуля</h2>
                <p className="text-gray-500 text-base">
                  Опишите предметную область вручную
                </p>
              </div>
              <button
                onClick={() => handleOptionSelect('scratch')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 min-w-[180px] justify-center"
              >
                Ввести данные
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      ) : selectedOption === 'projects' && !selectedProject ? (
        /* Таблица проектов */
        <div>
          <h2 className="text-2xl font-medium mb-6">Выберите проект</h2>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Загрузка...</div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">У вас пока нет проектов</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-medium text-gray-900">Название</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900">Краткое описание</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900">Дата создания</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr 
                      key={project.id} 
                      onClick={() => handleProjectSelect(project.id)}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-6 text-gray-900 font-medium">
                        {project.name}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {project.description || ''}
                      </td>
                      <td className="py-4 px-6 text-gray-500">
                        {formatDate(project.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        ) : (
          /* Область чата */
          <div className="flex flex-col h-full">
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Чат */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              {/* История сообщений */}
              <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-6 mb-4 overflow-y-auto overflow-x-hidden min-h-0">
                <div className="space-y-4">
                  {messages.map((msg, index) => {
                    const timestamp = msg.timestamp || new Date();
                    const dateStr = timestamp.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const timeStr = timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                    
                    if (msg.type === 'dualformat' || msg.type === 'mindmap2') {
                      return (
                        <DualFormatMessage
                          key={index}
                          msg={msg}
                          index={index}
                          dateStr={dateStr}
                          timeStr={timeStr}
                          viewModes={viewModes}
                          setViewModes={setViewModes}
                          formatSelectors={formatSelectors}
                          setFormatSelectors={setFormatSelectors}
                          generationTime={msg.generationTime}
                          onOpenSupport={() => setShowSupportModal(true)}
                        />
                      );
                    }
                    
                    if (msg.type === 'mermaid' && msg.mermaidCode) {
                      return (
                        <MermaidMessage
                          key={index}
                          msg={msg}
                          index={index}
                          dateStr={dateStr}
                          timeStr={timeStr}
                          viewModes={viewModes}
                          setViewModes={setViewModes}
                          generationTime={msg.generationTime}
                          onOpenSupport={() => setShowSupportModal(true)}
                        />
                      );
                    }
                    
                    if (msg.type === 'code') {
                      const currentViewMode = viewModes.get(index) || 'diagram';
                      return (
                        <div key={index} className="flex flex-col items-start">
                          <div className="text-base text-gray-500 mb-1 px-1">
                            {dateStr} {timeStr}
                          </div>
                          <div className="max-w-full w-full">
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                                {/* Левая часть: таймер и кнопка "Сообщить об ошибке" */}
                                <div className="flex items-center gap-3">
                                  {msg.generationTime !== undefined && (
                                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="text-sm font-mono font-medium text-gray-700">
                                        {Math.floor(msg.generationTime / 60)}:{(msg.generationTime % 60).toString().padStart(2, '0')}
                                      </span>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => setShowSupportModal(true)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                  >
                                    Сообщить об ошибке
                                  </button>
                                </div>

                                {/* Свитчер Диаграмма/Код (по центру) */}
                                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 mx-auto">
                                  <button
                                    onClick={() => {
                                      const newModes = new Map(viewModes);
                                      newModes.set(index, 'diagram');
                                      setViewModes(newModes);
                                    }}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                      currentViewMode === 'diagram'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                  >
                                    Диаграмма
                                  </button>
                                  <button
                                    onClick={() => {
                                      const newModes = new Map(viewModes);
                                      newModes.set(index, 'code');
                                      setViewModes(newModes);
                                    }}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                      currentViewMode === 'code'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                  >
                                    Код
                                  </button>
                                </div>

                                {/* Кнопки действий (справа) */}
                                <div className="flex space-x-2">
                                  {msg.diagramImageUrl && (
                                    <a
                                      href={msg.diagramImageUrl}
                                      download
                                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                    >
                                      Скачать PNG
                                    </a>
                                  )}
                                  <button
                                    onClick={() => {
                                      if (msg.plantUmlCode) {
                                        navigator.clipboard.writeText(msg.plantUmlCode);
                                        alert('Код скопирован в буфер обмена');
                                      }
                                    }}
                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                  >
                                    Скопировать код
                                  </button>
                                </div>
                              </div>
                              {/* Показываем диаграмму или код в зависимости от выбранного режима */}
                              {currentViewMode === 'diagram' && msg.diagramImageUrl && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                  <img
                                    src={msg.diagramImageUrl}
                                    alt="PlantUML диаграмма"
                                    className="max-w-full h-auto mx-auto"
                                  />
                                </div>
                              )}
                              {currentViewMode === 'code' && (
                                <div className="bg-gray-900 text-gray-100 font-mono text-xs p-4 rounded overflow-x-auto">
                                  <pre className="whitespace-pre-wrap">{msg.plantUmlCode || msg.text}</pre>
                                </div>
                              )}

                              {/* Глоссарий (внизу, в том же сообщении) */}
                              {msg.glossary && msg.glossary.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                  <h4 className="font-medium text-lg mb-4">Глоссарий элементов диаграммы</h4>
                                  <table className="w-full">
                                    <thead>
                                      <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium text-gray-900">Элемент</th>
                                        <th className="text-left py-2 font-medium text-gray-900">Описание</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {msg.glossary.map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-100">
                                          <td className="py-3 text-gray-900 font-medium">{item.element}</td>
                                          <td className="py-3 text-gray-600">{item.description}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={index} className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                        <div className="text-base text-gray-500 mb-1 px-1">
                          {dateStr} {timeStr}
                        </div>
                        <div className={`max-w-[75%] rounded-2xl p-4 ${
                          msg.isUser
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'
                        }`}>
                          <p className={`text-base break-words ${msg.isUser ? 'text-white' : 'text-gray-900'}`}>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {/* Индикатор загрузки ответа с таймером */}
                  {isProcessing && (
                    <div className="flex flex-col items-start">
                      <div className="max-w-[75%] rounded-2xl p-4 bg-white border border-gray-200 rounded-bl-none shadow-sm">
                        <div className="flex items-center gap-3">
                          {/* Таймер */}
                          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-mono font-medium text-gray-700">
                              {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                          {/* Текущее сообщение */}
                          <span className="text-sm text-gray-600">
                            {loadingMessages.length > 0 
                              ? loadingMessages[Math.floor(elapsedSeconds / 3) % loadingMessages.length]
                              : (loadingStage === 'processing' ? 'Обработка запроса' : 
                                 loadingStage === 'generating' ? 'Формирование кода' : 
                                 'Создание диаграммы')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Поле ввода */}
              <div className="relative flex-shrink-0 bg-white rounded-lg border border-gray-200 focus-within:border-blue-500 transition-all">
                {/* Textarea */}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={diagramType ? (selectedOption === 'projects' ? "Введите название объекта или процесса для диаграммы..." : "Опишите предметную область и конкретный объект...") : "Сначала выберите тип диаграммы..."}
                  disabled={isProcessing || !diagramType}
                  className="w-full bg-transparent border-0 rounded-lg px-4 py-3 pr-16 focus:ring-0 focus:outline-none resize-none overflow-y-auto text-base text-gray-900 placeholder:text-gray-500 leading-relaxed disabled:opacity-50"
                  style={{
                    minHeight: '6.5rem',
                    maxHeight: '6.5rem',
                    lineHeight: '1.5',
                  }}
                />

                {/* Кнопка отправки */}
                <div className="absolute right-3 bottom-3 z-10">
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isProcessing || !diagramType}
                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-8 h-8"
                    title="Отправить"
                  >
                    <i className="fas fa-paper-plane text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
        </>
      )}
      <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />
    </div>
  );
}