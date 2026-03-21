# from selenium import webdriver
# from selenium.webdriver.chrome.options import Options
# from selenium.webdriver.common.by import By
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
#
#
# BASE_URL = "https://context-smoky.vercel.app"
# URL_REGISTER = f"{BASE_URL}/register"
# URL_LOGIN = f"{BASE_URL}/login"
#
# TEST_EMAIL = "test_selenium003@mail.ru"
# TEST_PASSWORD = "123456"
#
# # Файл, который будем загружать в проект через UI.
# # Важно: UI принимает расширения из списка accept (.txt, .csv, .md, .pdf, .docx и т.д.),
# # поэтому для загрузки используем именно test_document.txt.
# DOCUMENT_PATH = r"C:\Users\Admin\context\public\test_document.txt"
#
#
# def click_if_exists(driver: webdriver.Chrome, wait: WebDriverWait, xpath: str, timeout_seconds: int = 3) -> bool:
#     """Пробует кликнуть по элементу по XPath; если не найден — просто возвращает False."""
#     try:
#         local_wait = WebDriverWait(driver, timeout_seconds)
#         elem = local_wait.until(EC.element_to_be_clickable((By.XPATH, xpath)))
#         elem.click()
#         return True
#     except Exception:
#         return False
#
#
# def main():
#     print("Test started")
#
#     options = Options()
#     options.add_argument("--start-maximized")
#
#     driver = webdriver.Chrome(options=options)
#     wait = WebDriverWait(driver, 30)
#
#     try:
#         # ---------- 1) Регистрация или вход ----------
#         driver.get(URL_REGISTER)
#
#         email_input = wait.until(
#             EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
#         )
#
#         password_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
#         if len(password_inputs) < 2:
#             raise RuntimeError("Не найдены оба поля пароля на форме регистрации")
#
#         password_input = password_inputs[0]
#         confirm_input = password_inputs[1]
#
#         email_input.clear()
#         email_input.send_keys(TEST_EMAIL)
#         password_input.clear()
#         password_input.send_keys(TEST_PASSWORD)
#         confirm_input.clear()
#         confirm_input.send_keys(TEST_PASSWORD)
#
#         checkbox = driver.find_element(By.CSS_SELECTOR, "input[type='checkbox']")
#         if not checkbox.is_selected():
#             checkbox.click()
#
#         register_button = driver.find_element(
#             By.XPATH, "//button[contains(., 'Зарегистрироваться')]"
#         )
#         register_button.click()
#
#         # если пользователь уже есть – переходим на логин
#         try:
#             wait.until(EC.url_contains("/projects"))
#         except Exception:
#             driver.get(URL_LOGIN)
#
#             email_login = wait.until(
#                 EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
#             )
#             pass_login = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
#
#             email_login.clear()
#             email_login.send_keys(TEST_EMAIL)
#             pass_login.clear()
#             pass_login.send_keys(TEST_PASSWORD)
#
#             login_button = driver.find_element(By.XPATH, "//button[contains(., 'Войти')]")
#             login_button.click()
#
#             wait.until(EC.url_contains("/projects"))
#
#         wait.until(EC.url_contains("/projects"))
#         print("Current URL after auth:", driver.current_url)
#
#         # ---------- 2) Создание проекта ----------
#         # На странице проектов есть ссылка/кнопка на /projects/new.
#         # Клик делаем по кнопке "Создать проект".
#         create_project_btn = wait.until(
#             EC.element_to_be_clickable(
#                 (
#                     By.XPATH,
#                     "//a[@href='/projects/new']//button[contains(., 'Создать проект')]",
#                 )
#             )
#         )
#         create_project_btn.click()
#
#         # Ожидаем редирект в /projects/{id}
#         wait.until(lambda d: "/projects/" in d.current_url and "/projects/new" not in d.current_url)
#         print("Project page opened:", driver.current_url)
#
#         # ---------- 3) Добавление документа в проект ----------
#         # Кнопка "Добавить документы" вызывает выбор файла.
#         add_docs_btn = wait.until(
#             EC.element_to_be_clickable(
#                 (By.XPATH, "//button[contains(., 'Добавить документы')]")
#             )
#         )
#         add_docs_btn.click()
#
#         # На странице есть скрытый input[type=file] — в него и грузим файл.
#         file_input = wait.until(
#             EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']"))
#         )
#         file_input.send_keys(DOCUMENT_PATH)
#
#         # Дожидаемся успешной загрузки/обработки: в списке файлов появляется зелёная галочка.
#         wait.until(
#             EC.presence_of_element_located(
#                 (By.CSS_SELECTOR, "i.fas.fa-check-circle.text-green-500")
#             )
#         )
#
#         # ---------- 4) Вопрос в чате по загруженному документу ----------
#         question = "Что указано в документе?"
#
#         message_area = wait.until(
#             EC.visibility_of_element_located(
#                 (By.XPATH, "//textarea[contains(@placeholder, 'Введите сообщение')]")
#             )
#         )
#         message_area.clear()
#         message_area.send_keys(question)
#
#         send_button = wait.until(
#             EC.element_to_be_clickable((By.XPATH, "//button[@title='Отправить']"))
#         )
#         send_button.click()
#
#         # Ждём ответ системы. В ответе по нашему тестовому документу присутствуют слова "Цель" / "СМК".
#         wait.until(
#             EC.visibility_of_element_located(
#                 (
#                     By.XPATH,
#                     "//div[contains(@class,'markdown-content') and (contains(., 'Цель') or contains(., 'СМК'))]",
#                 )
#             )
#         )
#
#         driver.save_screenshot("selenium_answer.png")
#         print("Screenshot saved: selenium_answer.png")
#
#         # ---------- 5) Переход к созданию диаграммы ----------
#         create_diagram_link = wait.until(
#             EC.element_to_be_clickable(
#                 (
#                     By.XPATH,
#                     "//a[contains(@href, '/diagrams/new?fromProject=') and contains(., 'Создать диаграмму')]",
#                 )
#             )
#         )
#         create_diagram_link.click()
#
#         wait.until(lambda d: "/diagrams/" in d.current_url)
#         print("Diagram page opened:", driver.current_url)
#
#         # ---------- 6) Выбор типа диаграммы MindMap ----------
#         # В интерфейсе карточка MindMap — это кнопка с h3 "MindMap".
#         mindmap_btn = wait.until(
#             EC.element_to_be_clickable(
#                 (By.XPATH, "//button[.//h3[normalize-space()='MindMap']]")
#             )
#         )
#         mindmap_btn.click()
#
#         # Иногда появляется отдельная кнопка "Ввести данные" — попробуем нажать, если она есть.
#         click_if_exists(driver, wait, "//button[contains(., 'Ввести данные')]", timeout_seconds=5)
#
#         # ---------- 7) Ввод текста и генерация диаграммы ----------
#         prompt = "СМК МП, эксплуатирующего ОПО"
#
#         # В разных сценариях интерфейс может показывать разные placeholder'ы:
#         # 1) "Опишите предметную область..."
#         # 2) "Введите название объекта или процесса для диаграммы..."
#         # Поэтому используем универсальный селектор.
#         prompt_textarea = wait.until(
#             EC.visibility_of_element_located(
#                 (
#                     By.XPATH,
#                     "//textarea[contains(@placeholder, 'Опишите предметную область') or contains(@placeholder, 'Введите название объекта или процесса')]",
#                 )
#             )
#         )
#         prompt_textarea.clear()
#         prompt_textarea.send_keys(prompt)
#
#         generate_send = wait.until(
#             EC.element_to_be_clickable((By.XPATH, "//button[@title='Отправить']"))
#         )
#         generate_send.click()
#
#         # ---------- 8) Скачивание PNG и скриншот диаграммы ----------
#         download_png = wait.until(
#             EC.element_to_be_clickable(
#                 (By.XPATH, "//a[@download and contains(., 'Скачать PNG')]")
#             )
#         )
#         download_png.click()
#
#         driver.save_screenshot("selenium_mindmap.png")
#         print("Screenshot saved: selenium_mindmap.png")
#
#         print("Selenium scenario completed successfully")
#
#     finally:
#         driver.quit()
#
#
# if __name__ == "__main__":
#     main()
