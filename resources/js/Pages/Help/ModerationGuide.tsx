import React from "react";

// Компонент для разделов руководства
const GuideSection = ({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) => (
    <div className="mb-8">
        <h2 className="text-xl text-red-500 font-medieval mb-4 border-b border-red-900/30 pb-2">
            {title}
        </h2>
        <div className="space-y-4">{children}</div>
    </div>
);

// Компонент для скриншотов с подписями
const ScreenshotBox = ({
    title,
    description,
    placeholder = true,
    imageSrc,
}: {
    title: string;
    description: string;
    placeholder?: boolean;
    imageSrc?: string;
}) => (
    <div className="mt-4 mb-6 bg-gray-800/80 rounded-lg overflow-hidden shadow-md">
        <div className="p-4 bg-gray-800">
            <h3 className="text-lg font-semibold text-red-400">{title}</h3>
            <p className="text-gray-300 mt-1 text-sm">{description}</p>
        </div>

        {imageSrc ? (
            <div className="relative overflow-hidden">
                <img
                    src={imageSrc}
                    alt={title}
                    className="w-full object-cover"
                    onError={(e) => {
                        // При ошибке загрузки изображения заменяем элемент на плейсхолдер
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Предотвращает бесконечную рекурсию

                        // Отображаем информацию об ошибке
                        const parent = target.parentElement;
                        if (parent) {
                            parent.innerHTML = `
                                <div class="bg-gray-800/90 p-6 text-center">
                                    <svg class="w-16 h-16 mx-auto text-red-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                    </svg>
                                    <p class="mt-3 text-red-400">Ошибка загрузки изображения:</p>
                                    <p class="text-gray-400 text-sm">${imageSrc}</p>
                                    <p class="mt-2 text-gray-500 text-xs">Убедитесь, что изображение существует в каталоге public</p>
                                </div>
                            `;
                        }
                    }}
                />
            </div>
        ) : placeholder ? (
            <div className="bg-gray-800/90 p-8 text-center">
                <svg
                    className="w-16 h-16 mx-auto text-gray-700 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    ></path>
                </svg>
                <p className="mt-3 text-gray-500">
                    Скриншот будет добавлен позже
                </p>
            </div>
        ) : null}
    </div>
);

// Компонент для выделения важных замечаний
const Note = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-gray-800/60 rounded-lg p-4 border-l-4 border-red-800 my-4">
        <div className="flex items-start">
            <svg
                className="w-6 h-6 text-red-500 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
            </svg>
            <div className="text-gray-300 text-sm">{children}</div>
        </div>
    </div>
);

// Основной компонент руководства по модерации
const ModerationGuide: React.FC = () => {
    return (
        <div className="text-gray-300">
            <div className="mb-6">
                <h1 className="text-2xl text-red-500 font-medieval mb-2">
                    Руководство по модерации сообщений поддержки
                </h1>
                <p className="text-gray-400">
                    Это руководство содержит подробные инструкции для
                    модераторов и администраторов по работе с обращениями в
                    службу поддержки Echoes of Oblivion.
                </p>
            </div>

            <GuideSection title="Доступ к панели модерации">
                <p>
                    Для доступа к панели модерации сообщений поддержки
                    необходимо:
                </p>
                <ol className="list-decimal ml-6 space-y-2">
                    <li>
                        Войти в систему с учетной записью, имеющей роль
                        "Администратор" или "Модератор поддержки"
                    </li>
                    <li>
                        Нажать на иконку шестеренки в правом верхнем углу
                        экрана, чтобы открыть меню управления
                    </li>
                    <li>Выбрать пункт "Панель поддержки" в выпадающем меню</li>
                </ol>

                <ScreenshotBox
                    title="Доступ к панели модерации"
                    description="Для доступа к панели модерации сообщений нажмите на иконку шестеренки и выберите 'Панель поддержки' в выпадающем меню."
                    imageSrc="/images/help/moderation_guide/moderation_guide_1.jpg"
                />

                <Note>
                    <p>
                        Обратите внимание, что пункт "Панель поддержки" будет
                        отображаться только для пользователей с ролями
                        "Администратор" и "Модератор поддержки". Если вы не
                        видите этот пункт, обратитесь к администратору для
                        проверки настроек вашей учетной записи.
                    </p>
                </Note>
            </GuideSection>

            <GuideSection title="Интерфейс панели модерации">
                <p>
                    Интерфейс панели модерации сообщений поддержки состоит из
                    двух основных частей:
                </p>
                <ul className="list-disc ml-6 space-y-2">
                    <li>
                        <strong>Список сообщений</strong> - расположен в левой
                        части экрана и содержит все сообщения от пользователей
                    </li>
                    <li>
                        <strong>Детали сообщения</strong> - расположены в правой
                        части экрана и содержат подробную информацию о выбранном
                        сообщении
                    </li>
                </ul>

                <ScreenshotBox
                    title="Интерфейс панели модерации"
                    description="Интерфейс панели модерации сообщений состоит из списка сообщений слева и деталей выбранного сообщения справа."
                    imageSrc="/images/help/moderation_guide/moderation_guide_2.jpg"
                />

                <p>
                    В верхней части списка сообщений расположены фильтры,
                    позволяющие отобразить сообщения по:
                </p>
                <ul className="list-disc ml-6 space-y-2">
                    <li>
                        <strong>Статусу</strong> - Новые, В обработке, Решено,
                        или Все
                    </li>
                    <li>
                        <strong>Типу сообщения</strong> - Вопрос, Баг,
                        Предложение, Аккаунт, Другое, или Все
                    </li>
                </ul>
            </GuideSection>

            <GuideSection title="Обработка сообщений">
                <p>Процесс обработки сообщений состоит из следующих шагов:</p>
                <ol className="list-decimal ml-6 space-y-2">
                    <li>
                        <strong>Выбор сообщения</strong> - нажмите на сообщение
                        в списке слева для просмотра его содержимого
                    </li>
                    <li>
                        <strong>Взятие на модерацию</strong> - нажмите кнопку
                        "Взять на модерацию", чтобы другие модераторы видели,
                        что вы работаете с этим сообщением
                    </li>
                    <li>
                        <strong>Создание ответа</strong> - введите текст ответа
                        в соответствующее поле
                    </li>
                    <li>
                        <strong>Изменение статуса</strong> - при необходимости
                        измените статус сообщения с помощью соответствующих
                        кнопок
                    </li>
                    <li>
                        <strong>Сохранение ответа</strong> - нажмите кнопку
                        "Сохранить ответ"
                    </li>
                </ol>

                <ScreenshotBox
                    title="Взятие сообщения на модерацию"
                    description="Нажмите кнопку 'Взять на модерацию', чтобы начать работу с сообщением. Это предотвратит одновременную обработку одного сообщения несколькими модераторами."
                    imageSrc="/images/help/moderation_guide/moderation_guide_3.jpg"
                />

                <Note>
                    <p>
                        Когда вы берете сообщение на модерацию, другие
                        модераторы не смогут редактировать его одновременно с
                        вами. Это помогает избежать конфликтов при обработке
                        сообщений.
                    </p>
                </Note>

                <ScreenshotBox
                    title="Создание ответа пользователю"
                    description="Введите ответ в текстовое поле и нажмите кнопку 'Сохранить ответ'. После сохранения ответа сообщение автоматически будет освобождено от модерации."
                    imageSrc="/images/help/moderation_guide/moderation_guide_4.jpg"
                />

                <p>
                    Вы можете изменить статус сообщения с помощью следующих
                    кнопок:
                </p>
                <ul className="list-disc ml-6 space-y-2">
                    <li>
                        <strong>ПОМЕТИТЬ КАК НОВОЕ</strong> - если сообщение
                        требует дополнительного внимания от других модераторов
                    </li>
                    <li>
                        <strong>В ОБРАБОТКЕ</strong> - если вы начали работу над
                        сообщением, но еще не готовы предоставить окончательный
                        ответ
                    </li>
                    <li>
                        <strong>ЗАКРЫТЬ</strong> - если проблема полностью
                        решена
                    </li>
                </ul>
            </GuideSection>

            <GuideSection title="Архив сообщений">
                <p>
                    Архив сообщений содержит все сообщения, которые были оценены
                    пользователями. Попасть в архив можно нажав на кнопку
                    "Переместить в архив" в верхнем правом углу экрана.
                </p>

                <ScreenshotBox
                    title="Переход в архив"
                    description="Архив сообщений содержит все сообщения, которые были оценены пользователями."
                    imageSrc="/images/help/moderation_guide/moderation_guide_5.jpg"
                />

                <p>
                    В архиве сообщения будут отображаться вместе с их рейтингом
                    и комментариями пользователей. Однако вы не сможете отвечать
                    на сообщения в архиве.
                </p>

                <ScreenshotBox
                    title="Экран архива"
                    description="Экран архива сообщений."
                    imageSrc="/images/help/moderation_guide/moderation_guide_6.jpg"
                />

                <Note>
                    Вы сможете вернуть обратно нажав на кнопку "Вернуть к
                    обычным заявкам" в верхнем правом углу экрана. Старайтесь
                    отвечать пользователю максимально вежливо и информативно,
                    для возможного получения положительного отзыва.
                </Note>
            </GuideSection>

            <GuideSection title="Рекомендации по ответам">
                <p>
                    При создании ответов пользователям следуйте следующим
                    рекомендациям:
                </p>
                <ul className="list-disc ml-6 space-y-2">
                    <li>
                        Всегда обращайтесь к пользователю вежливо и с уважением
                    </li>
                    <li>
                        Отвечайте на все вопросы пользователя полно и
                        информативно
                    </li>
                    <li>
                        Избегайте технического жаргона, если это не обращение от
                        продвинутого пользователя
                    </li>
                    <li>
                        Если проблема требует времени для решения, объясните это
                        пользователю и установите статус "В обработке"
                    </li>
                    <li>
                        Если проблема выходит за рамки вашей компетенции,
                        верните сообщение в статус "Новое" для обработки другими
                        модераторами
                    </li>
                </ul>

                <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4 mb-6">
                    <h3 className="text-red-400 font-medieval mb-2">
                        Пример хорошего ответа:
                    </h3>
                    <div className="text-gray-300 whitespace-pre-line bg-gray-800/70 p-3 rounded">
                        {`Уважаемый игрок,

Благодарим за обращение в службу поддержки Echoes of Oblivion.

Мы рассмотрели вашу проблему с исчезновением предмета после обмена. После проверки журналов игры мы обнаружили, что предмет был успешно добавлен в ваш инвентарь, но из-за временной ошибки синхронизации он не отобразился в интерфейсе.

Мы восстановили ваш предмет и отправили его повторно на ваш аккаунт. Пожалуйста, перезайдите в игру и проверьте ваш инвентарь.

Если у вас возникнут дополнительные вопросы или проблемы, не стесняйтесь обращаться к нам снова.

С уважением,
Команда поддержки Echoes of Oblivion`}
                    </div>
                </div>
            </GuideSection>

            <GuideSection title="Особые случаи и эскалация">
                <p>
                    В некоторых случаях сообщения пользователей могут требовать
                    особого внимания или эскалации:
                </p>
                <ul className="list-disc ml-6 space-y-4">
                    <li>
                        <strong>Сообщения о критических ошибках</strong> -
                        немедленно уведомьте технический отдел и установите
                        статус "В обработке"
                    </li>
                    <li>
                        <strong>Жалобы на других игроков</strong> - проверьте
                        журналы игры и, при необходимости, передайте информацию
                        администраторам для принятия мер
                    </li>
                    <li>
                        <strong>Запросы на возврат предметов</strong> -
                        проверьте журналы игры для подтверждения утери и
                        следуйте установленной процедуре возврата
                    </li>
                    <li>
                        <strong>Запросы на возврат платежей</strong> -
                        перенаправьте запрос в финансовый отдел и сообщите
                        пользователю о дальнейших шагах
                    </li>
                </ul>

                <Note>
                    <p>
                        В случае сложных ситуаций, требующих вмешательства
                        разработчиков или администраторов высшего уровня,
                        установите статус "В обработке" и обратитесь за помощью
                        через внутреннюю систему коммуникации команды.
                    </p>
                </Note>
            </GuideSection>
        </div>
    );
};

export default ModerationGuide;
