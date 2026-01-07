'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { type EditorDiagram, type EditorPage, type EditorElement } from '@/lib/storage';

interface EditorCanvasProps {
  diagram: EditorDiagram;
  currentPage: EditorPage;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdatePage: (page: EditorPage) => void;
  onAddElement: (element: EditorElement) => void;
  onUpdateElement: (elementId: string, updates: Partial<EditorElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onAddPage: () => void;
  onSwitchPage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onBack: () => void;
}

export default function EditorCanvas({
  diagram,
  currentPage,
  selectedElementId,
  onSelectElement,
  onUpdatePage,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onAddPage,
  onSwitchPage,
  onDeletePage,
  onBack,
}: EditorCanvasProps) {
  const [tool, setTool] = useState<'select' | 'rectangle' | 'circle' | 'line' | 'text' | 'arrow'>('select');
  const [leftMenuOpen, setLeftMenuOpen] = useState(true);
  const [rightMenuOpen, setRightMenuOpen] = useState(true);
  const [layersOpen, setLayersOpen] = useState(true);
  const [pagesOpen, setPagesOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize] = useState(20);
  const [history, setHistory] = useState<EditorPage[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [copiedElement, setCopiedElement] = useState<EditorElement | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [editingLayerName, setEditingLayerName] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState<string | null>(null);

  const selectedElement = currentPage.elements.find(el => el.id === selectedElementId);

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'select') {
      const target = e.target as SVGElement;
      const elementId = target.getAttribute('data-element-id');
      onSelectElement(elementId);
    } else {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;

      const snappedX = snapToGridValue(x);
      const snappedY = snapToGridValue(y);

      const newElement: EditorElement = {
        id: `element_${Date.now()}`,
        type: tool === 'rectangle' ? 'rectangle' : tool === 'circle' ? 'circle' : tool === 'line' ? 'line' : tool === 'arrow' ? 'arrow' : 'text',
        x: snappedX,
        y: snappedY,
        width: tool === 'text' ? undefined : 100,
        height: tool === 'text' ? undefined : 100,
        text: tool === 'text' ? 'Текст' : undefined,
        fill: '#3b82f6',
        stroke: '#1e40af',
        strokeWidth: 2,
        fontSize: tool === 'text' ? 16 : undefined,
        fontFamily: 'Inter, sans-serif',
        zIndex: currentPage.elements.length,
        opacity: 1,
      };

      saveToHistory();

      onAddElement(newElement);
      onSelectElement(newElement.id);
      setTool('select');
    }
  };

  // Привязка к сетке (объявлена раньше, так как используется в handleMouseMove)
  const snapToGridValue = useCallback((value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  // История действий (Undo/Redo) - объявлена раньше, так как используется в других функциях
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ...currentPage });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [currentPage, history, historyIndex]);

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    if (tool === 'select') {
      const element = currentPage.elements.find(el => el.id === elementId);
      if (element?.locked) return;
      
      onSelectElement(elementId);
      setIsDragging(true);
      if (element) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          setDragStart({
            x: e.clientX - (element.x * zoom + pan.x),
            y: e.clientY - (element.y * zoom + pan.y),
          });
        }
      }
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Обновление позиции мыши для отображения координат
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    if (isDragging && selectedElementId && tool === 'select' && !isResizing) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      let newX = (e.clientX - dragStart.x - pan.x) / zoom;
      let newY = (e.clientY - dragStart.y - pan.y) / zoom;

      // Привязка к сетке
      newX = snapToGridValue(newX);
      newY = snapToGridValue(newY);

      onUpdateElement(selectedElementId, {
        x: Math.max(0, newX),
        y: Math.max(0, newY),
      });
    } else if (isResizing && selectedElementId && selectedElement) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;

      let updates: Partial<EditorElement> = {};

      switch (resizeHandle) {
        case 'nw':
          updates = {
            x: snapToGridValue(selectedElement.x + deltaX),
            y: snapToGridValue(selectedElement.y + deltaY),
            width: snapToGridValue((selectedElement.width || 100) - deltaX),
            height: snapToGridValue((selectedElement.height || 100) - deltaY),
          };
          break;
        case 'ne':
          updates = {
            y: snapToGridValue(selectedElement.y + deltaY),
            width: snapToGridValue((selectedElement.width || 100) + deltaX),
            height: snapToGridValue((selectedElement.height || 100) - deltaY),
          };
          break;
        case 'sw':
          updates = {
            x: snapToGridValue(selectedElement.x + deltaX),
            width: snapToGridValue((selectedElement.width || 100) - deltaX),
            height: snapToGridValue((selectedElement.height || 100) + deltaY),
          };
          break;
        case 'se':
          updates = {
            width: snapToGridValue((selectedElement.width || 100) + deltaX),
            height: snapToGridValue((selectedElement.height || 100) + deltaY),
          };
          break;
        case 'n':
          updates = {
            y: snapToGridValue(selectedElement.y + deltaY),
            height: snapToGridValue((selectedElement.height || 100) - deltaY),
          };
          break;
        case 's':
          updates = {
            height: snapToGridValue((selectedElement.height || 100) + deltaY),
          };
          break;
        case 'w':
          updates = {
            x: snapToGridValue(selectedElement.x + deltaX),
            width: snapToGridValue((selectedElement.width || 100) - deltaX),
          };
          break;
        case 'e':
          updates = {
            width: snapToGridValue((selectedElement.width || 100) + deltaX),
          };
          break;
      }

      // Ограничения минимального размера
      if (updates.width !== undefined && updates.width < 10) updates.width = 10;
      if (updates.height !== undefined && updates.height < 10) updates.height = 10;
      if (updates.x !== undefined && updates.x < 0) updates.x = 0;
      if (updates.y !== undefined && updates.y < 0) updates.y = 0;

      onUpdateElement(selectedElementId, updates);
    }
  }, [isDragging, isResizing, selectedElementId, tool, dragStart, pan, zoom, onUpdateElement, resizeHandle, selectedElement, snapToGridValue]);

  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      saveToHistory();
    }
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, [isDragging, isResizing, saveToHistory]);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Масштабирование колесиком мыши
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.25, Math.min(4, prev + delta)));
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Инициализация истории
  useEffect(() => {
    if (history.length === 0) {
      setHistory([{ ...currentPage }]);
      setHistoryIndex(0);
    }
  }, [currentPage, history.length]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevPage = history[historyIndex - 1];
      onUpdatePage({ ...prevPage });
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, onUpdatePage]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextPage = history[historyIndex + 1];
      onUpdatePage({ ...nextPage });
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, onUpdatePage]);

  // Копирование/Вставка
  const handleCopy = useCallback(() => {
    if (selectedElementId && selectedElement) {
      setCopiedElement({ ...selectedElement });
    }
  }, [selectedElementId, selectedElement]);

  const handlePaste = useCallback(() => {
    if (copiedElement) {
      saveToHistory();
      const newElement: EditorElement = {
        ...copiedElement,
        id: `element_${Date.now()}`,
        x: copiedElement.x + 20,
        y: copiedElement.y + 20,
      };
      onAddElement(newElement);
      onSelectElement(newElement.id);
    }
  }, [copiedElement, onAddElement, onSelectElement, saveToHistory]);

  const handleDelete = useCallback(() => {
    if (selectedElementId) {
      saveToHistory();
      onDeleteElement(selectedElementId);
    }
  }, [selectedElementId, onDeleteElement, saveToHistory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      // Удаление
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        handleDelete();
      }
      // Копирование
      else if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedElementId) {
        e.preventDefault();
        handleCopy();
      }
      // Вставка
      else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedElement) {
        e.preventDefault();
        handlePaste();
      }
      // Отмена
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Повтор
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      // Горячие клавиши для инструментов
      else if (e.key === 'v') {
        setTool('select');
      } else if (e.key === 'r') {
        setTool('rectangle');
      } else if (e.key === 'o') {
        setTool('circle');
      } else if (e.key === 'l') {
        setTool('line');
      } else if (e.key === 't') {
        setTool('text');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, handleDelete, handleCopy, handlePaste, handleUndo, handleRedo, copiedElement]);

  const exportSVG = () => {
    if (!canvasRef.current) return;

    const svg = canvasRef.current.cloneNode(true) as SVGElement;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${diagram.name}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = async (quality: number = 1) => {
    if (!canvasRef.current) return;

    const svg = canvasRef.current.cloneNode(true) as SVGElement;
    // Удаляем маркеры изменения размера из экспорта
    const resizeHandles = svg.querySelectorAll('[data-resize-handle]');
    resizeHandles.forEach(handle => handle.remove());
    
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const scale = quality;
      const canvas = document.createElement('canvas');
      canvas.width = currentPage.width * scale;
      canvas.height = currentPage.height * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = currentPage.background || '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${diagram.name}.png`;
            link.click();
            URL.revokeObjectURL(downloadUrl);
          }
        }, 'image/png', quality);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const exportPDF = async () => {
    try {
      // Динамический импорт pdf-lib
      const { PDFDocument, rgb } = await import('pdf-lib');
      
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([currentPage.width, currentPage.height]);
      
      // Экспортируем SVG в PNG сначала
      if (!canvasRef.current) return;

      const svg = canvasRef.current.cloneNode(true) as SVGElement;
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = currentPage.width;
        canvas.height = currentPage.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = currentPage.background || '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          const pngBytes = await new Promise<Uint8Array>((resolve) => {
            canvas.toBlob((blob) => {
              if (blob) {
                blob.arrayBuffer().then(buffer => resolve(new Uint8Array(buffer)));
              }
            }, 'image/png');
          });

          const pngImage = await pdfDoc.embedPng(pngBytes);
          page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: currentPage.width,
            height: currentPage.height,
          });

          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${diagram.name}.pdf`;
          link.click();
          URL.revokeObjectURL(downloadUrl);
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (error) {
      console.error('Ошибка при экспорте в PDF:', error);
      alert('Не удалось экспортировать в PDF. Убедитесь, что библиотека pdf-lib установлена.');
    }
  };

  const handleExport = (format: 'svg' | 'png' | 'pdf', quality?: number) => {
    if (format === 'svg') {
      exportSVG();
    } else if (format === 'png') {
      if (quality !== undefined) {
        exportPNG(quality);
      } else {
        // Показываем диалог выбора качества
        const qualityChoice = prompt('Выберите качество (1 = стандартное, 2 = высокое, 3 = максимальное):', '2');
        if (qualityChoice) {
          const q = parseFloat(qualityChoice);
          exportPNG(Math.max(0.1, Math.min(3, q)));
        }
      }
    } else if (format === 'pdf') {
      exportPDF();
    }
  };


  // Рендеринг маркеров изменения размера
  const renderResizeHandles = (element: EditorElement) => {
    if (element.id !== selectedElementId || !selectedElement || tool !== 'select') return null;
    if (element.width === undefined || element.height === undefined) return null;
    if (element.locked) return null;

    const handles = [
      { id: 'nw', x: element.x, y: element.y, cursor: 'nw-resize' },
      { id: 'ne', x: element.x + element.width, y: element.y, cursor: 'ne-resize' },
      { id: 'sw', x: element.x, y: element.y + element.height, cursor: 'sw-resize' },
      { id: 'se', x: element.x + element.width, y: element.y + element.height, cursor: 'se-resize' },
      { id: 'n', x: element.x + element.width / 2, y: element.y, cursor: 'n-resize' },
      { id: 's', x: element.x + element.width / 2, y: element.y + element.height, cursor: 's-resize' },
      { id: 'w', x: element.x, y: element.y + element.height / 2, cursor: 'w-resize' },
      { id: 'e', x: element.x + element.width, y: element.y + element.height / 2, cursor: 'e-resize' },
    ];

    return (
      <g>
        {/* Рамка выбранного элемента */}
        <rect
          x={element.x - 2}
          y={element.y - 2}
          width={element.width + 4}
          height={element.height + 4}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="5,5"
          pointerEvents="none"
        />
        {/* Маркеры */}
        {handles.map(handle => (
          <rect
            key={handle.id}
            x={handle.x - 6}
            y={handle.y - 6}
            width={12}
            height={12}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth={2}
            cursor={handle.cursor}
            onMouseDown={(e: React.MouseEvent) => {
              e.stopPropagation();
              setIsResizing(true);
              setResizeHandle(handle.id);
              const rect = canvasRef.current?.getBoundingClientRect();
              if (rect && selectedElement) {
                setDragStart({
                  x: (e.clientX - rect.left - pan.x) / zoom - selectedElement.x,
                  y: (e.clientY - rect.top - pan.y) / zoom - selectedElement.y,
                });
              }
            }}
            style={{ cursor: handle.cursor }}
          />
        ))}
      </g>
    );
  };

  const renderElement = (element: EditorElement) => {
    const commonProps = {
      key: element.id,
      'data-element-id': element.id,
      onClick: (e: React.MouseEvent) => handleElementMouseDown(e, element.id),
      style: {
        cursor: tool === 'select' ? 'move' : 'default',
      },
    };

    const isSelected = element.id === selectedElementId;
    const strokeWidth = isSelected ? (element.strokeWidth || 2) + 2 : (element.strokeWidth || 2);
    const opacity = element.opacity !== undefined ? element.opacity : 1;

    switch (element.type) {
      case 'rectangle':
        return (
          <rect
            {...commonProps}
            x={element.x}
            y={element.y}
            width={element.width || 100}
            height={element.height || 100}
            fill={element.fill || '#3b82f6'}
            stroke={isSelected ? '#ef4444' : (element.stroke || '#1e40af')}
            strokeWidth={strokeWidth}
            rx={4}
            ry={4}
            opacity={opacity}
          />
        );
      case 'circle':
        return (
          <circle
            {...commonProps}
            cx={element.x + (element.width || 100) / 2}
            cy={element.y + (element.height || 100) / 2}
            r={(element.width || 100) / 2}
            fill={element.fill || '#3b82f6'}
            stroke={isSelected ? '#ef4444' : (element.stroke || '#1e40af')}
            strokeWidth={strokeWidth}
            opacity={opacity}
          />
        );
      case 'line':
        return (
          <line
            {...commonProps}
            x1={element.x}
            y1={element.y}
            x2={element.x + (element.width || 100)}
            y2={element.y + (element.height || 100)}
            stroke={isSelected ? '#ef4444' : (element.stroke || '#1e40af')}
            strokeWidth={strokeWidth}
          />
        );
      case 'text':
        return (
          <g {...commonProps}>
            <text
              x={element.x}
              y={element.y + (element.fontSize || 16)}
              fill={element.fill || '#000000'}
              fontSize={element.fontSize || 16}
              fontFamily={element.fontFamily || 'Inter, sans-serif'}
              stroke={isSelected ? '#ef4444' : 'none'}
              strokeWidth={isSelected ? 1 : 0}
              opacity={opacity}
            >
              {element.text || 'Текст'}
            </text>
          </g>
        );
      case 'arrow':
        const arrowLength = Math.sqrt((element.width || 100) ** 2 + (element.height || 0) ** 2);
        const angle = Math.atan2(element.height || 0, element.width || 100);
        const arrowHeadSize = 10;
        return (
          <g {...commonProps}>
            <line
              x1={element.x}
              y1={element.y}
              x2={element.x + (element.width || 100)}
              y2={element.y + (element.height || 0)}
              stroke={isSelected ? '#ef4444' : (element.stroke || '#000000')}
              strokeWidth={strokeWidth}
              markerEnd="url(#arrowhead)"
              opacity={opacity}
            />
            <defs>
              <marker
                id="arrowhead"
                markerWidth={arrowHeadSize}
                markerHeight={arrowHeadSize}
                refX={arrowHeadSize}
                refY={arrowHeadSize / 2}
                orient="auto"
              >
                <polygon
                  points={`0 0, ${arrowHeadSize} ${arrowHeadSize / 2}, 0 ${arrowHeadSize}`}
                  fill={isSelected ? '#ef4444' : (element.stroke || '#000000')}
                />
              </marker>
            </defs>
          </g>
        );
      case 'idef0-box':
        return (
          <g {...commonProps}>
            <rect
              x={element.x}
              y={element.y}
              width={element.width || 200}
              height={element.height || 120}
              fill={element.fill || '#ffffff'}
              stroke={isSelected ? '#ef4444' : (element.stroke || '#000000')}
              strokeWidth={strokeWidth}
            />
            {element.text && (
              <text
                x={element.x + (element.width || 200) / 2}
                y={element.y + (element.height || 120) / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={element.fill || '#000000'}
                fontSize={element.fontSize || 14}
                fontFamily={element.fontFamily || 'Inter, sans-serif'}
              >
                {element.text}
              </text>
            )}
          </g>
        );
      case 'dfd-process':
      case 'dfd-data-store':
      case 'dfd-external':
        return (
          <g {...commonProps}>
            <rect
              x={element.x}
              y={element.y}
              width={element.width || 120}
              height={element.height || 80}
              fill={element.fill || '#ffffff'}
              stroke={isSelected ? '#ef4444' : (element.stroke || '#000000')}
              strokeWidth={strokeWidth}
              rx={element.type === 'dfd-process' ? 8 : 0}
            />
            {element.text && (
              <text
                x={element.x + (element.width || 120) / 2}
                y={element.y + (element.height || 80) / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#000000"
                fontSize={element.fontSize || 14}
                fontFamily={element.fontFamily || 'Inter, sans-serif'}
              >
                {element.text}
              </text>
            )}
          </g>
        );
      case 'bpmn-task':
        return (
          <g {...commonProps}>
            <rect
              x={element.x}
              y={element.y}
              width={element.width || 120}
              height={element.height || 60}
              fill={element.fill || '#ffffff'}
              stroke={isSelected ? '#ef4444' : (element.stroke || '#000000')}
              strokeWidth={strokeWidth}
              rx={4}
            />
            {element.text && (
              <text
                x={element.x + (element.width || 120) / 2}
                y={element.y + (element.height || 60) / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#000000"
                fontSize={element.fontSize || 14}
                fontFamily={element.fontFamily || 'Inter, sans-serif'}
              >
                {element.text}
              </text>
            )}
          </g>
        );
      case 'bpmn-event':
        return (
          <g {...commonProps}>
            <circle
              cx={element.x + (element.width || 40) / 2}
              cy={element.y + (element.height || 40) / 2}
              r={(element.width || 40) / 2}
              fill={element.fill || '#ffffff'}
              stroke={isSelected ? '#ef4444' : (element.stroke || '#000000')}
              strokeWidth={strokeWidth}
            />
          </g>
        );
      case 'bpmn-gateway':
        return (
          <g {...commonProps}>
            <polygon
              points={`
                ${element.x + (element.width || 50) / 2},${element.y}
                ${element.x + (element.width || 50)},${element.y + (element.height || 50) / 2}
                ${element.x + (element.width || 50) / 2},${element.y + (element.height || 50)}
                ${element.x},${element.y + (element.height || 50) / 2}
              `}
              fill={element.fill || '#ffffff'}
              stroke={isSelected ? '#ef4444' : (element.stroke || '#000000')}
              strokeWidth={strokeWidth}
            />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-50">
      {/* Левое меню */}
      {leftMenuOpen && (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          {/* Заголовок и кнопка назад */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{diagram.name}</h2>
              <button
                onClick={onBack}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Назад"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
            </div>
            <div className="text-sm text-gray-600 mb-2">Файл</div>
            <div className="space-y-1">
              <button 
                onClick={() => {
                  saveToHistory();
                  alert('Диаграмма сохранена');
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                <i className="fas fa-save mr-2"></i> Сохранить
              </button>
              <div className="px-3 py-2 text-xs text-gray-500">
                <div>Фон страницы:</div>
                <input
                  type="color"
                  value={currentPage.background || '#ffffff'}
                  onChange={(e) => {
                    const updatedPage = { ...currentPage, background: e.target.value };
                    saveToHistory();
                    onUpdatePage(updatedPage);
                  }}
                  className="w-full h-8 border border-gray-300 rounded mt-1"
                />
              </div>
              <div className="relative group">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between">
                  <span><i className="fas fa-download mr-2"></i> Экспорт</span>
                  <i className="fas fa-chevron-right text-xs"></i>
                </button>
                <div className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button
                    onClick={() => handleExport('svg')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                  >
                    <i className="fas fa-file-code mr-2"></i> SVG
                  </button>
                  <button
                    onClick={() => handleExport('png', 1)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                  >
                    <i className="fas fa-image mr-2"></i> PNG (стандартное)
                  </button>
                  <button
                    onClick={() => handleExport('png', 2)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                  >
                    <i className="fas fa-image mr-2"></i> PNG (высокое)
                  </button>
                  <button
                    onClick={() => handleExport('png', 3)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                  >
                    <i className="fas fa-image mr-2"></i> PNG (максимальное)
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                  >
                    <i className="fas fa-file-pdf mr-2"></i> PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Страницы */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => setPagesOpen(!pagesOpen)}
              className="w-full px-4 py-3 text-left flex items-center justify-between text-sm font-medium text-gray-900 hover:bg-gray-50"
            >
              <span>Страницы</span>
              <i className={`fas fa-chevron-${pagesOpen ? 'down' : 'right'} text-xs`}></i>
            </button>
            {pagesOpen && (
              <div className="pb-2">
                {diagram.pages.map((page) => (
                  <div
                    key={page.id}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-between group ${
                      page.id === currentPage.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                    onClick={() => onSwitchPage(page.id)}
                  >
                    {editingPageName === page.id ? (
                      <input
                        type="text"
                        value={page.name}
                        onBlur={() => {
                          const updatedPages = diagram.pages.map(p =>
                            p.id === page.id ? { ...p, name: page.name } : p
                          );
                          onUpdatePage({ ...currentPage, ...diagram, pages: updatedPages });
                          setEditingPageName(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const updatedPages = diagram.pages.map(p =>
                              p.id === page.id ? { ...p, name: page.name } : p
                            );
                            onUpdatePage({ ...currentPage, ...diagram, pages: updatedPages });
                            setEditingPageName(null);
                          } else if (e.key === 'Escape') {
                            setEditingPageName(null);
                          }
                        }}
                        onChange={(e) => {
                          const updatedPages = diagram.pages.map(p =>
                            p.id === page.id ? { ...p, name: e.target.value } : p
                          );
                          onUpdatePage({ ...currentPage, ...diagram, pages: updatedPages });
                        }}
                        className="flex-1 text-xs border border-blue-300 rounded px-1"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingPageName(page.id);
                        }}
                      >
                        {page.name}
                      </span>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {diagram.pages.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Удалить страницу?')) {
                              saveToHistory();
                              onDeletePage(page.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={onAddPage}
                  className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 text-left"
                >
                  <i className="fas fa-plus mr-2"></i> Добавить страницу
                </button>
              </div>
            )}
          </div>

          {/* Слои */}
          <div className="flex-1 overflow-y-auto">
            <button
              onClick={() => setLayersOpen(!layersOpen)}
              className="w-full px-4 py-3 text-left flex items-center justify-between text-sm font-medium text-gray-900 hover:bg-gray-50 border-b border-gray-200"
            >
              <span>Слои</span>
              <i className={`fas fa-chevron-${layersOpen ? 'down' : 'right'} text-xs`}></i>
            </button>
            {layersOpen && (
              <div className="p-2">
                {currentPage.elements.length === 0 ? (
                  <div className="text-sm text-gray-500 px-2 py-4 text-center">
                    Нет элементов
                  </div>
                ) : (
                  currentPage.elements
                    .slice()
                    .reverse()
                    .map((element) => (
                      <div
                        key={element.id}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 rounded mb-1 group ${
                          element.id === selectedElementId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                        onClick={() => onSelectElement(element.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1 min-w-0">
                            {element.locked && (
                              <i className="fas fa-lock text-xs mr-1 text-gray-400"></i>
                            )}
                            <i className={`fas fa-${
                              element.type === 'rectangle' ? 'square' :
                              element.type === 'circle' ? 'circle' :
                              element.type === 'line' ? 'minus' :
                              element.type === 'arrow' ? 'arrow-right' :
                              'font'
                            } mr-2 flex-shrink-0`}></i>
                            {editingLayerName === element.id ? (
                              <input
                                type="text"
                                value={element.name || ''}
                                onBlur={() => {
                                  if (element.name !== undefined) {
                                    onUpdateElement(element.id, { name: element.name });
                                  }
                                  setEditingLayerName(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (element.name !== undefined) {
                                      onUpdateElement(element.id, { name: element.name });
                                    }
                                    setEditingLayerName(null);
                                  } else if (e.key === 'Escape') {
                                    setEditingLayerName(null);
                                  }
                                }}
                                onChange={(e) => onUpdateElement(element.id, { name: e.target.value })}
                                className="flex-1 text-xs border border-blue-300 rounded px-1"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span
                                className="truncate flex-1"
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setEditingLayerName(element.id);
                                }}
                              >
                                {element.name || (element.type === 'text' ? element.text || 'Текст' : element.type)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateElement(element.id, { locked: !element.locked });
                              }}
                              className="text-gray-500 hover:text-gray-700"
                              title={element.locked ? 'Разблокировать' : 'Заблокировать'}
                            >
                              <i className={`fas fa-${element.locked ? 'unlock' : 'lock'} text-xs`}></i>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                saveToHistory();
                                onDeleteElement(element.id);
                              }}
                              className="text-red-500 hover:text-red-700"
                              title="Удалить"
                            >
                              <i className="fas fa-trash text-xs"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Центральная область - холст */}
      <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden">
        {/* Верхняя панель */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLeftMenuOpen(!leftMenuOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <i className="fas fa-bars"></i>
            </button>
            <span className="text-sm text-gray-600">{currentPage.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Отменить (Ctrl+Z)"
            >
              <i className="fas fa-undo"></i>
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Повторить (Ctrl+Y)"
            >
              <i className="fas fa-redo"></i>
            </button>
            <div className="w-px h-6 bg-gray-300"></div>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded ${showGrid ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
              title="Показать/скрыть сетку"
            >
              <i className="fas fa-th"></i>
            </button>
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`p-2 rounded ${snapToGrid ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
              title="Привязка к сетке"
            >
              <i className="fas fa-magnet"></i>
            </button>
            <div className="w-px h-6 bg-gray-300"></div>
            <button
              onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <i className="fas fa-minus"></i>
            </button>
            <span className="text-sm text-gray-600 w-16 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(4, zoom + 0.25))}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <i className="fas fa-plus"></i>
            </button>
            <button
              onClick={() => setZoom(1)}
              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              100%
            </button>
          </div>
          <div className="text-xs text-gray-500">
            X: {Math.round(mousePosition.x)} Y: {Math.round(mousePosition.y)}
          </div>
        </div>

        {/* Холст */}
        <div className="flex-1 overflow-auto bg-gray-100">
          <div className="flex items-center justify-center h-full p-8">
            <svg
              ref={canvasRef}
              width={currentPage.width}
              height={currentPage.height}
              viewBox={`0 0 ${currentPage.width} ${currentPage.height}`}
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: 'top left',
                backgroundColor: currentPage.background || '#ffffff',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                cursor: tool === 'select' ? 'default' : 'crosshair',
              }}
              onClick={handleCanvasClick}
            >
              {/* Сетка */}
              {showGrid && (
                <defs>
                  <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                    <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.5" />
                  </pattern>
                </defs>
              )}
              {showGrid && (
                <rect width="100%" height="100%" fill="url(#grid)" />
              )}
              {currentPage.elements.map(renderElement)}
              {selectedElement && renderResizeHandles(selectedElement)}
            </svg>
          </div>
        </div>

        {/* Нижняя панель инструментов */}
        <div className="h-16 bg-white border-t border-gray-200 flex items-center justify-center gap-4 px-4">
          <button
            onClick={() => setTool('select')}
            className={`p-3 rounded-lg transition-colors ${
              tool === 'select' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Курсор"
          >
            <i className="fas fa-mouse-pointer"></i>
          </button>
          <button
            onClick={() => setTool('rectangle')}
            className={`p-3 rounded-lg transition-colors ${
              tool === 'rectangle' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Прямоугольник"
          >
            <i className="fas fa-square"></i>
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-3 rounded-lg transition-colors ${
              tool === 'circle' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Круг"
          >
            <i className="fas fa-circle"></i>
          </button>
          <button
            onClick={() => setTool('line')}
            className={`p-3 rounded-lg transition-colors ${
              tool === 'line' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Линия (L)"
          >
            <i className="fas fa-minus"></i>
          </button>
          <button
            onClick={() => setTool('arrow')}
            className={`p-3 rounded-lg transition-colors ${
              tool === 'arrow' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Стрелка"
          >
            <i className="fas fa-arrow-right"></i>
          </button>
          <button
            onClick={() => setTool('text')}
            className={`p-3 rounded-lg transition-colors ${
              tool === 'text' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Текст"
          >
            <i className="fas fa-font"></i>
          </button>
          <div className="w-px h-8 bg-gray-300"></div>
          <button
            className="p-3 rounded-lg text-gray-600 hover:bg-gray-100"
            title="Шаблоны"
          >
            <i className="fas fa-layer-group"></i>
          </button>
          <button
            className="p-3 rounded-lg text-gray-600 hover:bg-gray-100"
            title="Комментарии"
          >
            <i className="fas fa-comment"></i>
          </button>
        </div>
      </div>

      {/* Правое меню - настройки */}
      {rightMenuOpen && selectedElement && (
        <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Настройки элемента</h3>
            <button
              onClick={() => setRightMenuOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Позиция X</label>
              <input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => selectedElementId && onUpdateElement(selectedElementId, { x: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Позиция Y</label>
              <input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => selectedElementId && onUpdateElement(selectedElementId, { y: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            {selectedElement.width !== undefined && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ширина</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.width)}
                  onChange={(e) => selectedElementId && onUpdateElement(selectedElementId, { width: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
            )}
            {selectedElement.height !== undefined && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Высота</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.height)}
                  onChange={(e) => selectedElementId && onUpdateElement(selectedElementId, { height: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Заливка</label>
              <input
                type="color"
                value={selectedElement.fill || '#3b82f6'}
                onChange={(e) => selectedElementId && onUpdateElement(selectedElementId, { fill: e.target.value })}
                className="w-full h-8 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Обводка</label>
              <input
                type="color"
                value={selectedElement.stroke || '#1e40af'}
                onChange={(e) => selectedElementId && onUpdateElement(selectedElementId, { stroke: e.target.value })}
                className="w-full h-8 border border-gray-300 rounded"
              />
            </div>
            {selectedElement.type === 'text' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Текст</label>
                <textarea
                  value={selectedElement.text || ''}
                  onChange={(e) => selectedElementId && onUpdateElement(selectedElementId, { text: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  rows={3}
                />
              </div>
            )}
            {selectedElement.type === 'text' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Размер шрифта</label>
                <input
                  type="number"
                  value={selectedElement.fontSize || 16}
                  onChange={(e) => selectedElementId && onUpdateElement(selectedElementId, { fontSize: parseFloat(e.target.value) || 16 })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Название</label>
              <input
                type="text"
                value={selectedElement.name || ''}
                onChange={(e) => selectedElementId && onUpdateElement(selectedElementId, { name: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="Название элемента"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Прозрачность</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedElement.opacity !== undefined ? selectedElement.opacity : 1}
                onChange={(e) => selectedElementId && onUpdateElement(selectedElementId, { opacity: parseFloat(e.target.value) })}
                className="w-full"
              />
              <span className="text-xs text-gray-500">
                {Math.round((selectedElement.opacity !== undefined ? selectedElement.opacity : 1) * 100)}%
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Толщина обводки</label>
              <input
                type="number"
                min="0"
                value={selectedElement.strokeWidth || 2}
                onChange={(e) => selectedElementId && onUpdateElement(selectedElementId, { strokeWidth: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => selectedElementId && onUpdateElement(selectedElementId, { locked: !selectedElement.locked })}
                className={`flex-1 px-3 py-2 text-xs rounded ${
                  selectedElement.locked
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <i className={`fas fa-${selectedElement.locked ? 'lock' : 'unlock'} mr-1`}></i>
                {selectedElement.locked ? 'Заблокирован' : 'Заблокировать'}
              </button>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-2">Выравнивание</div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => {
                    if (selectedElementId && selectedElement.width !== undefined) {
                      const leftmost = Math.min(...currentPage.elements.map(el => el.x));
                      onUpdateElement(selectedElementId, { x: leftmost });
                    }
                  }}
                  className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  title="По левому краю"
                >
                  <i className="fas fa-align-left"></i>
                </button>
                <button
                  onClick={() => {
                    if (selectedElementId && selectedElement.width !== undefined) {
                      const centerX = currentPage.width / 2 - (selectedElement.width || 0) / 2;
                      onUpdateElement(selectedElementId, { x: centerX });
                    }
                  }}
                  className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  title="По центру"
                >
                  <i className="fas fa-align-center"></i>
                </button>
                <button
                  onClick={() => {
                    if (selectedElementId && selectedElement.width !== undefined) {
                      const rightmost = Math.max(...currentPage.elements.map(el => (el.x + (el.width || 0))));
                      onUpdateElement(selectedElementId, { x: rightmost - (selectedElement.width || 0) });
                    }
                  }}
                  className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  title="По правому краю"
                >
                  <i className="fas fa-align-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!rightMenuOpen && !selectedElement && (
        <div className="w-12 bg-white border-l border-gray-200 flex flex-col items-center py-4">
          <button
            onClick={() => setRightMenuOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Показать настройки"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
        </div>
      )}
    </div>
  );
}
