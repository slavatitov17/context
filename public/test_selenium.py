# Подключаем драйвер браузера Chrome из Selenium
from selenium import webdriver
# Подключаем настройки запуска Chrome
from selenium.webdriver.chrome.options import Options
# Подключаем способ поиска элементов на странице
from selenium.webdriver.common.by import By
# Подключаем явное ожидание появления элементов
from selenium.webdriver.support.ui import WebDriverWait
# Подключаем готовые условия ожидания
from selenium.webdriver.support import expected_conditions as EC


# Задаём базовый URL тестового стенда
BASE_URL = "https://context-smoky.vercel.app"
# Формируем URL страницы регистрации
URL_REGISTER = f"{BASE_URL}/register"
# Формируем URL страницы входа
URL_LOGIN = f"{BASE_URL}/login"

# Задаём тестовую электронную почту для регистрации/входа
TEST_EMAIL = "test_selenium003@mail.ru"
# Задаём тестовый пароль
TEST_PASSWORD = "123456"

# Указываем путь к файлу, который загрузим в проект через UI
DOCUMENT_PATH = r"C:\Users\Admin\context\public\test_document.txt"


def click_if_exists(driver: webdriver.Chrome, wait: WebDriverWait, xpath: str, timeout_seconds: int = 3) -> bool:
    """Пробует кликнуть по элементу по XPath; если не найден — просто возвращает False."""
    # Выполняем попытку клика по необязательному элементу
    try:
        # Создаём локальное ожидание с укороченным таймаутом
        local_wait = WebDriverWait(driver, timeout_seconds)
        # Ждём, пока элемент по XPath станет кликабельным
        elem = local_wait.until(EC.element_to_be_clickable((By.XPATH, xpath)))
        # Выполняем клик по найденному элементу
        elem.click()
        # Сообщаем об успешном клике
        return True
    except Exception:
        # Элемента нет или таймаут — возвращаем False без падения сценария
        return False


def main():
    # Выводим сообщение о старте теста в консоль
    print("Test started")

    # Создаём объект настроек Chrome
    options = Options()
    # Выполняем запуск браузера в развёрнутом окне
    options.add_argument("--start-maximized")

    # Создаём экземпляр драйвера Chrome с заданными опциями
    driver = webdriver.Chrome(options=options)
    # Создаём объект явного ожидания до 30 секунд
    wait = WebDriverWait(driver, 30)

    try:
        # 1. Регистрация
        # Открываем страницу регистрации в браузере
        driver.get(URL_REGISTER)

        # Ждём появления поля email и получаем ссылку на элемент
        email_input = wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )

        # Обращаемся ко всем полям ввода пароля на форме
        password_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
        # Проверяем, что на форме регистрации два поля пароля
        if len(password_inputs) < 2:
            raise RuntimeError("Не найдены оба поля пароля на форме регистрации")

        # Берём первое поле — пароль
        password_input = password_inputs[0]
        # Берём второе поле — подтверждение пароля
        confirm_input = password_inputs[1]

        # Очищаем поле email перед вводом
        email_input.clear()
        # Вводим тестовый email
        email_input.send_keys(TEST_EMAIL)
        # Очищаем поле пароля
        password_input.clear()
        # Вводим пароль
        password_input.send_keys(TEST_PASSWORD)
        # Очищаем поле подтверждения
        confirm_input.clear()
        # Повторяем пароль в поле подтверждения
        confirm_input.send_keys(TEST_PASSWORD)

        # Находим чекбокс согласия с политикой на форме регистрации
        checkbox = driver.find_element(By.CSS_SELECTOR, "input[type='checkbox']")
        # Включаем чекбокс, если он ещё не отмечен
        if not checkbox.is_selected():
            checkbox.click()

        # Находим кнопку «Зарегистрироваться»
        register_button = driver.find_element(
            By.XPATH, "//button[contains(., 'Зарегистрироваться')]"
        )
        # Выполняем клик по кнопке регистрации
        register_button.click()

        # Пробуем дождаться успешного перехода в список проектов
        try:
            wait.until(EC.url_contains("/projects"))
        except Exception:
            # Пользователь уже существует — переходим на страницу входа
            driver.get(URL_LOGIN)

            # Ждём поле email на форме входа
            email_login = wait.until(
                EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
            )
            # Находим поле пароля на форме входа
            pass_login = driver.find_element(By.CSS_SELECTOR, "input[type='password']")

            # Очищаем email на форме входа
            email_login.clear()
            # Вводим email для входа
            email_login.send_keys(TEST_EMAIL)
            # Очищаем пароль на форме входа
            pass_login.clear()
            # Вводим пароль для входа
            pass_login.send_keys(TEST_PASSWORD)

            # Находим кнопку «Войти»
            login_button = driver.find_element(By.XPATH, "//button[contains(., 'Войти')]")
            # Выполняем вход в систему
            login_button.click()

            # Ждём перехода в раздел проектов после входа
            wait.until(EC.url_contains("/projects"))

        # Дополнительно ждём URL со списком проектов (стабилизация после регистрации)
        wait.until(EC.url_contains("/projects"))
        # Выводим текущий URL после успешной авторизации
        print("Current URL after auth:", driver.current_url)

        # 2. Создание проекта
        # Ждём кликабельной кнопки «Создать проект» внутри ссылки на /projects/new
        create_project_btn = wait.until(
            EC.element_to_be_clickable(
                (
                    By.XPATH,
                    "//a[@href='/projects/new']//button[contains(., 'Создать проект')]",
                )
            )
        )
        # Выполняем переход к созданию проекта
        create_project_btn.click()

        # Ждём редиректа на страницу конкретного проекта /projects/{id}
        wait.until(lambda d: "/projects/" in d.current_url and "/projects/new" not in d.current_url)
        # Выводим URL открытой страницы проекта
        print("Project page opened:", driver.current_url)

        # 3 Добавление документа в проект
        # Ждём кнопку «Добавить документы»
        add_docs_btn = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//button[contains(., 'Добавить документы')]")
            )
        )
        # Открываем диалог выбора файла
        add_docs_btn.click()

        # Находим скрытый input[type=file] для загрузки файла
        file_input = wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']"))
        )
        # Передаём путь к тестовому файлу в поле загрузки
        file_input.send_keys(DOCUMENT_PATH)

        # Ждём появления иконки успешной обработки (зелёная галочка)
        wait.until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, "i.fas.fa-check-circle.text-green-500")
            )
        )

        # 4. Вопрос в чате по загруженному документу
        # Задаём текст вопроса к RAG-чату
        question = "Что указано в документе?"

        # Ждём появления текстового поля чата по placeholder
        message_area = wait.until(
            EC.visibility_of_element_located(
                (By.XPATH, "//textarea[contains(@placeholder, 'Введите сообщение')]")
            )
        )
        # Очищаем поле сообщения
        message_area.clear()
        # Вводим вопрос в чат
        message_area.send_keys(question)

        # Ждём кнопку отправки сообщения
        send_button = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[@title='Отправить']"))
        )
        # Отправляем вопрос в чат
        send_button.click()

        # Ждём ответ ассистента: в разметке появляется «Цель» или «СМК» из тестового документа
        wait.until(
            EC.visibility_of_element_located(
                (
                    By.XPATH,
                    "//div[contains(@class,'markdown-content') and (contains(., 'Цель') or contains(., 'СМК'))]",
                )
            )
        )

        # Сохраняем скриншот области с ответом чата
        driver.save_screenshot("selenium_answer.png")
        # Сообщаем в консоль о сохранении скриншота ответа
        print("Screenshot saved: selenium_answer.png")

        # 5. Переход к созданию диаграммы
        # Ждём ссылку «Создать диаграмму» с переходом из проекта
        create_diagram_link = wait.until(
            EC.element_to_be_clickable(
                (
                    By.XPATH,
                    "//a[contains(@href, '/diagrams/new?fromProject=') and contains(., 'Создать диаграмму')]",
                )
            )
        )
        # Переходим к мастеру создания диаграммы
        create_diagram_link.click()

        # Ждём загрузки URL страницы диаграммы
        wait.until(lambda d: "/diagrams/" in d.current_url)
        # Выводим URL страницы диаграммы
        print("Diagram page opened:", driver.current_url)

        # 6. Выбор типа диаграммы MindMap
        # Ждём карточку выбора типа MindMap (кнопка с заголовком h3)
        mindmap_btn = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//button[.//h3[normalize-space()='MindMap']]")
            )
        )
        # Выбираем тип диаграммы MindMap
        mindmap_btn.click()

        # Пробуем нажать «Ввести данные», если такой шаг показан интерфейсом
        click_if_exists(driver, wait, "//button[contains(., 'Ввести данные')]", timeout_seconds=5)

        # 7. Ввод текста и генерация диаграммы
        # Задаём описание объекта для генерации диаграммы
        prompt = "СМК МП, эксплуатирующего ОПО"

        # Ждём textarea с placeholder про предметную область или объект диаграммы
        prompt_textarea = wait.until(
            EC.visibility_of_element_located(
                (
                    By.XPATH,
                    "//textarea[contains(@placeholder, 'Опишите предметную область') or contains(@placeholder, 'Введите название объекта или процесса')]",
                )
            )
        )
        # Очищаем поле описания
        prompt_textarea.clear()
        # Вводим текст запроса к генератору диаграммы
        prompt_textarea.send_keys(prompt)

        # Ждём кнопку отправки запроса на генерацию
        generate_send = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[@title='Отправить']"))
        )
        # Запускаем генерацию диаграммы
        generate_send.click()

        # 8) Скачивание PNG и скриншот диаграммы
        # Ждём ссылку «Скачать PNG»
        download_png = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//a[@download and contains(., 'Скачать PNG')]")
            )
        )
        # Выполняем скачивание PNG диаграммы
        download_png.click()

        # Сохраняем скриншот страницы с диаграммой
        driver.save_screenshot("selenium_mindmap.png")
        # Сообщаем в консоль о сохранении скриншота диаграммы
        print("Screenshot saved: selenium_mindmap.png")

        # Выводим сообщение об успешном завершении сценария
        print("Selenium scenario completed successfully")

    finally:
        # Закрываем браузер и освобождаем драйвер
        driver.quit()


# Запускаем main только при прямом вызове файла (не при импорте)
if __name__ == "__main__":
    # Выполняем основной сценарий теста
    main()
