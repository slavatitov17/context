// Система переводов для приложения

export type Language = 'ru' | 'en';

export interface Translations {
  // Общие
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    search: string;
    send: string;
    close: string;
    requiredFields: string;
    goToDocumentUpload: string;
    creatingProject: string;
    creatingDiagram: string;
    projectCreationError: string;
    diagramCreationError: string;
    contextDescription: string;
    contextName: string;
    agreeWithPrivacy: string;
    back: string;
    messageSent: string;
    attachFileStub: string;
  };

  // Навигация
  nav: {
    projects: string;
    diagrams: string;
    settings: string;
    about: string;
    profile: string;
  };

  // Страница настроек
  settings: {
    title: string;
    description: string;
    interfaceTheme: string;
    interfaceThemeDescription: string;
    light: string;
    dark: string;
    language: string;
    languageDescription: string;
    russian: string;
    english: string;
  };

  // Хлебные крошки
  breadcrumbs: {
    projects: string;
    diagrams: string;
    about: string;
    createProject: string;
    createDiagram: string;
    diagramType: string;
    creationMethod: string;
    editing: string;
    privacyPolicy: string;
  };

  // Страница проектов
  projects: {
    title: string;
    description: string;
    myProjects: string;
    createProject: string;
    noProjects: string;
    noProjectsDescription: string;
    searchPlaceholder: string;
    sortByDate: string;
    sortByAlphabet: string;
    name: string;
    shortDescription: string;
    creationDate: string;
    actions: string;
    deleteSelected: string;
    confirmDelete: string;
    deleteFailed: string;
    bulkDeleteFailed: string;
    bulkDeleteSuccess: string;
  };

  // Страница диаграмм
  diagrams: {
    title: string;
    description: string;
    myDiagrams: string;
    createDiagram: string;
    noDiagrams: string;
    noDiagramsDescription: string;
    searchPlaceholder: string;
    sortByDate: string;
    sortByAlphabet: string;
    name: string;
    shortDescription: string;
    creationDate: string;
    actions: string;
    deleteSelected: string;
    confirmDelete: string;
    deleteFailed: string;
    bulkDeleteFailed: string;
    bulkDeleteSuccess: string;
  };

  // Страница создания проекта
  createProject: {
    title: string;
    description: string;
    nameLabel: string;
    namePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    createButton: string;
    goToDocumentUpload: string;
    creating: string;
  };

  // Страница создания диаграммы
  createDiagram: {
    title: string;
    description: string;
    nameLabel: string;
    namePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    diagramType: string;
    selectDiagramType: string;
    creationMethod: string;
    selectCreationMethod: string;
    fromProject: string;
    fromScratch: string;
    selectProject: string;
    createButton: string;
    creating: string;
  };

  // Страница проекта
  projectDetail: {
    documents: string;
    addDocuments: string;
    dragFiles: string;
    orClickButton: string;
    chatPlaceholder: string;
    reportError: string;
  };

  // Страница диаграммы
  diagramDetail: {
    chatPlaceholder: string;
    chatPlaceholderWithType: string;
    chatPlaceholderScratch: string;
    reportError: string;
  };
  
  // Каталог типов диаграмм
  diagramTypeCatalog: {
    title: string;
    description: string;
    search: string;
    searchPlaceholder: string;
    sort: string;
    sortByAlphabet: string;
    sortByPopularity: string;
    filters: string;
    clearFilters: string;
    standardOrNotation: string;
    purposeOfUse: string;
    tags: string;
    all: string;
    noDiagramsFound: string;
    tryChangingFilters: string;
    diagramDescriptions: {
      sequence: string;
      useCase: string;
      class: string;
      object: string;
      activity: string;
      component: string;
      deployment: string;
      statechart: string;
      gantt: string;
      mindMap: string;
      er: string;
      wbs: string;
      json: string;
    };
    diagramTags: {
      uml: string;
      interaction: string;
      behavior: string;
      functions: string;
      requirements: string;
      structure: string;
      classes: string;
      architecture: string;
      objects: string;
      dynamics: string;
      businessProcesses: string;
      state: string;
      time: string;
      project: string;
      planning: string;
      hierarchy: string;
      connections: string;
      ideas: string;
      database: string;
      databases: string;
      data: string;
      format: string;
    };
    diagramStandards: {
      uml: string;
      projectManagement: string;
      ideas: string;
      database: string;
      data: string;
    };
    diagramPurposes: {
      interaction: string;
      requirements: string;
      architecture: string;
      modeling: string;
      businessProcesses: string;
      stateModeling: string;
      projectManagement: string;
      database: string;
    };
  };
  
  // Способ создания диаграммы
  diagramCreationMethod: {
    title: string;
    description: string;
    selectFromProjects: string;
    selectFromProjectsDescription: string;
    selectProjectButton: string;
    createFromScratch: string;
    createFromScratchDescription: string;
    enterDataButton: string;
    selectProjectTitle: string;
    noProjects: string;
  };
  
  // Чат проекта
  projectChat: {
    documents: string;
    documentsCount: string;
    dragFilesHere: string;
    orClickButton: string;
    addDocuments: string;
    uploadDocuments: string;
    uploadDocumentsProcessed: string;
    unknownFile: string;
    removeFile: string;
    uploadDocumentsToStart: string;
    enterMessage: string;
    send: string;
    processingRequest: string;
    searchingInfo: string;
    generatingAnswer: string;
    checkingAnswer: string;
    pleaseUploadDocuments: string;
    errorProcessingRequest: string;
    reportError: string;
    supportModalTitle: string;
    yourEmail: string;
    yourMessage: string;
    messagePlaceholder: string;
    attachFile: string;
    sendButton: string;
    messageSent: string;
  };
  
  // Чат диаграммы
  diagramChat: {
    reportError: string;
    diagram: string;
    code: string;
    downloadPNG: string;
    copyCode: string;
    codeCopied: string;
    glossaryTitle: string;
    element: string;
    description: string;
    renderingError: string;
    renderingDiagram: string;
    errorCreatingPNG: string;
    supportModalTitle: string;
    yourEmail: string;
    yourMessage: string;
    messagePlaceholder: string;
    attachFile: string;
    sendButton: string;
    messageSent: string;
    processingRequest: string;
    searchingInfo: string;
    generatingAnswer: string;
    checkingAnswer: string;
  };

  // Страница входа
  login: {
    welcome: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    privacyAgreement: string;
    privacyPolicy: string;
    loginButton: string;
    loggingIn: string;
    noAccount: string;
    register: string;
    error: string;
  };

  // Страница регистрации
  register: {
    welcome: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordMin: string;
    confirmPassword: string;
    passwordsDontMatch: string;
    privacyAgreement: string;
    privacyPolicy: string;
    registerButton: string;
    registering: string;
    hasAccount: string;
    login: string;
    error: string;
  };

  // Страница "О системе"
  about: {
    title: string;
    description: string;
    version: string;
    buildDate: string;
    contactSupport: string;
    yourEmail: string;
    yourMessage: string;
    messagePlaceholder: string;
    attachFile: string;
    send: string;
  };

  // Модальное окно профиля
  profile: {
    title: string;
    photo: string;
    photoDescription: string;
    uploadPhoto: string;
    changePhoto: string;
    remove: string;
    lastName: string;
    lastNamePlaceholder: string;
    firstName: string;
    firstNamePlaceholder: string;
    middleName: string;
    middleNamePlaceholder: string;
    birthDate: string;
    email: string;
    phone: string;
    phonePlaceholder: string;
    saveChanges: string;
    logout: string;
    profileSaved: string;
    selectImage: string;
    fileTooLarge: string;
  };

  // Страница политики конфиденциальности
  privacy: {
    title: string;
    description: string;
    back: string;
    section1Title: string;
    section1Content1: string;
    section1Content2: string;
    section2Title: string;
    section2Intro: string;
    section2Item1: string;
    section2Item2: string;
    section2Item3: string;
    section2Item4: string;
    section2Item5: string;
    section3Title: string;
    section3Intro: string;
    section3Item1: string;
    section3Item2: string;
    section3Item3: string;
    section3Item4: string;
    section3Item5: string;
    section3Item6: string;
    section3Item7: string;
    section4Title: string;
    section4Content1: string;
    section4Content2: string;
    section5Title: string;
    section5Intro: string;
    section5Item1: string;
    section5Item2: string;
    section5Item3: string;
    section6Title: string;
    section6Intro: string;
    section6Item1: string;
    section6Item2: string;
    section6Item3: string;
    section6Item4: string;
    section6Content: string;
    section7Title: string;
    section7Content1: string;
    section7Content2: string;
    section8Title: string;
    section8Content1: string;
    section8Content2: string;
    section9Title: string;
    section9Intro: string;
    yourEmail: string;
    yourMessage: string;
    messagePlaceholder: string;
    attachFile: string;
    send: string;
    messageSent: string;
    attachFileStub: string;
  };
}

const translations: Record<Language, Translations> = {
  ru: {
    common: {
      loading: 'Загрузка...',
      save: 'Сохранить',
      cancel: 'Отмена',
      delete: 'Удалить',
      edit: 'Редактировать',
      create: 'Создать',
      search: 'Поиск',
      send: 'Отправить',
      close: 'Закрыть',
      requiredFields: '* - обязательные поля',
      goToDocumentUpload: 'Перейти к загрузке документов',
      creatingProject: 'Создание проекта...',
      creatingDiagram: 'Создание диаграммы...',
      projectCreationError: 'Не удалось создать проект. Попробуйте еще раз.',
      diagramCreationError: 'Не удалось создать диаграмму. Попробуйте еще раз.',
      contextDescription: 'Ответы на вопросы по загруженным документам, автоматическое создание диаграмм. Используя Context, вы соглашаетесь с',
      contextName: 'Context (рус. Контекст)',
      agreeWithPrivacy: 'Политикой конфиденциальности',
      back: 'Назад',
      messageSent: 'Сообщение отправлено (заглушка)',
      attachFileStub: 'Функция прикрепления файла (заглушка)',
    },
    nav: {
      projects: 'Проекты',
      diagrams: 'Диаграммы',
      settings: 'Настройки',
      about: 'О системе',
      profile: 'Мой профиль',
    },
    settings: {
      title: 'Настройки',
      description: 'Настройте параметры системы под свои предпочтения',
      interfaceTheme: 'Тема интерфейса',
      interfaceThemeDescription: 'Выберите светлую или тёмную тему оформления',
      light: 'Светлая',
      dark: 'Тёмная',
      language: 'Язык интерфейса',
      languageDescription: 'Выберите язык отображения элементов системы',
      russian: 'Русский',
      english: 'English',
    },
    breadcrumbs: {
      projects: 'Проекты',
      diagrams: 'Диаграммы',
      about: 'О системе',
      createProject: 'Создание проекта',
      createDiagram: 'Создание диаграммы',
      diagramType: 'Тип диаграммы',
      creationMethod: 'Способ создания',
      editing: 'Редактирование',
      privacyPolicy: 'Политика конфиденциальности',
    },
    projects: {
      title: 'Проекты',
      description: 'Создавайте проекты и получайте ответы на вопросы по ним',
      myProjects: 'Мои проекты',
      createProject: '+ Создать проект',
      noProjects: 'Проекты отсутствуют...',
      noProjectsDescription: 'Создайте свой первый проект, загрузите документы и получите ответы на вопросы по ним',
      searchPlaceholder: 'Поиск по названию...',
      sortByDate: 'По дате создания',
      sortByAlphabet: 'По алфавиту',
      name: 'Название',
      shortDescription: 'Краткое описание',
      creationDate: 'Дата создания',
      actions: 'Действия',
      deleteSelected: 'Удалить выбранное',
      confirmDelete: 'Вы уверены, что хотите удалить этот проект?',
      deleteFailed: 'Не удалось удалить проект. Попробуйте еще раз.',
      bulkDeleteFailed: 'Произошла ошибка при удалении проектов.',
      bulkDeleteSuccess: 'Удалено {count} из {total} проектов.',
    },
    diagrams: {
      title: 'Диаграммы',
      description: 'Создавайте диаграммы и получайте ответы на вопросы по ним',
      myDiagrams: 'Мои диаграммы',
      createDiagram: '+ Создать диаграмму',
      noDiagrams: 'Диаграммы отсутствуют...',
      noDiagramsDescription: 'Создайте свою первую диаграмму, загрузите документы и получите ответы на вопросы по ним',
      searchPlaceholder: 'Поиск по названию...',
      sortByDate: 'По дате создания',
      sortByAlphabet: 'По алфавиту',
      name: 'Название',
      shortDescription: 'Краткое описание',
      creationDate: 'Дата создания',
      actions: 'Действия',
      deleteSelected: 'Удалить выбранное',
      confirmDelete: 'Вы уверены, что хотите удалить эту диаграмму?',
      deleteFailed: 'Не удалось удалить диаграмму. Попробуйте еще раз.',
      bulkDeleteFailed: 'Произошла ошибка при удалении диаграмм.',
      bulkDeleteSuccess: 'Удалено {count} из {total} диаграмм.',
    },
    createProject: {
      title: 'Создание проекта',
      description: 'Заполните информацию о проекте',
      nameLabel: 'Название проекта',
      namePlaceholder: 'Введите название проекта',
      descriptionLabel: 'Краткое описание проекта',
      descriptionPlaceholder: 'Введите краткое описание проекта',
      createButton: 'Создать проект',
      goToDocumentUpload: 'Перейти к загрузке документов',
      creating: 'Создание проекта...',
    },
    createDiagram: {
      title: 'Создание диаграммы',
      description: 'Заполните информацию о диаграмме',
      nameLabel: 'Название диаграммы',
      namePlaceholder: 'Введите название диаграммы',
      descriptionLabel: 'Краткое описание диаграммы',
      descriptionPlaceholder: 'Введите краткое описание диаграммы',
      diagramType: 'Тип диаграммы',
      selectDiagramType: 'Выберите тип диаграммы',
      creationMethod: 'Способ создания диаграммы',
      selectCreationMethod: 'Выберите способ создания диаграммы',
      fromProject: 'Из проекта',
      fromScratch: 'С нуля',
      selectProject: 'Выберите проект',
      createButton: 'Создать диаграмму',
      creating: 'Создание диаграммы...',
    },
    projectDetail: {
      documents: 'Документы',
      addDocuments: 'Добавить документы',
      dragFiles: 'Перетащите файлы сюда',
      orClickButton: 'или нажмите кнопку ниже',
      chatPlaceholder: 'Введите ваш вопрос...',
      reportError: 'Сообщить об ошибке',
    },
    diagramDetail: {
      chatPlaceholder: 'Сначала выберите тип диаграммы...',
      chatPlaceholderWithType: 'Введите название объекта или процесса для диаграммы...',
      chatPlaceholderScratch: 'Опишите предметную область и конкретный объект...',
      reportError: 'Сообщить об ошибке',
    },
    diagramTypeCatalog: {
      title: 'Тип диаграммы',
      description: 'Выберите тип диаграммы',
      search: 'Поиск',
      searchPlaceholder: 'Введите название или описание диаграммы',
      sort: 'Сортировка',
      sortByAlphabet: 'По алфавиту',
      sortByPopularity: 'По популярности',
      filters: 'Фильтры',
      clearFilters: 'Убрать фильтры',
      standardOrNotation: 'Стандарт или нотация',
      purposeOfUse: 'Цель использования',
      tags: 'Теги',
      all: 'Все',
      noDiagramsFound: 'Диаграммы не найдены',
      tryChangingFilters: 'Попробуйте изменить параметры поиска или фильтры',
      diagramDescriptions: {
        sequence: 'Диаграмма последовательности отображает взаимодействие объектов во времени через обмен сообщениями между участниками системы и последовательность вызовов',
        useCase: 'Диаграмма вариантов использования описывает функциональные требования системы через взаимодействие актеров и прецедентов использования с указанием границ',
        class: 'Диаграмма классов показывает структуру системы через классы, их атрибуты, методы и связи между ними, включая наследование и композицию',
        object: 'Диаграмма объектов отображает конкретные экземпляры классов и их связи в определенный момент времени выполнения системы с указанием значений',
        activity: 'Диаграмма деятельности моделирует бизнес-процессы и потоки работ, показывая последовательность действий, принятие решений и параллельные потоки',
        component: 'Диаграмма компонентов показывает архитектуру системы и её компоненты с указанием интерфейсов, зависимостей и способов взаимодействия между ними',
        deployment: 'Диаграмма развертывания отображает физическую архитектуру системы, показывая размещение компонентов на узлах развертывания и связи между ними',
        statechart: 'Диаграмма состояний моделирует жизненный цикл объектов и их состояния, показывая переходы между состояниями, условия перехода и действия',
        gantt: 'Диаграмма Ганта визуализирует временные рамки проекта и задачи, показывая длительность, зависимость, последовательность выполнения работ и ресурсы',
        mindMap: 'Интеллект-карта представляет идеи и концепции в иерархической структуре, показывая связи между понятиями, их взаимное расположение и группировку',
        er: 'Диаграмма сущность-связь моделирует структуру базы данных, показывая сущности, их атрибуты и связи между ними с указанием типов отношений',
        wbs: 'Иерархическая структура работ декомпозирует проект на задачи, показывая иерархию работ, их взаимосвязи в структуре проекта и уровни детализации',
        json: 'Диаграмма JSON визуализирует структуру данных в формате JSON, показывая объекты, массивы, их вложенность с указанием типов данных и значений',
      },
      diagramTags: {
        uml: 'UML',
        interaction: 'Взаимодействие',
        behavior: 'Поведение',
        functions: 'Функции',
        requirements: 'Требования',
        structure: 'Структура',
        classes: 'Классы',
        architecture: 'Архитектура',
        objects: 'Объекты',
        dynamics: 'Динамика',
        businessProcesses: 'Бизнес-процессы',
        state: 'Состояние',
        time: 'Время',
        project: 'Проект',
        planning: 'Планирование',
        hierarchy: 'Иерархия',
        connections: 'Связи',
        ideas: 'Идеи',
        database: 'База данных',
        databases: 'Базы данных',
        data: 'Данные',
        format: 'Формат',
      },
      diagramStandards: {
        uml: 'UML',
        projectManagement: 'Управление проектами',
        ideas: 'Идеи',
        database: 'База данных',
        data: 'Данные',
      },
      diagramPurposes: {
        interaction: 'Взаимодействие',
        requirements: 'Требования',
        architecture: 'Архитектура',
        modeling: 'Моделирование',
        businessProcesses: 'Бизнес-процессы',
        stateModeling: 'Моделирование состояний',
        projectManagement: 'Управление проектами',
        database: 'База данных',
      },
    },
    diagramCreationMethod: {
      title: 'Способ создания диаграммы',
      description: 'Выберите способ создания диаграммы',
      selectFromProjects: 'Выбрать из моих проектов',
      selectFromProjectsDescription: 'Использовать данные из существующего проекта',
      selectProjectButton: 'Выбрать проект',
      createFromScratch: 'Создать с нуля',
      createFromScratchDescription: 'Опишите предметную область вручную',
      enterDataButton: 'Ввести данные',
      selectProjectTitle: 'Выберите проект',
      noProjects: 'У вас пока нет проектов',
    },
    projectChat: {
      documents: 'Документы',
      documentsCount: 'Документы ({count})',
      dragFilesHere: 'Перетащите файлы сюда',
      orClickButton: 'или нажмите кнопку ниже',
      addDocuments: 'Добавить документы',
      uploadDocuments: 'Загружено и обработано документов: {processed} из {total} ({size} КБ)',
      unknownFile: 'Неизвестный файл',
      removeFile: 'Удалить файл',
      uploadDocumentsToStart: 'Загрузите документы, чтобы начать работу с ними',
      enterMessage: 'Введите сообщение...',
      send: 'Отправить',
      processingRequest: 'Обработка запроса...',
      searchingInfo: 'Поиск информации...',
      generatingAnswer: 'Формирование ответа...',
      checkingAnswer: 'Проверка ответа...',
      pleaseUploadDocuments: 'Пожалуйста, сначала загрузите документы для анализа.',
      errorProcessingRequest: 'Ошибка при обработке запроса: {error}',
      reportError: 'Сообщить об ошибке',
      supportModalTitle: 'Обратиться в поддержку',
      yourEmail: 'Ваша электронная почта',
      yourMessage: 'Ваше сообщение',
      messagePlaceholder: 'Опишите вашу проблему или вопрос...',
      attachFile: 'Прикрепить файл',
      sendButton: 'Отправить',
      messageSent: 'Сообщение отправлено (заглушка)',
    },
    diagramChat: {
      reportError: 'Сообщить об ошибке',
      diagram: 'Диаграмма',
      code: 'Код',
      downloadPNG: 'Скачать PNG',
      copyCode: 'Скопировать код',
      codeCopied: 'Код скопирован в буфер обмена',
      glossaryTitle: 'Глоссарий элементов диаграммы',
      element: 'Элемент',
      description: 'Описание',
      renderingError: 'Ошибка рендеринга:',
      renderingDiagram: 'Рендеринг диаграммы...',
      errorCreatingPNG: 'Не удалось создать PNG файл: {error}',
      supportModalTitle: 'Обратиться в поддержку',
      yourEmail: 'Ваша электронная почта',
      yourMessage: 'Ваше сообщение',
      messagePlaceholder: 'Опишите вашу проблему или вопрос...',
      attachFile: 'Прикрепить файл',
      sendButton: 'Отправить',
      messageSent: 'Сообщение отправлено (заглушка)',
      processingRequest: 'Обработка запроса...',
      searchingInfo: 'Поиск информации...',
      generatingAnswer: 'Формирование ответа...',
      checkingAnswer: 'Проверка ответа...',
    },
    login: {
      welcome: 'Войдите в систему для продолжения работы',
      email: 'Эл. почта',
      emailPlaceholder: 'slava-titov173@yandex.ru',
      password: 'Пароль',
      privacyAgreement: 'Я согласен с',
      privacyPolicy: 'Политикой конфиденциальности',
      loginButton: 'Войти',
      loggingIn: 'Вход...',
      noAccount: 'Нет аккаунта?',
      register: 'Зарегистрироваться',
      error: 'Ошибка при входе. Проверьте email и пароль',
    },
    register: {
      welcome: 'Создайте аккаунт для начала работы',
      email: 'Эл. почта',
      emailPlaceholder: 'slava-titov173@yandex.ru',
      password: 'Пароль (минимум 6 символов)',
      passwordMin: 'Пароль должен содержать минимум 6 символов',
      confirmPassword: 'Подтверждение пароля',
      passwordsDontMatch: 'Пароли не совпадают',
      privacyAgreement: 'Я согласен с',
      privacyPolicy: 'Политикой конфиденциальности',
      registerButton: 'Зарегистрироваться',
      registering: 'Регистрация...',
      hasAccount: 'Уже есть аккаунт?',
      login: 'Войти',
      error: 'Ошибка при регистрации',
    },
    about: {
      title: 'О системе',
      description: 'Свяжитесь с поддержкой в случае возникновения вопросов',
      version: 'Версия',
      buildDate: 'Дата сборки',
      contactSupport: 'Обратиться в поддержку',
      yourEmail: 'Ваша электронная почта',
      yourMessage: 'Ваше сообщение',
      messagePlaceholder: 'Опишите вашу проблему или вопрос...',
      attachFile: 'Прикрепить файл',
      send: 'Отправить',
    },
    profile: {
      title: 'Мой профиль',
      photo: 'Фото профиля',
      photoDescription: 'Загрузите ваше фото. Рекомендуемый масштаб фото: 200x200. Максимальный размер фото: 5 МБ.',
      uploadPhoto: 'Загрузить фото',
      changePhoto: 'Изменить фото',
      remove: 'Удалить',
      lastName: 'Фамилия',
      lastNamePlaceholder: 'Иванов',
      firstName: 'Имя',
      firstNamePlaceholder: 'Иван',
      middleName: 'Отчество',
      middleNamePlaceholder: 'Иванович',
      birthDate: 'Дата рождения',
      email: 'Эл. почта',
      phone: 'Телефон',
      phonePlaceholder: '+7 (999) 123-45-67',
      saveChanges: 'Сохранить изменения',
      logout: 'Выйти из аккаунта',
      profileSaved: 'Профиль успешно сохранен',
      selectImage: 'Пожалуйста, выберите изображение',
      fileTooLarge: 'Размер файла не должен превышать 5 МБ',
    },
    privacy: {
      title: 'Политика конфиденциальности',
      description: 'Узнайте, как мы собираем, используем и защищаем ваши персональные данные',
      back: 'Назад',
      section1Title: '1. Общие положения',
      section1Content1: 'Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей сервиса Context (далее — «Сервис»). Используя Сервис, вы соглашаетесь с условиями настоящей Политики конфиденциальности.',
      section1Content2: 'Администрация Сервиса обязуется соблюдать конфиденциальность персональных данных пользователей в соответствии с действующим законодательством.',
      section2Title: '2. Собираемые данные',
      section2Intro: 'При использовании Сервиса мы собираем следующую информацию:',
      section2Item1: 'Электронный адрес (email) для идентификации пользователя',
      section2Item2: 'Информация о проектах, созданных пользователем',
      section2Item3: 'Загруженные пользователем файлы и документы',
      section2Item4: 'Данные о взаимодействии с Сервисом (время использования, действия пользователя)',
      section2Item5: 'Техническая информация (IP-адрес, тип браузера, операционная система)',
      section3Title: '3. Цели использования данных',
      section3Intro: 'Собранные данные используются для следующих целей:',
      section3Item1: 'Предоставление доступа к функциям Сервиса',
      section3Item2: 'Идентификация и аутентификация пользователей',
      section3Item3: 'Обработка и анализ загруженных файлов для ответов на вопросы',
      section3Item4: 'Создание диаграмм на основе загруженных данных',
      section3Item5: 'Улучшение качества работы Сервиса',
      section3Item6: 'Обеспечение безопасности и предотвращение мошенничества',
      section3Item7: 'Информирование пользователей об изменениях в Сервисе',
      section4Title: '4. Защита персональных данных',
      section4Content1: 'Администрация Сервиса принимает необходимые технические и организационные меры для защиты персональных данных от неправомерного доступа, уничтожения, изменения, блокирования, копирования, распространения, а также от иных неправомерных действий.',
      section4Content2: 'Все данные хранятся на защищенных серверах с использованием современных технологий шифрования. Доступ к персональным данным имеют только уполномоченные сотрудники, которые обязаны соблюдать конфиденциальность.',
      section5Title: '5. Передача данных третьим лицам',
      section5Intro: 'Администрация Сервиса не передает персональные данные третьим лицам, за исключением следующих случаев:',
      section5Item1: 'Пользователь дал согласие на такие действия',
      section5Item2: 'Передача предусмотрена законодательством в рамках установленной процедуры',
      section5Item3: 'Передача необходима для работы Сервиса или его функций (например, обработка файлов с использованием внешних сервисов)',
      section6Title: '6. Права пользователей',
      section6Intro: 'Пользователь имеет право:',
      section6Item1: 'Получать информацию о своих персональных данных, обрабатываемых Сервисом',
      section6Item2: 'Требовать уточнения, блокирования или уничтожения персональных данных',
      section6Item3: 'Отозвать согласие на обработку персональных данных',
      section6Item4: 'Удалить свой аккаунт и связанные с ним данные',
      section6Content: 'Для реализации своих прав пользователь может обратиться к Администрации Сервиса через форму обратной связи на странице «О системе».',
      section7Title: '7. Использование Cookies',
      section7Content1: 'Сервис использует технологию cookies для обеспечения удобства использования и улучшения функциональности. Cookies — это небольшие текстовые файлы, которые сохраняются на устройстве пользователя.',
      section7Content2: 'Пользователь может настроить свой браузер для отказа от cookies, однако это может ограничить доступ к некоторым функциям Сервиса.',
      section8Title: '8. Изменения в Политике конфиденциальности',
      section8Content1: 'Администрация Сервиса оставляет за собой право вносить изменения в настоящую Политику конфиденциальности. Актуальная версия всегда доступна на данной странице.',
      section8Content2: 'При внесении существенных изменений пользователи будут уведомлены через Сервис или по электронной почте.',
      section9Title: '9. Контактная информация',
      section9Intro: 'По всем вопросам, связанным с обработкой персональных данных, вы можете обратиться к Администрации Сервиса:',
      yourEmail: 'Ваша электронная почта',
      yourMessage: 'Ваше сообщение',
      messagePlaceholder: 'Опишите вашу проблему или вопрос...',
      attachFile: 'Прикрепить файл',
      send: 'Отправить',
      messageSent: 'Сообщение отправлено (заглушка)',
      attachFileStub: 'Функция прикрепления файла (заглушка)',
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
      send: 'Send',
      close: 'Close',
      requiredFields: '* - required fields',
      goToDocumentUpload: 'Go to document upload',
      creatingProject: 'Creating project...',
      creatingDiagram: 'Creating diagram...',
      projectCreationError: 'Failed to create project. Please try again.',
      diagramCreationError: 'Failed to create diagram. Please try again.',
      contextDescription: 'Answers to questions about uploaded documents, automatic creation of diagrams. By using Context, you agree to the',
      contextName: 'Context',
      agreeWithPrivacy: 'Privacy Policy',
      back: 'Back',
      messageSent: 'Message sent (stub)',
      attachFileStub: 'File attachment function (stub)',
    },
    nav: {
      projects: 'Projects',
      diagrams: 'Diagrams',
      settings: 'Settings',
      about: 'About',
      profile: 'My Profile',
    },
    settings: {
      title: 'Settings',
      description: 'Configure system settings to your preferences',
      interfaceTheme: 'Interface Theme',
      interfaceThemeDescription: 'Choose light or dark theme',
      light: 'Light',
      dark: 'Dark',
      language: 'Interface Language',
      languageDescription: 'Select the display language for system elements',
      russian: 'Russian',
      english: 'English',
    },
    breadcrumbs: {
      projects: 'Projects',
      diagrams: 'Diagrams',
      about: 'About',
      createProject: 'Create Project',
      createDiagram: 'Create Diagram',
      diagramType: 'Diagram Type',
      creationMethod: 'Creation Method',
      editing: 'Editing',
      privacyPolicy: 'Privacy Policy',
    },
    projects: {
      title: 'Projects',
      description: 'Create projects and get answers to questions about them',
      myProjects: 'My Projects',
      createProject: '+ Create Project',
      noProjects: 'No projects yet...',
      noProjectsDescription: 'Create your first project, upload documents and get answers to questions about them',
      searchPlaceholder: 'Search by name...',
      sortByDate: 'By creation date',
      sortByAlphabet: 'Alphabetically',
      name: 'Name',
      shortDescription: 'Short Description',
      creationDate: 'Creation Date',
      actions: 'Actions',
      deleteSelected: 'Delete Selected',
      confirmDelete: 'Are you sure you want to delete this project?',
      deleteFailed: 'Failed to delete project. Please try again.',
      bulkDeleteFailed: 'An error occurred while deleting projects.',
      bulkDeleteSuccess: 'Deleted {count} of {total} projects.',
    },
    diagrams: {
      title: 'Diagrams',
      description: 'Create diagrams and get answers to questions about them',
      myDiagrams: 'My Diagrams',
      createDiagram: '+ Create Diagram',
      noDiagrams: 'No diagrams yet...',
      noDiagramsDescription: 'Create your first diagram, upload documents and get answers to questions about them',
      searchPlaceholder: 'Search by name...',
      sortByDate: 'By creation date',
      sortByAlphabet: 'Alphabetically',
      name: 'Name',
      shortDescription: 'Short Description',
      creationDate: 'Creation Date',
      actions: 'Actions',
      deleteSelected: 'Delete Selected',
      confirmDelete: 'Are you sure you want to delete this diagram?',
      deleteFailed: 'Failed to delete diagram. Please try again.',
      bulkDeleteFailed: 'An error occurred while deleting diagrams.',
      bulkDeleteSuccess: 'Deleted {count} of {total} diagrams.',
    },
    createProject: {
      title: 'Create Project',
      description: 'Fill in project information',
      nameLabel: 'Project Name',
      namePlaceholder: 'Enter project name',
      descriptionLabel: 'Short Project Description',
      descriptionPlaceholder: 'Enter short project description',
      createButton: 'Create Project',
      goToDocumentUpload: 'Go to document upload',
      creating: 'Creating project...',
    },
    createDiagram: {
      title: 'Create Diagram',
      description: 'Fill in diagram information',
      nameLabel: 'Diagram Name',
      namePlaceholder: 'Enter diagram name',
      descriptionLabel: 'Short Diagram Description',
      descriptionPlaceholder: 'Enter short diagram description',
      diagramType: 'Diagram Type',
      selectDiagramType: 'Select diagram type',
      creationMethod: 'Diagram Creation Method',
      selectCreationMethod: 'Select creation method',
      fromProject: 'From Project',
      fromScratch: 'From Scratch',
      selectProject: 'Select Project',
      createButton: 'Create Diagram',
      creating: 'Creating diagram...',
    },
    projectDetail: {
      documents: 'Documents',
      addDocuments: 'Add Documents',
      dragFiles: 'Drag files here',
      orClickButton: 'or click the button below',
      chatPlaceholder: 'Enter your question...',
      reportError: 'Report Error',
    },
    diagramDetail: {
      chatPlaceholder: 'First select a diagram type...',
      chatPlaceholderWithType: 'Enter the name of the object or process for the diagram...',
      chatPlaceholderScratch: 'Describe the subject area and specific object...',
      reportError: 'Report Error',
    },
    diagramTypeCatalog: {
      title: 'Diagram Type',
      description: 'Select diagram type',
      search: 'Search',
      searchPlaceholder: 'Enter diagram name or description',
      sort: 'Sort',
      sortByAlphabet: 'Alphabetically',
      sortByPopularity: 'By popularity',
      filters: 'Filters',
      clearFilters: 'Clear filters',
      standardOrNotation: 'Standard or notation',
      purposeOfUse: 'Purpose of use',
      tags: 'Tags',
      all: 'All',
      noDiagramsFound: 'No diagrams found',
      tryChangingFilters: 'Try changing search parameters or filters',
      diagramDescriptions: {
        sequence: 'Sequence diagram displays the interaction of objects over time through message exchange between system participants and the sequence of calls',
        useCase: 'Use case diagram describes the functional requirements of the system through the interaction of actors and use cases with boundary indication',
        class: 'Class diagram shows the system structure through classes, their attributes, methods, and relationships, including inheritance and composition',
        object: 'Object diagram displays specific instances of classes and their relationships at a specific point in time during system execution with value indication',
        activity: 'Activity diagram models business processes and workflows, showing the sequence of actions, decision-making, and parallel flows',
        component: 'Component diagram shows the system architecture and its components, indicating interfaces, dependencies, and interaction methods',
        deployment: 'Deployment diagram displays the physical architecture of the system, showing the placement of components on deployment nodes and connections between them',
        statechart: 'Statechart diagram models the life cycle of objects and their states, showing transitions between states, transition conditions, and actions',
        gantt: 'Gantt chart visualizes project timelines and tasks, showing duration, dependencies, sequence of work, and resources',
        mindMap: 'Mind map represents ideas and concepts in a hierarchical structure, showing connections between concepts, their relative positions, and grouping',
        er: 'Entity-relationship diagram models the database structure, showing entities, their attributes, and relationships with relationship type indication',
        wbs: 'Work breakdown structure decomposes the project into tasks, showing the hierarchy of work, their interrelationships in the project structure, and levels of detail',
        json: 'JSON diagram visualizes the data structure in JSON format, showing objects, arrays, their nesting with data type and value indication',
      },
      diagramTags: {
        uml: 'UML',
        interaction: 'Interaction',
        behavior: 'Behavior',
        functions: 'Functions',
        requirements: 'Requirements',
        structure: 'Structure',
        classes: 'Classes',
        architecture: 'Architecture',
        objects: 'Objects',
        dynamics: 'Dynamics',
        businessProcesses: 'Business Processes',
        state: 'State',
        time: 'Time',
        project: 'Project',
        planning: 'Planning',
        hierarchy: 'Hierarchy',
        connections: 'Connections',
        ideas: 'Ideas',
        database: 'Database',
        databases: 'Databases',
        data: 'Data',
        format: 'Format',
      },
      diagramStandards: {
        uml: 'UML',
        projectManagement: 'Project Management',
        ideas: 'Ideas',
        database: 'Database',
        data: 'Data',
      },
      diagramPurposes: {
        interaction: 'Interaction',
        requirements: 'Requirements',
        architecture: 'Architecture',
        modeling: 'Modeling',
        businessProcesses: 'Business Processes',
        stateModeling: 'State Modeling',
        projectManagement: 'Project Management',
        database: 'Database',
      },
    },
    diagramCreationMethod: {
      title: 'Diagram Creation Method',
      description: 'Select creation method',
      selectFromProjects: 'Select from my projects',
      selectFromProjectsDescription: 'Use data from an existing project',
      selectProjectButton: 'Select Project',
      createFromScratch: 'Create from Scratch',
      createFromScratchDescription: 'Describe the subject area manually',
      enterDataButton: 'Enter Data',
      selectProjectTitle: 'Select Project',
      noProjects: "You don't have any projects yet",
    },
    projectChat: {
      documents: 'Documents',
      documentsCount: 'Documents ({count})',
      dragFilesHere: 'Drag files here',
      orClickButton: 'or click the button below',
      addDocuments: 'Add Documents',
      uploadDocuments: 'Uploaded and processed documents: {processed} of {total} ({size} KB)',
      unknownFile: 'Unknown file',
      removeFile: 'Remove file',
      uploadDocumentsToStart: 'Upload documents to start working with them',
      enterMessage: 'Enter message...',
      send: 'Send',
      processingRequest: 'Processing request...',
      searchingInfo: 'Searching information...',
      generatingAnswer: 'Generating answer...',
      checkingAnswer: 'Checking answer...',
      pleaseUploadDocuments: 'Please upload documents first for analysis.',
      errorProcessingRequest: 'Error processing request: {error}',
      reportError: 'Report Error',
      supportModalTitle: 'Contact Support',
      yourEmail: 'Your Email',
      yourMessage: 'Your Message',
      messagePlaceholder: 'Describe your problem or question...',
      attachFile: 'Attach File',
      sendButton: 'Send',
      messageSent: 'Message sent (stub)',
    },
    diagramChat: {
      reportError: 'Report Error',
      diagram: 'Diagram',
      code: 'Code',
      downloadPNG: 'Download PNG',
      copyCode: 'Copy Code',
      codeCopied: 'Code copied to clipboard',
      glossaryTitle: 'Diagram Elements Glossary',
      element: 'Element',
      description: 'Description',
      renderingError: 'Rendering error:',
      renderingDiagram: 'Rendering diagram...',
      errorCreatingPNG: 'Failed to create PNG file: {error}',
      supportModalTitle: 'Contact Support',
      yourEmail: 'Your Email',
      yourMessage: 'Your Message',
      messagePlaceholder: 'Describe your problem or question...',
      attachFile: 'Attach File',
      sendButton: 'Send',
      messageSent: 'Message sent (stub)',
      processingRequest: 'Processing request...',
      searchingInfo: 'Searching information...',
      generatingAnswer: 'Generating answer...',
      checkingAnswer: 'Checking answer...',
    },
    login: {
      welcome: 'Sign in to continue',
      email: 'Email',
      emailPlaceholder: 'user@example.com',
      password: 'Password',
      privacyAgreement: 'I agree with the',
      privacyPolicy: 'Privacy Policy',
      loginButton: 'Sign In',
      loggingIn: 'Signing in...',
      noAccount: "Don't have an account?",
      register: 'Sign Up',
      error: 'Sign in error. Check your email and password',
    },
    register: {
      welcome: 'Create an account to get started',
      email: 'Email',
      emailPlaceholder: 'user@example.com',
      password: 'Password (minimum 6 characters)',
      passwordMin: 'Password must contain at least 6 characters',
      confirmPassword: 'Confirm Password',
      passwordsDontMatch: 'Passwords do not match',
      privacyAgreement: 'I agree with the',
      privacyPolicy: 'Privacy Policy',
      registerButton: 'Sign Up',
      registering: 'Signing up...',
      hasAccount: 'Already have an account?',
      login: 'Sign In',
      error: 'Registration error',
    },
    about: {
      title: 'About',
      description: 'Contact support if you have any questions',
      version: 'Version',
      buildDate: 'Build Date',
      contactSupport: 'Contact Support',
      yourEmail: 'Your Email',
      yourMessage: 'Your Message',
      messagePlaceholder: 'Describe your problem or question...',
      attachFile: 'Attach File',
      send: 'Send',
    },
    profile: {
      title: 'My Profile',
      photo: 'Profile Photo',
      photoDescription: 'Upload your photo. Recommended scale: 200x200. Maximum file size: 5 MB.',
      uploadPhoto: 'Upload Photo',
      changePhoto: 'Change Photo',
      remove: 'Remove',
      lastName: 'Last Name',
      lastNamePlaceholder: 'Smith',
      firstName: 'First Name',
      firstNamePlaceholder: 'John',
      middleName: 'Middle Name',
      middleNamePlaceholder: 'Michael',
      birthDate: 'Birth Date',
      email: 'Email',
      phone: 'Phone',
      phonePlaceholder: '+1 (555) 123-4567',
      saveChanges: 'Save Changes',
      logout: 'Log Out',
      profileSaved: 'Profile saved successfully',
      selectImage: 'Please select an image',
      fileTooLarge: 'File size must not exceed 5 MB',
    },
    privacy: {
      title: 'Privacy Policy',
      description: 'Learn how we collect, use, and protect your personal data',
      back: 'Back',
      section1Title: '1. General Provisions',
      section1Content1: 'This Privacy Policy defines the procedure for processing and protecting personal data of users of the Context service (hereinafter — "Service"). By using the Service, you agree to the terms of this Privacy Policy.',
      section1Content2: 'The Service Administration undertakes to observe the confidentiality of users\' personal data in accordance with current legislation.',
      section2Title: '2. Collected Data',
      section2Intro: 'When using the Service, we collect the following information:',
      section2Item1: 'Email address for user identification',
      section2Item2: 'Information about projects created by the user',
      section2Item3: 'Files and documents uploaded by the user',
      section2Item4: 'Data on interaction with the Service (usage time, user actions)',
      section2Item5: 'Technical information (IP address, browser type, operating system)',
      section3Title: '3. Purposes of Data Use',
      section3Intro: 'Collected data is used for the following purposes:',
      section3Item1: 'Providing access to Service functions',
      section3Item2: 'User identification and authentication',
      section3Item3: 'Processing and analyzing uploaded files to answer questions',
      section3Item4: 'Creating diagrams based on uploaded data',
      section3Item5: 'Improving the quality of the Service',
      section3Item6: 'Ensuring security and preventing fraud',
      section3Item7: 'Informing users about changes in the Service',
      section4Title: '4. Protection of Personal Data',
      section4Content1: 'The Service Administration takes necessary technical and organizational measures to protect personal data from unauthorized access, destruction, alteration, blocking, copying, distribution, as well as from other unlawful actions.',
      section4Content2: 'All data is stored on secure servers using modern encryption technologies. Access to personal data is granted only to authorized employees who are obliged to maintain confidentiality.',
      section5Title: '5. Data Transfer to Third Parties',
      section5Intro: 'The Service Administration does not transfer personal data to third parties, with the following exceptions:',
      section5Item1: 'The user has given consent for such actions',
      section5Item2: 'The transfer is provided for by legislation within the framework of an established procedure',
      section5Item3: 'The transfer is necessary for the operation of the Service or its functions (for example, file processing using external services)',
      section6Title: '6. User Rights',
      section6Intro: 'The user has the right to:',
      section6Item1: 'Receive information about their personal data processed by the Service',
      section6Item2: 'Demand clarification, blocking, or destruction of personal data',
      section6Item3: 'Withdraw consent for the processing of personal data',
      section6Item4: 'Delete their account and associated data',
      section6Content: 'To exercise their rights, the user can contact the Service Administration via the feedback form on the "About" page.',
      section7Title: '7. Use of Cookies',
      section7Content1: 'The Service uses cookie technology to ensure ease of use and improve functionality. Cookies are small text files that are stored on the user\'s device.',
      section7Content2: 'The user can configure their browser to refuse cookies, but this may limit access to some Service functions.',
      section8Title: '8. Changes to the Privacy Policy',
      section8Content1: 'The Service Administration reserves the right to make changes to this Privacy Policy. The current version is always available on this page.',
      section8Content2: 'Users will be notified of significant changes through the Service or by email.',
      section9Title: '9. Contact Information',
      section9Intro: 'For all questions related to the processing of personal data, you can contact the Service Administration:',
      yourEmail: 'Your Email',
      yourMessage: 'Your Message',
      messagePlaceholder: 'Describe your problem or question...',
      attachFile: 'Attach File',
      send: 'Send',
      messageSent: 'Message sent (stub)',
      attachFileStub: 'File attachment function (stub)',
    },
  },
};

export function getTranslations(language: Language): Translations {
  return translations[language];
}

export function getLanguage(): Language {
  if (typeof window === 'undefined') return 'ru';
  const saved = localStorage.getItem('context_language');
  return (saved === 'en' || saved === 'ru') ? saved : 'ru';
}

export function setLanguage(language: Language): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('context_language', language);
  // Триггерим событие для обновления всех компонентов
  window.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
}

