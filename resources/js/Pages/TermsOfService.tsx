import React from "react";
import MainLayout from "../Layouts/MainLayout";
import { Link } from "react-router-dom";

// Декоративный разделитель в средневековом стиле
const Divider = () => (
    <div className="flex items-center justify-center my-6">
        <div className="w-1/4 h-0.5 bg-gradient-to-r from-transparent to-red-800/30"></div>
        <div className="mx-4 text-red-600">❖</div>
        <div className="w-1/4 h-0.5 bg-gradient-to-l from-transparent to-red-800/30"></div>
    </div>
);

// Декоративный заголовок секции
const SectionTitle = ({
    children,
    subtitle,
}: {
    children: React.ReactNode;
    subtitle?: string;
}) => (
    <div className="text-center mb-8">
        <h2 className="text-red-500 text-2xl font-medieval tracking-wider inline-block relative">
            {children}
        </h2>
        {subtitle && <p className="text-gray-400 mt-2 text-sm">{subtitle}</p>}
        <div className="h-0.5 w-3/4 mx-auto mt-2 bg-gradient-to-r from-transparent via-red-700/40 to-transparent"></div>
    </div>
);

// Компонент декоративной печати
const Seal = () => (
    <div className="relative mx-auto w-24 h-24 mt-12 mb-8">
        <div className="absolute inset-0 bg-red-900/20 rounded-full"></div>
        <div className="absolute inset-1 border-2 border-red-900/30 rounded-full"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl text-red-700/80">🔮</span>
        </div>
        <div className="absolute inset-0 border border-red-800/40 rounded-full"></div>
    </div>
);

const TermsOfService: React.FC = () => {
    return (
        <MainLayout>
            <div className="relative min-h-screen">
                {/* Фоновое изображение */}
                <div className="absolute inset-0 bg-[url('/images/backgrounds/menu_bg.jpg')] bg-cover bg-center opacity-30"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/60 backdrop-blur-[1px]"></div>

                {/* Декоративные элементы */}
                <div className="absolute top-10 left-10 w-20 h-20 border-t border-l border-red-700/50 animate-pulse"></div>
                <div className="absolute top-10 right-10 w-20 h-20 border-t border-r border-red-700/50 animate-pulse"></div>
                <div className="absolute bottom-10 left-10 w-20 h-20 border-b border-l border-red-700/50 animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-20 h-20 border-b border-r border-red-700/50 animate-pulse"></div>

                <div className="container max-w-4xl mx-auto px-4 py-12 relative z-10">
                    <div className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 rounded-lg border border-red-900/30 shadow-xl p-8 backdrop-blur-sm">
                        {/* Декоративные углы */}
                        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-red-800/50"></div>
                        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-red-800/50"></div>
                        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-red-800/50"></div>
                        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-red-800/50"></div>

                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-medieval text-red-500 mb-2 tracking-wider">
                                УСЛОВИЯ ИСПОЛЬЗОВАНИЯ
                            </h1>
                            <p className="text-gray-400 italic">
                                Последнее обновление: 10 апреля 2025 г.
                            </p>
                        </div>

                        <p className="text-gray-300 mb-6 font-medieval text-lg text-center">
                            Приветствуем тебя, путник. Прежде чем ступить на
                            тёмный путь Echoes of Oblivion, прочти внимательно
                            условия использования нашего мистического мира.
                        </p>

                        <Divider />

                        <SectionTitle>СОГЛАШЕНИЕ О СЛУЖЕНИИ ТЬМЕ</SectionTitle>

                        <div className="prose prose-invert prose-red max-w-none mb-8">
                            <p className="text-gray-300">
                                Используя Echoes of Oblivion, вы заключаете
                                соглашение с древними силами, управляющими этим
                                миром. Данный документ устанавливает основные
                                правила вашего взаимодействия с порталом в мир
                                тьмы.
                            </p>

                            <p className="text-gray-300">
                                Наши услуги многогранны и постоянно
                                эволюционируют, как и сама тьма. Поэтому условия
                                использования могут быть изменены в любой
                                момент. Мы уведомим вас о значительных
                                изменениях через ритуальный огонь или простое
                                сообщение на экране входа.
                            </p>
                        </div>

                        <SectionTitle>РЕГИСТРАЦИЯ И БЕЗОПАСНОСТЬ</SectionTitle>

                        <div className="prose prose-invert prose-red max-w-none mb-8">
                            <p className="text-gray-300">
                                Для создания аккаунта требуется действительный
                                адрес электронной почты и выбор безопасного
                                пароля. Вы несёте ответственность за всё, что
                                происходит в рамках вашего аккаунта, включая все
                                действия ваших персонажей.
                            </p>

                            <div className="bg-gray-800/60 rounded-lg p-5 border-l-4 border-red-800 my-6">
                                <h4 className="text-red-400 font-medieval mb-2">
                                    ПРЕДУПРЕЖДЕНИЕ
                                </h4>
                                <p className="text-gray-300 text-sm">
                                    Мы настоятельно рекомендуем не раскрывать
                                    свой пароль третьим лицам. Администрация
                                    никогда не запрашивает ваши учетные данные.
                                    Будьте бдительны и не поддавайтесь на уловки
                                    тёмных сущностей.
                                </p>
                            </div>

                            <p className="text-gray-300">
                                Не забывайте, что ваш аккаунт может быть
                                заблокирован при нарушении правил использования
                                сервиса. Мы оставляем за собой право ограничить
                                доступ к аккаунту при подозрении на нарушение
                                правил.
                            </p>
                        </div>

                        <SectionTitle>ПОВЕДЕНИЕ В МИРЕ ТЬМЫ</SectionTitle>

                        <div className="prose prose-invert prose-red max-w-none mb-8">
                            <p className="text-gray-300">
                                Мир Echoes of Oblivion полон опасностей, но
                                некоторые правила должны соблюдаться всеми
                                путниками:
                            </p>

                            <ul className="space-y-2 text-gray-300 list-disc pl-5 mt-4">
                                <li>
                                    Запрещено использование уязвимостей игры и
                                    сторонних программ для получения
                                    преимущества;
                                </li>
                                <li>
                                    Запрещено оскорбление других игроков,
                                    распространение спама и контента взрослого
                                    характера;
                                </li>
                                <li>
                                    Запрещена продажа или передача аккаунтов и
                                    внутриигровых ценностей за реальные деньги;
                                </li>
                                <li>
                                    Запрещено выдавать себя за представителей
                                    администрации и модерации.
                                </li>
                            </ul>

                            <p className="text-gray-300 mt-4">
                                Нарушение этих правил может привести к временной
                                или постоянной блокировке вашего аккаунта без
                                возможности восстановления.
                            </p>
                        </div>

                        <SectionTitle>ПОКУПКИ И ПРЕМИУМ-КОНТЕНТ</SectionTitle>

                        <div className="prose prose-invert prose-red max-w-none mb-8">
                            <p className="text-gray-300">
                                Echoes of Oblivion предлагает возможность
                                приобретения премиум-контента за реальные
                                деньги. Все покупки осуществляются в
                                соответствии с следующими правилами:
                            </p>

                            <ul className="space-y-2 text-gray-300 list-disc pl-5 mt-4">
                                <li>
                                    Все покупки являются окончательными и
                                    возврату не подлежат, за исключением
                                    случаев, предусмотренных законом;
                                </li>
                                <li>
                                    Цены на премиум-контент указаны с учетом
                                    всех применимых налогов;
                                </li>
                                <li>
                                    Приобретенный контент может быть использован
                                    только в рамках одного аккаунта;
                                </li>
                                <li>
                                    Мы оставляем за собой право изменять
                                    стоимость премиум-контента в любое время.
                                </li>
                            </ul>

                            <div className="bg-red-900/20 rounded-lg p-5 border border-red-900/40 my-6">
                                <p className="text-gray-300 text-sm font-medieval">
                                    "Приобретая силу за гранью осязаемого мира,
                                    помни — с каждым даром приходит
                                    ответственность. Темные знамения ждут тех,
                                    кто злоупотребляет дарованной мощью."
                                </p>
                                <p className="text-right text-red-400 text-xs mt-2">
                                    — Хранитель Вечной Печати
                                </p>
                            </div>
                        </div>

                        <SectionTitle>КОНФИДЕНЦИАЛЬНОСТЬ</SectionTitle>

                        <div className="prose prose-invert prose-red max-w-none mb-8">
                            <p className="text-gray-300">
                                Мы уважаем вашу приватность и обрабатываем
                                персональные данные в соответствии с нашей
                                <Link
                                    to="/privacy-policy"
                                    className="text-red-400 hover:text-red-300 transition-colors mx-1"
                                >
                                    Политикой Конфиденциальности
                                </Link>
                                . Пожалуйста, ознакомьтесь с этим документом для
                                получения подробной информации.
                            </p>
                        </div>

                        <SectionTitle>
                            ИНТЕЛЛЕКТУАЛЬНАЯ СОБСТВЕННОСТЬ
                        </SectionTitle>

                        <div className="prose prose-invert prose-red max-w-none mb-8">
                            <p className="text-gray-300">
                                Все элементы Echoes of Oblivion, включая
                                графику, текст, звуковое сопровождение,
                                программный код, названия, логотипы и другие
                                материалы, являются интеллектуальной
                                собственностью и защищены законами об авторском
                                праве.
                            </p>

                            <p className="text-gray-300 mt-4">
                                Вам предоставляется ограниченная,
                                неисключительная лицензия на использование
                                контента исключительно в рамках личного,
                                некоммерческого использования игры в
                                соответствии с настоящими условиями.
                            </p>
                        </div>

                        <Seal />

                        <div className="text-center">
                            <p className="text-gray-300 mb-8">
                                Используя наш сервис, вы подтверждаете, что
                                прочитали, поняли и согласны с условиями
                                использования. Если у вас возникли вопросы,
                                свяжитесь с нами через
                                <Link
                                    to="/support"
                                    className="text-red-400 hover:text-red-300 transition-colors mx-1"
                                >
                                    форму обратной связи
                                </Link>
                                .
                            </p>

                            <div className="flex justify-center space-x-4">
                                <Link
                                    to="/"
                                    className="px-6 py-2 rounded border border-red-900/50 bg-gray-900 text-gray-300 hover:bg-red-900/20 transition-colors"
                                >
                                    Вернуться на главную
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default TermsOfService;
