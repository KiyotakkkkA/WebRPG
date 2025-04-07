<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>Echoes of Oblivion</title>

        <!-- Предзагрузка логотипа и фона -->
        <link rel="preload" href="{{ asset('images/backgrounds/logo.png') }}" as="image" type="image/png">
        <link rel="preload" href="{{ asset('images/backgrounds/menu_bg.jpg') }}" as="image" type="image/jpeg">

        <!-- Favicon -->
        <link rel="icon" href="{{ asset('favicon.ico') }}" type="image/x-icon">

        <!-- Мета-теги -->
        <meta name="description" content="Echoes of Oblivion - погрузитесь в мрачный фэнтезийный мир, полный тайн и опасностей">
        <meta name="theme-color" content="#111827">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="bg-gray-900 antialiased">
        @inertia
    </body>
</html>
