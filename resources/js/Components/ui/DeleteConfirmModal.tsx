import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Обработка нажатия Escape для закрытия модального окна
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose]);

    // Блокировка скролла при открытии модального окна
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Затемнение фона */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Модальное окно */}
            <div
                ref={modalRef}
                className="bg-gradient-to-b from-gray-800 to-gray-900 border border-red-900/30 rounded-lg p-6 shadow-2xl max-w-md w-full relative z-10 animate-fade-in-down"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Декоративные элементы */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-700/60"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-700/60"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red-700/60"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-700/60"></div>

                {/* Заголовок */}
                <h2 className="text-xl text-red-500 mb-4">{title}</h2>

                {/* Сообщение */}
                <p className="text-gray-300 mb-6">{message}</p>

                {/* Кнопки */}
                <div className="flex justify-end space-x-3">
                    <Button variant="secondary" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button variant="danger" onClick={onConfirm}>
                        Удалить
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DeleteConfirmModal;
