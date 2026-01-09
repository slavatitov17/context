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
  onUpdatePageName?: (pageId: string, name: string) => void;
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
  onUpdatePageName,
  onBack,
}: EditorCanvasProps) {
  const [tool, setTool] = useState<'select' | 'rectangle' | 'circle' | 'line' | 'text' | 'arrow' | 'comment'>('select');
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
  const [editingDiagramName, setEditingDiagramName] = useState(false);
  const [diagramTypeFilter, setDiagramTypeFilter] = useState<'all' | 'IDEF0' | 'DFD' | 'BPMN' | 'Custom'>(diagram.diagramType || 'all');
  const [toolMode, setToolMode] = useState<'select' | 'pan' | 'draw'>('select');
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'svg' | 'png' | 'pdf' | 'ctxdr'>('svg');
  const [exportScope, setExportScope] = useState<'page' | 'all' | 'selection'>('page');
  const [showSaveTooltip, setShowSaveTooltip] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(true);
  const [componentsOpen, setComponentsOpen] = useState(true);
  const [componentsExpanded, setComponentsExpanded] = useState<'IDEF0' | 'DFD' | 'BPMN' | null>(null);
  const [leftMenuCollapsed, setLeftMenuCollapsed] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const initialPageStateRef = useRef<string>('');

  const selectedElement = currentPage.elements.find(el => el.id === selectedElementId);

  // Отслеживание изменений
  useEffect(() => {
    const currentState = JSON.stringify(currentPage);
    if (initialPageStateRef.current === '') {
      initialPageStateRef.current = currentState;
      setIsSaved(true);
    } else if (initialPageStateRef.current !== currentState) {
      setIsSaved(false);
    }
  }, [currentPage]);

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
    if (toolMode === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (tool === 'select' || toolMode === 'select') {
      const element = currentPage.elements.find(el => el.id === elementId);
      if (element?.locked) return;
      
      // Двойной клик по тексту для редактирования
      if (e.detail === 2 && element && element.type === 'text') {
        // Переход в режим редактирования текста
        const textElement = e.target as SVGTextElement;
        // Можно добавить input поверх текста для редактирования
        return;
      }
      
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

    // Панорамирование
    if (isPanning && toolMode === 'pan') {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      setPan({
        x: pan.x + deltaX,
        y: pan.y + deltaY,
      });
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isDragging && selectedElementId && tool === 'select' && !isResizing && toolMode !== 'pan') {
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
      const maintainAspectRatio = e.shiftKey; // Shift для сохранения пропорций

      switch (resizeHandle) {
        case 'nw':
          if (maintainAspectRatio) {
            const aspectRatio = (selectedElement.width || 100) / (selectedElement.height || 100);
            const newWidth = snapToGridValue((selectedElement.width || 100) - deltaX);
            const newHeight = newWidth / aspectRatio;
            updates = {
              x: snapToGridValue(selectedElement.x + deltaX),
              y: snapToGridValue(selectedElement.y + deltaY),
              width: newWidth,
              height: snapToGridValue(newHeight),
            };
          } else {
            updates = {
              x: snapToGridValue(selectedElement.x + deltaX),
              y: snapToGridValue(selectedElement.y + deltaY),
              width: snapToGridValue((selectedElement.width || 100) - deltaX),
              height: snapToGridValue((selectedElement.height || 100) - deltaY),
            };
          }
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
          if (maintainAspectRatio) {
            const aspectRatio = (selectedElement.width || 100) / (selectedElement.height || 100);
            const newWidth = snapToGridValue((selectedElement.width || 100) + deltaX);
            const newHeight = newWidth / aspectRatio;
            updates = {
              width: newWidth,
              height: snapToGridValue(newHeight),
            };
          } else {
            updates = {
              width: snapToGridValue((selectedElement.width || 100) + deltaX),
              height: snapToGridValue((selectedElement.height || 100) + deltaY),
            };
          }
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
    setIsPanning(false);
    setResizeHandle(null);
  }, [isDragging, isResizing, isPanning, saveToHistory]);

  useEffect(() => {
    if (isDragging || isResizing || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, isPanning, handleMouseMove, handleMouseUp]);

  // Масштабирование колесиком мыши (Alt + колесико для масштабирования относительно указателя)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        
        if (e.altKey) {
          // Масштабирование относительно указателя мыши
          const container = containerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const newZoom = Math.max(0.25, Math.min(4, zoom + delta));
            const zoomFactor = newZoom / zoom;
            
            setPan({
              x: mouseX - (mouseX - pan.x) * zoomFactor,
              y: mouseY - (mouseY - pan.y) * zoomFactor,
            });
            setZoom(newZoom);
          }
        } else {
          setZoom(prev => Math.max(0.25, Math.min(4, prev + delta)));
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [zoom, pan]);

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
      else if (e.key === 'v' || e.key === 'V') {
        setTool('select');
        setToolMode('select');
      } else if (e.key === 'h' || e.key === 'H') {
        setToolMode('pan');
        setTool('select');
      } else if (e.key === 'r' || e.key === 'R') {
        setTool('rectangle');
        setToolMode('draw');
      } else if (e.key === 'o' || e.key === 'O') {
        setTool('circle');
        setToolMode('draw');
      } else if (e.key === 'l' || e.key === 'L') {
        setTool('line');
        setToolMode('draw');
      } else if (e.key === 't' || e.key === 'T') {
        setTool('text');
        setToolMode('draw');
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
        const labelPosition = element.dfdLabelPosition !== undefined ? element.dfdLabelPosition : 0.5;
        const labelX = element.x + (element.width || 100) * labelPosition;
        const labelY = element.y + (element.height || 0) * labelPosition;
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
            {element.dfdLabel && (
              <text
                x={labelX}
                y={labelY - 5}
                fill={element.stroke || '#000000'}
                fontSize={12}
                fontFamily="Inter, sans-serif"
                textAnchor="middle"
                className="pointer-events-none"
              >
                {element.dfdLabel}
              </text>
            )}
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
              opacity={opacity}
            />
            {element.idef0Number && (
              <text
                x={element.x + 10}
                y={element.y + 20}
                fill="#000000"
                fontSize={12}
                fontFamily={element.fontFamily || 'Inter, sans-serif'}
                fontWeight="bold"
              >
                {element.idef0Number}
              </text>
            )}
            {element.text && (
              <text
                x={element.x + (element.width || 200) / 2}
                y={element.y + (element.height || 120) / 2}
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
        <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${leftMenuCollapsed ? 'w-16' : 'w-64'}`} style={{ overflow: 'visible' }}>
          {/* Заголовок с названием диаграммы и иконкой скрытия */}
          {!leftMenuCollapsed && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                {editingDiagramName ? (
                  <input
                    type="text"
                    value={diagram.name}
                    onBlur={() => {
                      setEditingDiagramName(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setEditingDiagramName(false);
                      } else if (e.key === 'Escape') {
                        setEditingDiagramName(false);
                      }
                    }}
                    onChange={(e) => {
                      // Обновление названия через callback если нужен
                    }}
                    className="flex-1 text-base text-gray-600 border border-blue-300 rounded px-2 py-1"
                    autoFocus
                  />
                ) : (
                  <span
                    className="text-base text-gray-600 flex-1 cursor-pointer hover:text-blue-600 transition-colors"
                    onDoubleClick={() => setEditingDiagramName(true)}
                    title="Двойной клик для редактирования"
                  >
                    {diagram.name}
                  </span>
                )}
                <button
                  onClick={() => setLeftMenuCollapsed(true)}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded ml-2 transition-colors"
                  title="Скрыть меню"
                >
                  <i className="fas fa-chevron-left text-sm"></i>
                </button>
              </div>
            </div>
          )}
          
          {leftMenuCollapsed && (
            <div className="p-2 border-b border-gray-200">
              <button
                onClick={() => setLeftMenuCollapsed(false)}
                className="w-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center justify-center"
                title="Развернуть меню"
              >
                <i className="fas fa-chevron-right text-sm"></i>
              </button>
            </div>
          )}

            {/* Блок "Действия" */}
            <div className="px-2 mt-3">
              {!leftMenuCollapsed && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Действия</span>
                  <button
                    onClick={() => setActionsOpen(!actionsOpen)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <i className={`fas fa-chevron-${actionsOpen ? 'down' : 'right'} text-xs transition-transform duration-200`}></i>
                  </button>
                </div>
              )}
              <div className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${actionsOpen ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="relative">
                  <button 
                    onClick={() => {
                      saveToHistory();
                      initialPageStateRef.current = JSON.stringify(currentPage);
                      setIsSaved(true);
                      setShowSaveTooltip(true);
                      setTimeout(() => {
                        setShowSaveTooltip(false);
                      }, 2000);
                    }}
                    className={`w-full text-left py-3.5 px-4 rounded-xl flex items-center gap-3 transition-all duration-200 group ${leftMenuCollapsed ? 'justify-center' : ''} text-gray-800 hover:bg-blue-600 hover:text-white`}
                    title={leftMenuCollapsed ? 'Сохранить' : ''}
                  >
                    <i className="fas fa-save text-gray-600 group-hover:text-white transition-colors"></i>
                    {!leftMenuCollapsed && <span className="font-medium">Сохранить</span>}
                  </button>
                  {showSaveTooltip && (
                    <div className={`absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 z-50 transition-all duration-300 ${showSaveTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                      <i className="fas fa-check text-green-400"></i>
                      <span>Изменения сохранены</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowExportDialog(true)}
                  className={`w-full text-left py-3.5 px-4 rounded-xl flex items-center gap-3 transition-all duration-200 group ${leftMenuCollapsed ? 'justify-center' : ''} text-gray-800 hover:bg-blue-600 hover:text-white`}
                  title={leftMenuCollapsed ? 'Экспорт' : ''}
                >
                  <i className="fas fa-download text-gray-600 group-hover:text-white transition-colors"></i>
                  {!leftMenuCollapsed && <span className="font-medium">Экспорт</span>}
                </button>
              </div>
            </div>

            {/* Девайдер */}
            {!leftMenuCollapsed && (
              <div className="border-t border-gray-200 my-3"></div>
            )}

            {/* Блок "Компоненты" */}
            {!leftMenuCollapsed && (
              <div className="px-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Компоненты</span>
                  <button
                    onClick={() => setComponentsOpen(!componentsOpen)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <i className={`fas fa-chevron-${componentsOpen ? 'down' : 'right'} text-xs transition-transform duration-200`}></i>
                  </button>
                </div>
                <div className={`space-y-1 transition-all duration-300 ease-in-out ${componentsOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`} style={{ position: 'relative' }}>
                  <div className="relative" style={{ zIndex: componentsExpanded ? 10 : 1 }}>
                    <button
                      onClick={() => setComponentsExpanded(componentsExpanded === 'IDEF0' ? null : 'IDEF0')}
                      className="w-full text-left py-3.5 px-4 rounded-xl flex items-center gap-3 transition-all duration-200 group text-gray-800 hover:bg-blue-600 hover:text-white justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <i className="fas fa-sitemap text-gray-600 group-hover:text-white transition-colors"></i>
                        <span className="font-medium">IDEF0</span>
                      </div>
                      <i className={`fas fa-chevron-${componentsExpanded === 'IDEF0' ? 'down' : 'right'} text-xs`}></i>
                    </button>
                    {componentsExpanded === 'IDEF0' && (
                      <div className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[200px]">
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'idef0-box',
                              x: 100,
                              y: 100,
                              width: 200,
                              height: 120,
                              text: 'Функция',
                              fill: '#ffffff',
                              stroke: '#000000',
                              strokeWidth: 2,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Функциональный блок
                        </button>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'rectangle',
                              x: 100,
                              y: 100,
                              width: 80,
                              height: 30,
                              text: 'Вход',
                              fill: '#e3f2fd',
                              stroke: '#1976d2',
                              strokeWidth: 1,
                              fontSize: 12,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Вход
                        </button>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'rectangle',
                              x: 100,
                              y: 100,
                              width: 80,
                              height: 30,
                              text: 'Выход',
                              fill: '#fff3e0',
                              stroke: '#f57c00',
                              strokeWidth: 1,
                              fontSize: 12,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Выход
                        </button>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'rectangle',
                              x: 100,
                              y: 100,
                              width: 100,
                              height: 30,
                              text: 'Управление',
                              fill: '#f3e5f5',
                              stroke: '#7b1fa2',
                              strokeWidth: 1,
                              fontSize: 12,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Управление
                        </button>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'rectangle',
                              x: 100,
                              y: 100,
                              width: 100,
                              height: 30,
                              text: 'Механизм',
                              fill: '#e8f5e9',
                              stroke: '#388e3c',
                              strokeWidth: 1,
                              fontSize: 12,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Механизм
                        </button>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'text',
                              x: 100,
                              y: 100,
                              text: 'Текст',
                              fill: '#000000',
                              fontSize: 16,
                              fontFamily: 'Inter, sans-serif',
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Текст
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setComponentsExpanded(componentsExpanded === 'DFD' ? null : 'DFD')}
                      className="w-full text-left py-3.5 px-4 rounded-xl flex items-center gap-3 transition-all duration-200 group text-gray-800 hover:bg-blue-600 hover:text-white justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <i className="fas fa-project-diagram text-gray-600 group-hover:text-white transition-colors"></i>
                        <span className="font-medium">DFD</span>
                      </div>
                      <i className={`fas fa-chevron-${componentsExpanded === 'DFD' ? 'down' : 'right'} text-xs`}></i>
                    </button>
                    {componentsExpanded === 'DFD' && (
                      <div className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[200px]">
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'dfd-external',
                              x: 100,
                              y: 100,
                              width: 100,
                              height: 60,
                              text: 'Внешняя сущность',
                              fill: '#ffffff',
                              stroke: '#000000',
                              strokeWidth: 2,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Внешние сущности
                        </button>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'dfd-data-store',
                              x: 100,
                              y: 100,
                              width: 100,
                              height: 60,
                              text: 'Хранилище',
                              fill: '#ffffff',
                              stroke: '#000000',
                              strokeWidth: 2,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Хранилища
                        </button>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'dfd-process',
                              x: 100,
                              y: 100,
                              width: 120,
                              height: 80,
                              text: 'Процесс',
                              fill: '#ffffff',
                              stroke: '#000000',
                              strokeWidth: 2,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Процессы
                        </button>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'arrow',
                              x: 100,
                              y: 100,
                              width: 100,
                              height: 0,
                              stroke: '#000000',
                              strokeWidth: 2,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Поток данных
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setComponentsExpanded(componentsExpanded === 'BPMN' ? null : 'BPMN')}
                      className="w-full text-left py-3.5 px-4 rounded-xl flex items-center gap-3 transition-all duration-200 group text-gray-800 hover:bg-blue-600 hover:text-white justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <i className="fas fa-diagram-project text-gray-600 group-hover:text-white transition-colors"></i>
                        <span className="font-medium">BPMN</span>
                      </div>
                      <i className={`fas fa-chevron-${componentsExpanded === 'BPMN' ? 'down' : 'right'} text-xs`}></i>
                    </button>
                    {componentsExpanded === 'BPMN' && (
                      <div className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[250px] max-h-96 overflow-y-auto">
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">События</div>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'bpmn-event',
                              x: 100,
                              y: 100,
                              width: 40,
                              height: 40,
                              fill: '#4caf50',
                              stroke: '#2e7d32',
                              strokeWidth: 2,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Стартовые
                        </button>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'bpmn-event',
                              x: 100,
                              y: 100,
                              width: 40,
                              height: 40,
                              fill: '#2196f3',
                              stroke: '#1565c0',
                              strokeWidth: 2,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Промежуточные
                        </button>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'bpmn-event',
                              x: 100,
                              y: 100,
                              width: 40,
                              height: 40,
                              fill: '#f44336',
                              stroke: '#c62828',
                              strokeWidth: 2,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Завершающие
                        </button>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'bpmn-event',
                              x: 100,
                              y: 100,
                              width: 40,
                              height: 40,
                              fill: '#ff9800',
                              stroke: '#e65100',
                              strokeWidth: 2,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Сообщение
                        </button>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'bpmn-event',
                              x: 100,
                              y: 100,
                              width: 40,
                              height: 40,
                              fill: '#9c27b0',
                              stroke: '#6a1b9a',
                              strokeWidth: 2,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Таймер
                        </button>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'bpmn-event',
                              x: 100,
                              y: 100,
                              width: 40,
                              height: 40,
                              fill: '#e91e63',
                              stroke: '#880e4f',
                              strokeWidth: 2,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Ошибка
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Действия</div>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'bpmn-task',
                              x: 100,
                              y: 100,
                              width: 120,
                              height: 60,
                              text: 'Задача',
                              fill: '#ffffff',
                              stroke: '#000000',
                              strokeWidth: 2,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Обычные
                        </button>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'bpmn-task',
                              x: 100,
                              y: 100,
                              width: 120,
                              height: 60,
                              text: 'Подпроцесс',
                              fill: '#ffffff',
                              stroke: '#000000',
                              strokeWidth: 3,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Подпроцессы
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Шлюзы</div>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'bpmn-gateway',
                              x: 100,
                              y: 100,
                              width: 50,
                              height: 50,
                              fill: '#ffffff',
                              stroke: '#000000',
                              strokeWidth: 2,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Исключающее ИЛИ
                        </button>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'bpmn-gateway',
                              x: 100,
                              y: 100,
                              width: 50,
                              height: 50,
                              fill: '#ffffff',
                              stroke: '#000000',
                              strokeWidth: 2,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          И
                        </button>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'bpmn-gateway',
                              x: 100,
                              y: 100,
                              width: 50,
                              height: 50,
                              fill: '#ffffff',
                              stroke: '#000000',
                              strokeWidth: 2,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          ИЛИ
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'arrow',
                              x: 100,
                              y: 100,
                              width: 100,
                              height: 0,
                              stroke: '#000000',
                              strokeWidth: 2,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Потоки
                        </button>
                        <button
                          onClick={() => {
                            const newElement: EditorElement = {
                              id: `element_${Date.now()}`,
                              type: 'rectangle',
                              x: 100,
                              y: 100,
                              width: 200,
                              height: 100,
                              text: 'Пул',
                              fill: '#ffffff',
                              stroke: '#000000',
                              strokeWidth: 2,
                              zIndex: currentPage.elements.length,
                              opacity: 1,
                            };
                            saveToHistory();
                            onAddElement(newElement);
                            onSelectElement(newElement.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Пулы
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Девайдер */}
            {!leftMenuCollapsed && (
              <div className="border-t border-gray-200 my-3"></div>
            )}

          {/* Блок "Слои" */}
          {!leftMenuCollapsed && (
            <div className="flex-1 overflow-y-auto flex flex-col px-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Слои</span>
                <button
                  onClick={() => setLayersOpen(!layersOpen)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className={`fas fa-chevron-${layersOpen ? 'down' : 'right'} text-xs transition-transform duration-200`}></i>
                </button>
              </div>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${layersOpen ? 'flex-1 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pb-2">
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
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 rounded mb-1 group transition-colors ${
                            element.id === selectedElementId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                          onClick={() => onSelectElement(element.id)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center flex-1 min-w-0">
                              {element.locked && (
                                <i className="fas fa-lock text-xs mr-1 text-gray-400"></i>
                              )}
                              <i className={`fas fa-${
                                element.type === 'rectangle' ? 'square' :
                                element.type === 'circle' ? 'circle' :
                                element.type === 'line' ? 'minus' :
                                element.type === 'arrow' ? 'arrow-right' :
                                element.type === 'idef0-box' ? 'sitemap' :
                                element.type === 'dfd-process' || element.type === 'dfd-data-store' || element.type === 'dfd-external' ? 'project-diagram' :
                                element.type === 'bpmn-task' || element.type === 'bpmn-event' || element.type === 'bpmn-gateway' ? 'diagram-project' :
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
              </div>
            </div>
          )}
            
          {/* Кнопка "Выйти из редактора" */}
          <div className="mt-auto pt-2 pb-2 px-2">
            <button
              onClick={() => {
                if (isSaved) {
                  onBack();
                } else {
                  setShowExitModal(true);
                }
              }}
              className={`w-full text-left py-3.5 px-4 rounded-xl flex items-center gap-3 transition-all duration-200 group ${leftMenuCollapsed ? 'justify-center' : ''} text-gray-800 hover:bg-blue-600 hover:text-white`}
              title={leftMenuCollapsed ? 'Выйти из редактора' : ''}
            >
              <i className="fas fa-sign-out-alt text-gray-600 group-hover:text-white transition-colors"></i>
              {!leftMenuCollapsed && <span className="font-medium">Выйти из редактора</span>}
            </button>
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
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            {/* Переключатель типа диаграммы */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDiagramTypeFilter('all')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  diagramTypeFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setDiagramTypeFilter('IDEF0')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  diagramTypeFilter === 'IDEF0' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                IDEF0
              </button>
              <button
                onClick={() => setDiagramTypeFilter('DFD')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  diagramTypeFilter === 'DFD' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                DFD
              </button>
              <button
                onClick={() => setDiagramTypeFilter('BPMN')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  diagramTypeFilter === 'BPMN' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                BPMN
              </button>
              <button
                onClick={() => setDiagramTypeFilter('Custom')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  diagramTypeFilter === 'Custom' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Произвольная
              </button>
            </div>
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
            onClick={() => {
              setTool('select');
              setToolMode('select');
            }}
            className={`p-3 rounded-lg transition-colors ${
              tool === 'select' && toolMode === 'select' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Курсор (V)"
          >
            <i className="fas fa-mouse-pointer"></i>
          </button>
          <button
            onClick={() => {
              setToolMode('pan');
              setTool('select');
            }}
            className={`p-3 rounded-lg transition-colors ${
              toolMode === 'pan' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Рука для панорамирования (H)"
          >
            <i className="fas fa-hand"></i>
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
            onClick={() => setTool('arrow')}
            className={`p-3 rounded-lg transition-colors ${
              tool === 'arrow' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Соединительная линия"
          >
            <i className="fas fa-project-diagram"></i>
          </button>
          <button
            className="p-3 rounded-lg text-gray-600 hover:bg-gray-100"
            title="Шаблоны"
          >
            <i className="fas fa-layer-group"></i>
          </button>
          <button
            onClick={() => setTool('comment')}
            className={`p-3 rounded-lg transition-colors ${
              tool === 'comment' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Комментарий"
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
                  className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-transform hover:scale-105"
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
                  className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-transform hover:scale-105"
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
                  className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-transform hover:scale-105"
                  title="По правому краю"
                >
                  <i className="fas fa-align-right"></i>
                </button>
              </div>
            </div>

            {/* IDEF0 специфичные поля */}
            {selectedElement.type === 'idef0-box' && (
              <div className="pt-2 border-t border-gray-200 space-y-3">
                <div className="text-xs font-medium text-gray-700 mb-2">IDEF0 свойства</div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Номер (A1, A2...)</label>
                  <input
                    type="text"
                    value={selectedElement.idef0Number || ''}
                    onChange={(e) => selectedElementId && onUpdateElement(selectedElementId, { idef0Number: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    placeholder="A1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Название функции</label>
                  <input
                    type="text"
                    value={selectedElement.text || ''}
                    onChange={(e) => selectedElementId && onUpdateElement(selectedElementId, { text: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    placeholder="Название функции"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Детализация (ID диаграммы)</label>
                  <input
                    type="text"
                    value={selectedElement.idef0DetailDiagramId || ''}
                    onChange={(e) => selectedElementId && onUpdateElement(selectedElementId, { idef0DetailDiagramId: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    placeholder="ID диаграммы детализации"
                  />
                  <p className="text-xs text-gray-500 mt-1">Ссылка на другую диаграмму в системе</p>
                </div>
              </div>
            )}

            {/* DFD специфичные поля для стрелок */}
            {selectedElement.type === 'arrow' && diagram.diagramType === 'DFD' && (
              <div className="pt-2 border-t border-gray-200 space-y-3">
                <div className="text-xs font-medium text-gray-700 mb-2">DFD свойства</div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Метка на стрелке</label>
                  <input
                    type="text"
                    value={selectedElement.dfdLabel || ''}
                    onChange={(e) => selectedElementId && onUpdateElement(selectedElementId, { dfdLabel: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    placeholder="Название потока данных"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Позиция метки (0-1)</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedElement.dfdLabelPosition !== undefined ? selectedElement.dfdLabelPosition : 0.5}
                    onChange={(e) => selectedElementId && onUpdateElement(selectedElementId, { dfdLabelPosition: parseFloat(e.target.value) || 0.5 })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Правая панель - свойства страницы (когда ничего не выбрано) */}
      {rightMenuOpen && !selectedElement && (
        <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Свойства страницы</h3>
            <button
              onClick={() => setRightMenuOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Название страницы</label>
              <input
                type="text"
                value={currentPage.name}
                onChange={(e) => {
                  const updatedPage = { ...currentPage, name: e.target.value };
                  onUpdatePage(updatedPage);
                }}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ширина</label>
              <input
                type="number"
                value={currentPage.width}
                onChange={(e) => {
                  const updatedPage = { ...currentPage, width: parseFloat(e.target.value) || 1920 };
                  onUpdatePage(updatedPage);
                }}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Высота</label>
              <input
                type="number"
                value={currentPage.height}
                onChange={(e) => {
                  const updatedPage = { ...currentPage, height: parseFloat(e.target.value) || 1080 };
                  onUpdatePage(updatedPage);
                }}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Цвет фона</label>
              <input
                type="color"
                value={currentPage.background || '#ffffff'}
                onChange={(e) => {
                  const updatedPage = { ...currentPage, background: e.target.value };
                  onUpdatePage(updatedPage);
                }}
                className="w-full h-8 border border-gray-300 rounded"
              />
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

      {/* Модальное окно выхода */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Блюр фон */}
          <div 
            className="absolute inset-0 bg-white/80 backdrop-blur-sm"
            onClick={() => setShowExitModal(false)}
          />
          
          {/* Модальное окно */}
          <div className="relative bg-white border border-gray-200 rounded-xl p-6 max-w-lg w-full shadow-xl z-10">
            <div className="relative mb-6">
              <button
                onClick={() => setShowExitModal(false)}
                className="absolute right-0 top-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-medium text-gray-900 text-center">Выйти из редактора?</h2>
            </div>
            
            <div className="space-y-6">
              <p className="text-base text-gray-600 text-center">
                Все несохраненные данные будут утеряны
              </p>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    saveToHistory();
                    initialPageStateRef.current = JSON.stringify(currentPage);
                    setIsSaved(true);
                    setShowExitModal(false);
                    onBack();
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Сохранить и выйти
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Диалог экспорта */}
      {showExportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Блюр фон */}
          <div 
            className="absolute inset-0 bg-white/80 backdrop-blur-sm"
            onClick={() => setShowExportDialog(false)}
          />
          
          {/* Модальное окно */}
          <div className="relative bg-white border border-gray-200 rounded-xl p-6 max-w-lg w-full shadow-xl z-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-gray-900">Экспорт диаграммы</h2>
              <button
                onClick={() => setShowExportDialog(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-gray-900 font-medium mb-3">Формат</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExportFormat('svg')}
                    className={`p-4 border rounded-lg text-base transition-colors flex items-center justify-center gap-2 ${
                      exportFormat === 'svg' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <i className="fas fa-file-code text-xl"></i>
                    <span className="font-medium">SVG</span>
                  </button>
                  <button
                    onClick={() => setExportFormat('png')}
                    className={`p-4 border rounded-lg text-base transition-colors flex items-center justify-center gap-2 ${
                      exportFormat === 'png' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <i className="fas fa-image text-xl"></i>
                    <span className="font-medium">PNG</span>
                  </button>
                  <button
                    onClick={() => setExportFormat('pdf')}
                    className={`p-4 border rounded-lg text-base transition-colors flex items-center justify-center gap-2 ${
                      exportFormat === 'pdf' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <i className="fas fa-file-pdf text-xl"></i>
                    <span className="font-medium">PDF</span>
                  </button>
                  <button
                    onClick={() => setExportFormat('ctxdr')}
                    className={`p-4 border rounded-lg text-base transition-colors flex items-center justify-center gap-2 ${
                      exportFormat === 'ctxdr' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <i className="fas fa-file-code text-xl"></i>
                    <span className="font-medium">.ctxdr</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-900 font-medium mb-3">Область экспорта</label>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="page"
                      checked={exportScope === 'page'}
                      onChange={(e) => setExportScope(e.target.value as 'page')}
                      className="mr-3 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-base text-gray-900">Текущая страница</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="all"
                      checked={exportScope === 'all'}
                      onChange={(e) => setExportScope(e.target.value as 'all')}
                      className="mr-3 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-base text-gray-900">Все страницы</span>
                  </label>
                  <label className={`flex items-center ${selectedElementId ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                    <input
                      type="radio"
                      value="selection"
                      checked={exportScope === 'selection'}
                      onChange={(e) => setExportScope(e.target.value as 'selection')}
                      className="mr-3 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      disabled={!selectedElementId}
                    />
                    <span className="text-base text-gray-900">
                      Выделенная область {!selectedElementId && '(ничего не выбрано)'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowExportDialog(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    if (exportFormat === 'ctxdr') {
                      const exportData = {
                        diagram: diagram,
                        version: '1.0',
                        exportedAt: new Date().toISOString(),
                      };
                      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${diagram.name}.ctxdr`;
                      link.click();
                      URL.revokeObjectURL(url);
                    } else {
                      handleExport(exportFormat as 'svg' | 'png' | 'pdf');
                    }
                    setShowExportDialog(false);
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Экспортировать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
