import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
    return (
        <footer className="bg-black border-t border-red-900/30 text-gray-500 pt-8 pb-4 mt-auto">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Секция о проекте */}
                    <div>
                        <h3 className="text-red-600 font-medieval text-xl mb-4">
                            Echoes of Oblivion
                        </h3>
                        <p className="text-sm leading-relaxed">
                            Бросьте вызов тьме в мире, где каждая тень скрывает
                            опасность, а каждый выбор имеет последствия. Примите
                            свою судьбу или измените ее навсегда.
                        </p>
                    </div>

                    {/* Полезные ссылки */}
                    <div>
                        <h3 className="text-red-600 font-medieval text-xl mb-4">
                            Ссылки
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    to="/support"
                                    className="hover:text-red-400 transition-colors"
                                >
                                    Поддержка
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/faq"
                                    className="hover:text-red-400 transition-colors"
                                >
                                    Часто задаваемые вопросы
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/guides"
                                    className="hover:text-red-400 transition-colors"
                                >
                                    Руководства выживания
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/terms"
                                    className="hover:text-red-400 transition-colors"
                                >
                                    Условия использования
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Социальные сети */}
                    <div>
                        <h3 className="text-red-600 font-medieval text-xl mb-4">
                            Сообщество
                        </h3>
                        <div className="flex space-x-4 mb-4">
                            <a
                                href="#"
                                className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center hover:bg-red-900 transition-colors"
                                aria-label="Discord"
                            >
                                <span className="font-bold text-sm">D</span>
                            </a>
                            <a
                                href="#"
                                className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center hover:bg-red-900 transition-colors"
                                aria-label="Telegram"
                            >
                                <span className="font-bold text-sm">T</span>
                            </a>
                            <a
                                href="#"
                                className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center hover:bg-red-900 transition-colors"
                                aria-label="VK"
                            >
                                <span className="font-bold text-sm">V</span>
                            </a>
                        </div>
                        <p className="text-xs">
                            Присоединяйтесь к другим проклятым душам. Поделитесь
                            своими историями, найдите союзников в борьбе против
                            тьмы.
                        </p>
                    </div>
                </div>

                {/* Нижняя часть футера */}
                <div className="border-t border-gray-900 mt-6 pt-4 text-center text-xs">
                    <p>© 2025 Echoes of Oblivion. Все права защищены.</p>
                    <p className="mt-1">
                        Создано с<span className="text-red-700 mx-1">❤</span>
                        для тех, кто не боится взглянуть в лицо тьме
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
