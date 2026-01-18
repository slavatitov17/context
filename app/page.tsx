// Создаем главную страницу приложения с автоматическим перенаправлением на страницу входа
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/login');
}