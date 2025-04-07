#!/bin/bash

# Установка зависимостей NPM
echo "Установка зависимостей NPM..."
npm install --save mobx mobx-react-lite @tanstack/react-query

# Настройка базы данных
echo "Настройка базы данных..."
php artisan migrate:fresh

# Создание тестового пользователя
echo "Создание тестового пользователя..."
php artisan tinker --execute="App\Models\User::create(['name' => 'Тестовый пользователь', 'email' => 'test@example.com', 'password' => bcrypt('password')])"

echo "Настройка аутентификации завершена!"
echo "Тестовый пользователь: test@example.com / password"
