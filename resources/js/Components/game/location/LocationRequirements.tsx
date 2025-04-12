import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Location } from "../../../stores/LocationStore";

// Интерфейс для требований
export interface Requirement {
    type: string;
    parameter: string;
    value: number | string;
    description: string;
    fulfilled: boolean;
    current_value?: number | string;
}

// Компонент для отображения отдельного требования
export const LocationRequirement: React.FC<{
    requirement: Requirement;
}> = ({ requirement }) => {
    // Иконки для различных типов требований
    const requirementIcons: Record<string, string> = {
        level: "⭐",
        quest: "📜",
        skill: "⚔️",
        gold: "💰",
        item: "🎒",
        attribute: "💪",
        strength: "💪",
        agility: "🏃",
        intelligence: "🧠",
        vitality: "❤️",
        luck: "🍀",
        charisma: "👄",
        wisdom: "📚",
        dexterity: "✋",
        constitution: "🛡️",
    };

    // Локализация названий атрибутов
    const getAttributeName = (attribute: string): string => {
        const attributeNames: Record<string, string> = {
            level: "Уровень",
            quest: "Квест",
            skill: "Навык",
            gold: "Золото",
            item: "Предмет",
            attribute: "Атрибут",
            strength: "Сила",
            agility: "Ловкость",
            intelligence: "Интеллект",
            vitality: "Выносливость",
            luck: "Удача",
            charisma: "Харизма",
            wisdom: "Мудрость",
            dexterity: "Проворство",
            constitution: "Телосложение",
        };

        return attributeNames[attribute] || attribute;
    };

    // Формирование читаемого текста требования
    const getRequirementText = (): string => {
        // Используем уже подготовленное описание, если оно есть
        if (requirement.description) {
            return requirement.description;
        }

        // Если описания нет, формируем его на основе типа требования и параметра
        if (requirement.type === "attribute") {
            const attributeName = getAttributeName(requirement.parameter);
            return `${attributeName} ${requirement.value}`;
        } else {
            // Для других типов требований
            return `${getAttributeName(requirement.type)} ${requirement.value}`;
        }
    };

    return (
        <div
            className={`text-xs flex items-center ${
                requirement.fulfilled ? "text-green-400" : "text-red-400"
            }`}
        >
            <span className="mr-1">
                {requirementIcons[requirement.type] ||
                    requirementIcons[requirement.parameter] ||
                    "❓"}
            </span>
            <span>{getRequirementText()}</span>
            {requirement.current_value !== undefined && (
                <span className="ml-1 font-medium">
                    ({requirement.current_value}/{requirement.value})
                </span>
            )}
        </div>
    );
};

// Компонент списка требований
export const RequirementsList: React.FC<{
    requirements: Requirement[];
}> = ({ requirements }) => {
    // Группируем требования на выполненные и невыполненные
    const fulfilledRequirements = requirements.filter((req) => req.fulfilled);
    const unfulfilledRequirements = requirements.filter(
        (req) => !req.fulfilled
    );

    return (
        <div className="space-y-3">
            {unfulfilledRequirements.length > 0 && (
                <div>
                    <h4 className="text-xs text-red-400 font-semibold mb-1">
                        Не выполнены:
                    </h4>
                    <div className="space-y-1">
                        {unfulfilledRequirements.map((req, index) => (
                            <LocationRequirement
                                key={`unfulfilled-${index}`}
                                requirement={req}
                            />
                        ))}
                    </div>
                </div>
            )}

            {fulfilledRequirements.length > 0 && (
                <div>
                    <h4 className="text-xs text-green-400 font-semibold mb-1">
                        Выполнены:
                    </h4>
                    <div className="space-y-1">
                        {fulfilledRequirements.map((req, index) => (
                            <LocationRequirement
                                key={`fulfilled-${index}`}
                                requirement={req}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Модальное окно с требованиями локации
const LocationRequirementsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    location: Location | null;
}> = ({ isOpen, onClose, location }) => {
    if (!location) return null;

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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-md border border-red-900/40 bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medieval text-red-500 text-center"
                                >
                                    Требования для локации{" "}
                                    <span className="text-red-400">
                                        {location.name}
                                    </span>
                                </Dialog.Title>

                                <div className="mt-4">
                                    {/* Если есть заданные требования в локации, используем их */}
                                    {location.requirements &&
                                    location.requirements.length > 0 ? (
                                        <RequirementsList
                                            requirements={location.requirements}
                                        />
                                    ) : // Если требований нет в локации, но есть проблема доступа
                                    location.accessibility_issue ? (
                                        <div className="text-sm text-red-400">
                                            {
                                                location.accessibility_issue
                                                    .description
                                            }
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-400">
                                            У этой локации нет особых требований
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 text-center">
                                    <button
                                        type="button"
                                        className="bg-red-900 hover:bg-red-800 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-200"
                                        onClick={onClose}
                                    >
                                        Закрыть
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default LocationRequirementsModal;
