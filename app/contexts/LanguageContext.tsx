// Создаем контекст для управления языком интерфейса (русский/английский)
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Language = 'ru' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Словари переводов
const translations: Record<Language, Record<string, string>> = {
  ru: {
    // Settings Modal
    'settings.title': 'Настройки',
    'settings.theme': 'Тема интерфейса',
    'settings.light': 'Светлая',
    'settings.dark': 'Тёмная',
    'settings.language': 'Язык интерфейса',
    
    // Profile Modal
    'profile.title': 'Мой профиль',
    'profile.photo': 'Фото профиля',
    'profile.photo.upload': 'Загрузите ваше фото. Рекомендуемый масштаб фото: 200x200. Максимальный размер фото: 5 МБ.',
    'profile.photo.change': 'Изменить фото',
    'profile.photo.uploadButton': 'Загрузить фото',
    'profile.photo.remove': 'Удалить',
    'profile.lastName': 'Фамилия',
    'profile.firstName': 'Имя',
    'profile.middleName': 'Отчество',
    'profile.birthDate': 'Дата рождения',
    'profile.email': 'Эл. почта',
    'profile.phone': 'Телефон',
    'profile.save': 'Сохранить изменения',
    'profile.logout': 'Выйти из аккаунта',
    
    // About Modal
    'about.title': 'О системе',
    'about.back': 'Назад',
    'about.privacy': 'Политика конфиденциальности',
    'about.version': 'Версия 1.0.0',
    'about.context': 'Context (рус. Контекст)',
    'about.description': 'Ответы на вопросы по загруженным документам, создание диаграмм по предметной области. Используя систему Context, вы соглашаетесь с',
    'about.privacyLink': 'Политикой конфиденциальности',
    'about.versionLabel': 'Версия',
    'about.support': 'Обратиться в поддержку',
    'about.support.email': 'Ваша электронная почта',
    'about.support.message': 'Ваше сообщение',
    'about.support.attach': 'Прикрепить файл',
    'about.support.send': 'Отправить',
    'about.support.placeholder.email': 'example@mail.com',
    'about.support.placeholder.message': 'Опишите вашу проблему или вопрос...',
    
    // Privacy Policy
    'privacy.section1.title': '1. Общие положения',
    'privacy.section2.title': '2. Собираемые данные',
    'privacy.section3.title': '3. Цели использования данных',
    'privacy.section4.title': '4. Защита персональных данных',
    'privacy.section5.title': '5. Передача данных третьим лицам',
    'privacy.section6.title': '6. Права пользователей',
    'privacy.section7.title': '7. Использование Cookies',
    'privacy.section8.title': '8. Изменения в Политике конфиденциальности',
    'privacy.section9.title': '9. Обратиться в поддержку',
    
    // Version Info
    'version.features.title': 'Основные возможности',
    'version.diagrams.title': 'Доступные типы диаграмм',
    'version.formats.title': 'Поддерживаемые форматы документов',
    'version.technical.title': 'Технические детали',
    
    // Projects Page
    'projects.title': 'Проекты',
    'projects.description': 'Загружайте документы и получайте ответы на вопросы по ним',
    'projects.create': 'Создать проект',
    'projects.myProjects': 'Мои проекты',
    'projects.search': 'Поиск по названию...',
    'projects.sort.date': 'По дате создания',
    'projects.sort.alphabet': 'По алфавиту',
    'projects.empty.title': 'Проекты отсутствуют...',
    'projects.empty.description': 'Создайте свой первый проект, загрузите документы и получите ответы на вопросы по ним',
    'projects.table.name': 'Название',
    'projects.table.description': 'Краткое описание',
    'projects.table.date': 'Дата создания',
    'projects.edit': 'Редактировать',
    'projects.move': 'Перенести в папку',
    'projects.delete': 'Удалить',
    'projects.folder.create': 'Создание папки',
    'projects.folder.move': 'Перенести в папку',
    'projects.folder.name': 'Название папки',
    'projects.folder.back': 'Назад',
    'projects.folder.createButton': 'Создать папку',
    'projects.folder.createNew': 'Создать новую папку',
    'projects.folder.moveButton': 'Переместить',
    'projects.folder.empty': 'Папки отсутствуют',
    'projects.loading': 'Загрузка...',
    'common.loading': 'Загрузка...',
    
    // Diagrams Page
    'diagrams.title': 'Диаграммы',
    'diagrams.description': 'Получайте готовые диаграммы по текстовому описанию',
    'diagrams.selectType': 'Выбрать тип диаграммы',
    'diagrams.myDiagrams': 'Мои диаграммы',
    'diagrams.search': 'Поиск по названию...',
    'diagrams.sort.date': 'По дате создания',
    'diagrams.sort.alphabet': 'По алфавиту',
    'diagrams.empty.title': 'Диаграммы отсутствуют...',
    'diagrams.empty.description': 'Создайте свою первую диаграмму, выбрав ее тип и описав предметную область',
    'diagrams.table.name': 'Название',
    'diagrams.table.type': 'Тип диаграммы',
    'diagrams.table.date': 'Дата создания',
    'diagrams.edit': 'Редактировать',
    'diagrams.move': 'Перенести в папку',
    'diagrams.delete': 'Удалить',
    'diagrams.folder.create': 'Создание папки',
    'diagrams.folder.move': 'Перенести в папку',
    'diagrams.folder.name': 'Название папки',
    'diagrams.folder.back': 'Назад',
    'diagrams.folder.createButton': 'Создать папку',
    'diagrams.folder.createNew': 'Создать новую папку',
    'diagrams.folder.moveButton': 'Переместить',
    'diagrams.folder.empty': 'Папки отсутствуют',
    'diagrams.loading': 'Загрузка...',
    
    // Layout (Sidebar)
    'sidebar.projects': 'Проекты',
    'sidebar.diagrams': 'Диаграммы',
    'sidebar.settings': 'Настройки',
    'sidebar.about': 'О системе',
  },
  en: {
    // Settings Modal
    'settings.title': 'Settings',
    'settings.theme': 'Interface Theme',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
    'settings.language': 'Interface Language',
    
    // Profile Modal
    'profile.title': 'My Profile',
    'profile.photo': 'Profile Photo',
    'profile.photo.upload': 'Upload your photo. Recommended photo scale: 200x200. Maximum photo size: 5 MB.',
    'profile.photo.change': 'Change Photo',
    'profile.photo.uploadButton': 'Upload Photo',
    'profile.photo.remove': 'Remove',
    'profile.lastName': 'Last Name',
    'profile.firstName': 'First Name',
    'profile.middleName': 'Middle Name',
    'profile.birthDate': 'Date of Birth',
    'profile.email': 'Email',
    'profile.phone': 'Phone',
    'profile.save': 'Save Changes',
    'profile.logout': 'Sign Out',
    
    // About Modal
    'about.title': 'About the System',
    'about.back': 'Back',
    'about.privacy': 'Privacy Policy',
    'about.version': 'Version 1.0.0',
    'about.context': 'Context',
    'about.description': 'Answers to questions about uploaded documents, creating diagrams for the subject area. By using the Context system, you agree to the',
    'about.privacyLink': 'Privacy Policy',
    'about.versionLabel': 'Version',
    'about.support': 'Contact Support',
    'about.support.email': 'Your Email',
    'about.support.message': 'Your Message',
    'about.support.attach': 'Attach File',
    'about.support.send': 'Send',
    'about.support.placeholder.email': 'example@mail.com',
    'about.support.placeholder.message': 'Describe your problem or question...',
    
    // Privacy Policy
    'privacy.section1.title': '1. General Provisions',
    'privacy.section2.title': '2. Data Collected',
    'privacy.section3.title': '3. Purpose of Data Use',
    'privacy.section4.title': '4. Personal Data Protection',
    'privacy.section5.title': '5. Data Transfer to Third Parties',
    'privacy.section6.title': '6. User Rights',
    'privacy.section7.title': '7. Use of Cookies',
    'privacy.section8.title': '8. Changes to Privacy Policy',
    'privacy.section9.title': '9. Contact Support',
    
    // Version Info
    'version.features.title': 'Main Features',
    'version.diagrams.title': 'Available Diagram Types',
    'version.formats.title': 'Supported Document Formats',
    'version.technical.title': 'Technical Details',
    
    // Projects Page
    'projects.title': 'Projects',
    'projects.description': 'Upload documents and get answers to questions about them',
    'projects.create': 'Create Project',
    'projects.myProjects': 'My Projects',
    'projects.search': 'Search by name...',
    'projects.sort.date': 'By Creation Date',
    'projects.sort.alphabet': 'Alphabetically',
    'projects.empty.title': 'No Projects...',
    'projects.empty.description': 'Create your first project, upload documents and get answers to questions about them',
    'projects.table.name': 'Name',
    'projects.table.description': 'Short Description',
    'projects.table.date': 'Creation Date',
    'projects.edit': 'Edit',
    'projects.move': 'Move to Folder',
    'projects.delete': 'Delete',
    'projects.folder.create': 'Create Folder',
    'projects.folder.move': 'Move to Folder',
    'projects.folder.name': 'Folder Name',
    'projects.folder.back': 'Back',
    'projects.folder.createButton': 'Create Folder',
    'projects.folder.createNew': 'Create New Folder',
    'projects.folder.moveButton': 'Move',
    'projects.folder.empty': 'No Folders',
    'projects.loading': 'Loading...',
    
    // Diagrams Page
    'diagrams.title': 'Diagrams',
    'diagrams.description': 'Get ready-made diagrams from text descriptions',
    'diagrams.selectType': 'Select Diagram Type',
    'diagrams.myDiagrams': 'My Diagrams',
    'diagrams.search': 'Search by name...',
    'diagrams.sort.date': 'By Creation Date',
    'diagrams.sort.alphabet': 'Alphabetically',
    'diagrams.empty.title': 'No Diagrams...',
    'diagrams.empty.description': 'Create your first diagram by selecting its type and describing the subject area',
    'diagrams.table.name': 'Name',
    'diagrams.table.type': 'Diagram Type',
    'diagrams.table.date': 'Creation Date',
    'diagrams.edit': 'Edit',
    'diagrams.move': 'Move to Folder',
    'diagrams.delete': 'Delete',
    'diagrams.folder.create': 'Create Folder',
    'diagrams.folder.move': 'Move to Folder',
    'diagrams.folder.name': 'Folder Name',
    'diagrams.folder.back': 'Back',
    'diagrams.folder.createButton': 'Create Folder',
    'diagrams.folder.createNew': 'Create New Folder',
    'diagrams.folder.moveButton': 'Move',
    'diagrams.folder.empty': 'No Folders',
    'diagrams.loading': 'Loading...',
    'common.loading': 'Loading...',
    
    // Layout (Sidebar)
    'sidebar.projects': 'Projects',
    'sidebar.diagrams': 'Diagrams',
    'sidebar.settings': 'Settings',
    'sidebar.about': 'About the System',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Загружаем сохраненный язык из localStorage
    const savedLanguage = localStorage.getItem('language') as Language | null;
    if (savedLanguage === 'ru' || savedLanguage === 'en') {
      setLanguageState(savedLanguage);
    } else {
      setLanguageState('ru');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Сохраняем в localStorage
    localStorage.setItem('language', language);
    
    // Отправляем событие для синхронизации между компонентами
    window.dispatchEvent(new CustomEvent('languagechange', { detail: language }));
  }, [language, mounted]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Возвращаем значения по умолчанию для SSR, если контекст недоступен
    return {
      language: 'ru' as Language,
      setLanguage: () => {},
      t: (key: string) => key,
    };
  }
  return context;
}
