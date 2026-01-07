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
      russian: 'Русский',
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

