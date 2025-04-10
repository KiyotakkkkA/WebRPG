import React, { useState, useEffect, useRef } from "react";
import { Head } from "@inertiajs/react";
import { useNavigate, useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import characterStore from "../../stores/CharacterStore";
import locationStore, { Location, Region } from "../../stores/LocationStore";
import Button from "../../Components/ui/Button";
import GameHeader from "../../Layouts/GameHeader";
import GameMap from "../../Components/game/GameMap";

interface WorldMapProps {
    characterId?: number;
}

// Иконки для кнопок
const MapIcon = ({ size = 24, className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3 6l6-3l6 3l6-3v15l-6 3l-6-3l-6 3V6z" />
        <path d="M9 3v15" />
        <path d="M15 6v15" />
    </svg>
);

const LocationIcon = ({ size = 24, className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
        <circle cx="12" cy="9" r="2" />
    </svg>
);

const BackIcon = ({ size = 24, className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

// Компонент карты мира
const WorldMap: React.FC<WorldMapProps> = observer(({ characterId }) => {
    const navigate = useNavigate();
    const params = useParams();
    const [mapMode, setMapMode] = useState<"region" | "world">("world");
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(
        null
    );
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Реф для отслеживания инициализации данных
    const isInitializedRef = useRef(false);
    // Реф для отслеживания ID персонажа
    const lastCharIdRef = useRef<number | null>(null);

    // Используем ID персонажа из параметров маршрута, если он не был передан явно
    const charId = characterId || Number(params.characterId);
    const currentLocation = locationStore.currentLocation;

    // Загрузка данных только при монтировании компонента и изменении ID персонажа
    useEffect(() => {
        // Если запрос уже был выполнен для того же персонажа, не выполняем повторно
        if (lastCharIdRef.current === charId && isInitializedRef.current) {
            return;
        }

        // Функция загрузки данных
        const fetchData = async () => {
            setIsLoading(true);
            setLoadError(null);

            try {
                if (!charId) {
                    throw new Error("Не удалось определить ID персонажа");
                }

                // Обновляем реф с ID персонажа
                lastCharIdRef.current = charId;

                // Сначала загружаем информацию о персонаже
                const character = await characterStore.loadCharacter(charId);

                if (!character) {
                    throw new Error("Не удалось загрузить персонажа");
                }

                // Затем загружаем информацию о локациях
                const locationData = await locationStore.loadAvailableLocations(
                    charId
                );
                if (locationData) {
                    setLocations(locationData.availableLocations);

                    // Устанавливаем текущий регион, если он есть
                    if (locationData.currentLocation?.region) {
                        setSelectedRegion(locationData.currentLocation.region);
                        setMapMode("region");
                    }
                }

                // Отмечаем, что инициализация выполнена
                isInitializedRef.current = true;
            } catch (error) {
                console.error("Ошибка при загрузке данных для карты:", error);
                setLoadError(
                    error instanceof Error
                        ? error.message
                        : "Неизвестная ошибка при загрузке данных"
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [charId]); // Убираем currentLocation?.region из зависимостей

    // Обновляем регион только когда изменяется currentLocation и данные уже загружены
    useEffect(() => {
        if (!isInitializedRef.current || !currentLocation?.region) return;

        setSelectedRegion(currentLocation.region);
        setMapMode("region");
    }, [currentLocation?.region?.id]); // Используем только id региона, а не весь объект

    // Если произошла ошибка загрузки, показываем сообщение и кнопку возврата
    if (loadError) {
        return (
            <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center">
                <GameHeader />
                <div className="p-6 bg-gray-800 rounded-lg border border-red-900/40 max-w-lg mx-auto my-10 text-center">
                    <h2 className="text-xl text-red-400 mb-4 font-medieval">
                        Ошибка загрузки
                    </h2>
                    <p className="text-gray-300 mb-6">{loadError}</p>
                    <button
                        className="bg-red-900 hover:bg-red-800 text-white py-2 px-4 rounded"
                        onClick={() => navigate("/characters")}
                    >
                        Вернуться к выбору персонажа
                    </button>
                </div>
            </div>
        );
    }

    // Получаем список регионов из доступных локаций
    const regions = React.useMemo(() => {
        const uniqueRegions = new Map<number, Region>();

        locations.forEach((location) => {
            if (location.region && !uniqueRegions.has(location.region.id)) {
                uniqueRegions.set(location.region.id, location.region);
            }
        });

        return Array.from(uniqueRegions.values());
    }, [locations]);

    // Фильтрация локаций по выбранному региону
    const filteredLocations = React.useMemo(() => {
        if (mapMode === "world" || !selectedRegion) {
            return locations;
        }

        return locations.filter(
            (location) => location.region_id === selectedRegion.id
        );
    }, [locations, mapMode, selectedRegion]);

    // Обработчик выбора региона
    const handleRegionSelect = (region: Region) => {
        setSelectedRegion(region);
        setMapMode("region");
        setSelectedLocation(null);
        setIsDetailPanelOpen(false);
    };

    // Обработчик выбора узла на карте (региона или локации)
    const handleNodeSelect = (node: any) => {
        if (mapMode === "world") {
            // Если выбран регион на мировой карте
            const region = regions.find((r) => r.id === node.id);
            if (region) {
                handleRegionSelect(region);
            }
        } else {
            // Если выбрана локация на карте региона
            const location = filteredLocations.find((l) => l.id === node.id);
            if (location) {
                setSelectedLocation(location);
                setIsDetailPanelOpen(true);
            }
        }
    };

    // Обработчик возврата к карте мира
    const handleBackToWorld = () => {
        setMapMode("world");
        setSelectedRegion(null);
        setSelectedLocation(null);
        setIsDetailPanelOpen(false);
    };

    // Закрыть детальную панель локации
    const handleCloseDetailPanel = () => {
        setIsDetailPanelOpen(false);
    };

    return (
        <>
            <Head title="Карта мира" />
            <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
                {/* Верхняя панель с GameHeader */}
                <GameHeader activeLocationName={currentLocation?.name} />

                {/* Основная область карты */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Левая панель с списком регионов/локаций */}
                    <div className="w-64 bg-gray-800 border-r border-red-900/50 overflow-y-auto p-4">
                        {/* Заголовок панели с информацией о текущем режиме */}
                        <div className="mb-4 border-b border-red-900/30 pb-3">
                            <h3 className="text-red-500 text-center font-medieval uppercase tracking-wider">
                                {mapMode === "world"
                                    ? "Регионы"
                                    : selectedRegion?.name}
                            </h3>
                            {selectedRegion && mapMode === "region" && (
                                <p className="text-xs text-gray-400 text-center mt-1">
                                    {selectedRegion.description}
                                </p>
                            )}
                        </div>

                        {/* Кнопки навигации */}
                        <div className="flex mb-4 border border-red-900/40 rounded-md overflow-hidden">
                            <button
                                className={`flex-1 py-2 px-2 flex justify-center items-center text-xs ${
                                    mapMode === "world"
                                        ? "bg-red-900/40 text-red-300"
                                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                }`}
                                onClick={handleBackToWorld}
                            >
                                <MapIcon size={14} className="mr-1" />
                                Мировая карта
                            </button>
                            {selectedRegion && (
                                <button
                                    className={`flex-1 py-2 px-2 flex justify-center items-center text-xs ${
                                        mapMode === "region"
                                            ? "bg-red-900/40 text-red-300"
                                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                    }`}
                                    onClick={() => setMapMode("region")}
                                >
                                    <LocationIcon size={14} className="mr-1" />
                                    Карта региона
                                </button>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center p-4">
                                <span className="text-gray-400">
                                    Загрузка...
                                </span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {mapMode === "world"
                                    ? // Список регионов
                                      regions.map((region) => (
                                          <div
                                              key={region.id}
                                              className="p-2 rounded-md cursor-pointer hover:bg-gray-700 border border-transparent hover:border-red-900/30"
                                              onClick={() =>
                                                  handleRegionSelect(region)
                                              }
                                          >
                                              <div className="flex items-center">
                                                  {region.icon && (
                                                      <img
                                                          src={region.icon}
                                                          alt={region.name}
                                                          className="w-6 h-6 mr-2"
                                                          onError={(e) => {
                                                              (
                                                                  e.target as HTMLImageElement
                                                              ).src =
                                                                  "/images/icons/region-default.png";
                                                          }}
                                                      />
                                                  )}
                                                  <span className="text-sm text-red-400">
                                                      {region.name}
                                                  </span>
                                              </div>
                                              {region.description && (
                                                  <p className="text-xs text-gray-400 mt-1">
                                                      {region.description}
                                                  </p>
                                              )}
                                          </div>
                                      ))
                                    : // Список локаций
                                      filteredLocations.map((location) => (
                                          <div
                                              key={location.id}
                                              className={`p-2 rounded-md cursor-pointer hover:bg-gray-700 border ${
                                                  location.is_current
                                                      ? "bg-red-900/30 border-red-800/50"
                                                      : selectedLocation?.id ===
                                                        location.id
                                                      ? "bg-yellow-900/20 border-yellow-800/40"
                                                      : "border-transparent hover:border-red-900/30"
                                              }`}
                                              onClick={() => {
                                                  setSelectedLocation(location);
                                                  setIsDetailPanelOpen(true);
                                              }}
                                          >
                                              <div className="flex items-center justify-between">
                                                  <span className="text-sm text-red-400">
                                                      {location.name}
                                                  </span>
                                                  {location.is_current && (
                                                      <span className="text-xs text-red-300 ml-auto">
                                                          ⚑
                                                      </span>
                                                  )}
                                              </div>
                                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                                  {location.description.slice(
                                                      0,
                                                      50
                                                  )}
                                                  ...
                                              </p>
                                          </div>
                                      ))}

                                {mapMode === "world" &&
                                    regions.length === 0 && (
                                        <div className="text-sm text-gray-500 text-center p-4">
                                            Регионы не найдены
                                        </div>
                                    )}

                                {mapMode === "region" &&
                                    filteredLocations.length === 0 && (
                                        <div className="text-sm text-gray-500 text-center p-4">
                                            Локации не найдены
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>

                    {/* Область карты */}
                    <div className="flex-1 relative bg-gray-900">
                        {/* GameMap компонент для отрисовки карты */}
                        <GameMap
                            mapMode={mapMode}
                            regionId={selectedRegion?.id}
                            characterId={charId}
                            onNodeSelect={handleNodeSelect}
                        />

                        {/* Панель с детальной информацией о выбранной локации */}
                        {mapMode === "region" &&
                            selectedLocation &&
                            isDetailPanelOpen && (
                                <div className="absolute right-0 top-0 bottom-0 w-80 bg-gray-800 border-l border-red-900/40 p-4 overflow-y-auto">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg text-red-400 font-medieval">
                                            {selectedLocation.name}
                                        </h3>
                                        <button
                                            className="text-gray-400 hover:text-gray-200"
                                            onClick={handleCloseDetailPanel}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <line
                                                    x1="18"
                                                    y1="6"
                                                    x2="6"
                                                    y2="18"
                                                ></line>
                                                <line
                                                    x1="6"
                                                    y1="6"
                                                    x2="18"
                                                    y2="18"
                                                ></line>
                                            </svg>
                                        </button>
                                    </div>

                                    {selectedLocation.image_url && (
                                        <div className="mb-4">
                                            <img
                                                src={
                                                    "/" +
                                                    selectedLocation.image_url
                                                }
                                                alt={selectedLocation.name}
                                                className="w-full h-40 object-cover rounded-md border border-red-900/30"
                                                onError={(e) => {
                                                    (
                                                        e.target as HTMLImageElement
                                                    ).src =
                                                        "/images/locations/fallback_location.jpg";
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <div className="text-sm text-gray-300 mb-2">
                                            {selectedLocation.description}
                                        </div>

                                        <div className="flex items-center mt-3">
                                            <span className="text-gray-400 text-sm mr-2">
                                                Уровень опасности:
                                            </span>
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className={`w-4 h-4 rounded-full mx-0.5 ${
                                                            i <
                                                            (selectedLocation.danger_level ||
                                                                0)
                                                                ? "bg-red-600"
                                                                : "bg-gray-600"
                                                        }`}
                                                    ></span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Кнопки действий */}
                                    <div className="space-y-2 mt-6">
                                        <button
                                            className={`w-full py-2 px-4 rounded-md text-sm flex justify-center items-center ${
                                                selectedLocation.is_current
                                                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                                    : selectedLocation.is_accessible
                                                    ? "bg-red-900 hover:bg-red-800 text-white"
                                                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                                            }`}
                                            disabled={
                                                !selectedLocation.is_accessible ||
                                                selectedLocation.is_current
                                            }
                                        >
                                            {selectedLocation.is_current
                                                ? "Вы находитесь здесь"
                                                : "Путешествовать в локацию"}
                                        </button>

                                        {!selectedLocation.is_accessible && (
                                            <div className="mt-2 p-2 bg-red-900/20 rounded-md border border-red-900/30">
                                                <h4 className="text-xs text-red-400 font-semibold mb-1">
                                                    Требования не выполнены:
                                                </h4>
                                                <p className="text-xs text-gray-300">
                                                    {selectedLocation
                                                        .accessibility_issue
                                                        ?.description ||
                                                        "Локация недоступна"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            </div>
        </>
    );
});

export default WorldMap;
