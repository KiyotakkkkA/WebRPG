import React from "react";
import { Link } from "react-router-dom";

interface NewsCardProps {
    id: string | number;
    title: string;
    excerpt: string;
    date: string;
    imageSrc?: string;
}

const NewsCard: React.FC<NewsCardProps> = ({
    id,
    title,
    excerpt,
    date,
    imageSrc,
}) => {
    const formattedDate = new Date(date).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    return (
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-md overflow-hidden border border-red-900/30 shadow-md hover:shadow-red-800/20 transition-all duration-300 hover:translate-y-[-3px] relative group">
            {/* Декоративные элементы */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-700/60"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-700/60"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-700/60"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-700/60"></div>

            {imageSrc && (
                <div className="h-48 overflow-hidden relative">
                    <img
                        src={imageSrc}
                        alt={title}
                        className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 opacity-90"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"></div>

                    {/* Заголовок над изображением */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg leading-tight text-red-400 drop-shadow-md group-hover:text-red-300 transition-colors uppercase">
                                {title}
                            </h3>
                            <span className="text-gray-400 text-xs bg-black/50 px-2 py-1 rounded ml-2 whitespace-nowrap border border-red-900/20 uppercase tracking-wider">
                                {formattedDate}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {!imageSrc && (
                <div className="p-4 border-b border-red-900/20">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg leading-tight text-red-400 group-hover:text-red-300 transition-colors uppercase">
                            {title}
                        </h3>
                        <span className="text-gray-400 text-xs bg-black/50 px-2 py-1 rounded ml-2 whitespace-nowrap border border-red-900/20 uppercase tracking-wider">
                            {formattedDate}
                        </span>
                    </div>
                </div>
            )}

            <div className="p-4">
                {imageSrc ? null : (
                    <div className="h-0.5 w-3/4 bg-gradient-to-r from-transparent via-red-700/40 to-transparent mb-4"></div>
                )}

                <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {excerpt}
                </p>

                <Link
                    to={`/news/${id}`}
                    className="text-red-400 text-sm hover:text-red-300 transition-colors inline-flex items-center group"
                >
                    <span className="mr-1">📜</span>
                    Читать далее
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-1 transform group-hover:translate-x-0.5 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </Link>
            </div>
        </div>
    );
};

export default NewsCard;
