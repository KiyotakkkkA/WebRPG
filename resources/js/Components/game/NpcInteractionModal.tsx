import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Button from "../ui/Button";

interface NpcDialogue {
    text: string;
    options: {
        id: string;
        text: string;
        next?: string;
        action?: string;
    }[];
}

interface DialogueTree {
    [key: string]: NpcDialogue;
}

interface NpcInteractionModalProps {
    isOpen: boolean;
    onClose: () => void;
    npc: {
        id: string;
        name: string;
        image?: string;
        type: string;
    };
}

const NpcInteractionModal: React.FC<NpcInteractionModalProps> = ({
    isOpen,
    onClose,
    npc,
}) => {
    const [currentDialogue, setCurrentDialogue] = useState<string>("greeting");

    // Демо дерево диалогов для НПС
    const dialogues: DialogueTree = {
        greeting: {
            text: "Приветствую тебя, путник. Чем я могу помочь?",
            options: [
                { id: "1", text: "Что это за место?", next: "about_place" },
                {
                    id: "2",
                    text: "У тебя есть задания для меня?",
                    next: "quests",
                },
                { id: "3", text: "Расскажи о себе", next: "about_npc" },
                {
                    id: "4",
                    text: "Ничего, я просто осматриваюсь",
                    next: "farewell",
                },
            ],
        },
        about_place: {
            text: "Это Лагерь выживших - одно из немногих безопасных мест в этих землях. Здесь собираются те, кто смог выжить после великого проклятия.",
            options: [
                { id: "1", text: "Что за проклятие?", next: "about_curse" },
                {
                    id: "2",
                    text: "Вернуться к началу разговора",
                    next: "greeting",
                },
            ],
        },
        about_curse: {
            text: "Древнее зло пробудилось в глубинах забытых руин. Мертвые восстали из могил, чудовища заполнили леса и долины. Мы, выжившие, пытаемся найти способ снять проклятие и вернуть мир к жизни.",
            options: [
                { id: "1", text: "Как я могу помочь?", next: "quests" },
                {
                    id: "2",
                    text: "Вернуться к началу разговора",
                    next: "greeting",
                },
            ],
        },
        quests: {
            text: "У меня есть несколько заданий для смелых авантюристов. В Лесах Теней видели раненого теневого волка. Он ослаблен, но все еще опасен. Принеси мне его клык, и я хорошо заплачу.",
            options: [
                {
                    id: "1",
                    text: "Я возьмусь за это задание",
                    next: "accept_quest",
                },
                {
                    id: "2",
                    text: "Есть ли другие задания?",
                    next: "more_quests",
                },
                {
                    id: "3",
                    text: "Вернуться к началу разговора",
                    next: "greeting",
                },
            ],
        },
        more_quests: {
            text: "Пока что нет доступных заданий. Возвращайся позже, когда наберешься больше опыта.",
            options: [
                {
                    id: "1",
                    text: "Понятно. Вернуться к началу разговора",
                    next: "greeting",
                },
            ],
        },
        accept_quest: {
            text: "Отлично! Будь осторожен в Лесах Теней. Теневой волк может быть ранен, но он все еще очень опасен. Возвращайся с его клыком, и награда будет твоей.",
            options: [{ id: "1", text: "Я не подведу", next: "farewell" }],
        },
        about_npc: {
            text: "Я - Старейшина Ирмель, хранительница знаний и традиций. Я была здесь еще до проклятия и видела, как наш мир изменился. Теперь я помогаю выжившим и направляю молодых героев, таких как ты.",
            options: [
                {
                    id: "1",
                    text: "Вернуться к началу разговора",
                    next: "greeting",
                },
            ],
        },
        farewell: {
            text: "Удачи тебе, путник. Да хранят тебя древние боги в твоих странствиях.",
            options: [{ id: "1", text: "Прощай", action: "close" }],
        },
    };

    // Сбрасываем диалог при открытии модального окна
    useEffect(() => {
        if (isOpen) {
            setCurrentDialogue("greeting");
        }
    }, [isOpen]);

    const handleOptionClick = (option: {
        id: string;
        text: string;
        next?: string;
        action?: string;
    }) => {
        if (option.action === "close") {
            onClose();
        } else if (option.next) {
            setCurrentDialogue(option.next);
        }
    };

    const getDialogueAvatar = () => {
        if (npc.id === "quest-giver") {
            return "/images/npcs/quest-giver.jpg";
        } else if (npc.id === "merchant") {
            return "/images/npcs/merchant.jpg";
        }
        return "/images/npcs/fallback-npc.jpg";
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-70" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-gradient-to-b from-gray-800 to-gray-900 border border-red-900/40 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medieval text-red-500 text-center border-b border-red-900/30 pb-2 mb-4"
                                >
                                    {npc.name}
                                </Dialog.Title>

                                <div className="flex space-x-4 mb-4">
                                    <div className="w-24 h-24 flex-shrink-0">
                                        <img
                                            src={
                                                npc.image || getDialogueAvatar()
                                            }
                                            alt={npc.name}
                                            className="w-full h-full object-cover rounded-md border border-red-900/40"
                                            onError={(e) => {
                                                (
                                                    e.target as HTMLImageElement
                                                ).src =
                                                    "/images/npcs/fallback-npc.jpg";
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 bg-gray-900 p-3 rounded-md border border-red-900/30 relative">
                                        <p className="text-gray-300 text-sm">
                                            {dialogues[currentDialogue]?.text ||
                                                "..."}
                                        </p>
                                        <div className="absolute bottom-0 right-0 transform translate-x-2 translate-y-2 w-4 h-4 bg-gray-900 border-r border-b border-red-900/30 rotate-45"></div>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-6">
                                    {dialogues[currentDialogue]?.options.map(
                                        (option) => (
                                            <button
                                                key={option.id}
                                                className="w-full text-left px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-red-900/40 rounded-md text-gray-300 text-sm transition-colors"
                                                onClick={() =>
                                                    handleOptionClick(option)
                                                }
                                            >
                                                {option.text}
                                            </button>
                                        )
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={onClose}
                                    >
                                        Закрыть
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default NpcInteractionModal;
