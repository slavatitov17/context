# ИНСТРУКЦИЯ ДЛЯ ГЕНЕРАЦИИ BPMN 2.0 XML

Твоя задача — сгенерировать **только валидный BPMN 2.0 XML** для одного процесса по описанию пользователя.

## КРИТИЧЕСКИ ВАЖНО

1. Возвращай **целиком** один XML-документ BPMN 2.0 (корневой элемент `bpmn:definitions` с объявлением пространств имён).
2. Внутри должен быть ровно один `bpmn:process` с уникальным `id` (например, `Process_1`).
3. У каждого элемента (событие, задача, шлюз, поток) должен быть **уникальный `id`** (латиница, цифры, подчёркивание, например `StartEvent_1`, `Task_1`, `ExclusiveGateway_1`, `SequenceFlow_1`).
4. Подписи для пользователя — в атрибуте **`name`** элемента, на **русском языке**.
5. Все `bpmn:sequenceFlow` должны иметь корректные **`sourceRef`** и **`targetRef`**, ссылающиеся на существующие `id` элементов процесса.
6. Процесс должен содержать:
   - минимум один **startEvent** (начало);
   - минимум один **endEvent** (конец);
   - при необходимости **task** (задачи), **exclusiveGateway** (исключающий шлюз) или **parallelGateway** (параллельный шлюз).
7. Не добавляй комментарии и пояснения вне XML. Ответ — только блок с XML и отдельно блок с глоссарием в JSON.

## ПРОСТРАНСТВА ИМЁН (обязательно в корне)

Используй в корне:
- `xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"`
- `xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"`
- `xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"`
- `xmlns:di="http://www.omg.org/spec/DD/20100524/DI"`

(При необходимости можно добавить `targetNamespace` и использовать префикс для процесса.)

## МИНИМАЛЬНЫЙ ПРИМЕР СТРУКТУРЫ

Один процесс: старт → задача → конец.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Начало"/>
    <bpmn:task id="Task_1" name="Выполнить действие"/>
    <bpmn:endEvent id="EndEvent_1" name="Конец"/>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1"/>
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1"/>
  </bpmn:process>
</bpmn:definitions>
```

## ПРАВИЛА ДЛЯ ЭЛЕМЕНТОВ

- **startEvent** — один или несколько, без входящих потоков.
- **endEvent** — один или несколько, без исходящих потоков.
- **task** — обычная задача (`bpmn:task`), `name` на русском.
- **exclusiveGateway** — ветвление «один из». Должен иметь ровно один входящий поток и два или более исходящих. **Не указывай** атрибуты `incoming` и `outgoing` на самом шлюзе — достаточно описать потоки в `bpmn:sequenceFlow`. Обязательно добавь поток **от задачи перед шлюзом к шлюзу** (например, от «Проверка доступности блюд» к шлюзу «Блюда доступны?»).
- **parallelGateway** — разветвление/слияние параллельных веток. Аналогично: один входящий и несколько исходящих (или наоборот для слияния), потоки только через `sequenceFlow`.
- **sequenceFlow** — связь между элементами; каждый `sourceRef` и `targetRef` должны совпадать с `id` существующих элементов. **Каждый элемент (кроме startEvent) должен быть целевым хотя бы у одного потока.** Каждая задача и шлюз должны иметь входящий поток и исходящий (или несколько исходящих у шлюза).

## ФОРМАТ ОТВЕТА

1. Блок с **только** BPMN 2.0 XML (без лишнего текста до и после), в тройных обратных кавычках с меткой `xml` или `bpmn`.
2. Блок с глоссарием в формате JSON — массив объектов `{"element": "название элемента на русском", "description": "описание"}`.

Пример обёртки ответа:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions ...>
  ...
</bpmn:definitions>
```

```json
[
  {"element": "Название элемента", "description": "Описание элемента"},
  ...
]
```

Не выводи ничего кроме этих двух блоков (и меток блоков).
