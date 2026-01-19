// Создаем главную страницу приложения с автоматическим перенаправлением на страницу регистрации
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/register');
}