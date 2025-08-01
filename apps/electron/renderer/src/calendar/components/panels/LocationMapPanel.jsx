// 위치 및 지도 연동 패널
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { formatDate, formatTime } from '../../utils/dateHelpers';

const LocationMapPanel = ({
  isOpen,
  onClose,
  event,
  onUpdateLocation,
  onSavePlace,
  onGetDirections,
  onSearchNearby,
  mapProvider = 'google', // 'google', 'kakao', 'naver'
  apiKey,
  defaultLocation = { lat: 37.5665, lng: 126.9780 }, // Seoul
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'map', 'directions', 'nearby'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(event?.location || null);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultLocation);
  const [markers, setMarkers] = useState([]);
  const [directionsData, setDirectionsData] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [transportMode, setTransportMode] = useState('driving'); // 'driving', 'walking', 'transit', 'bicycling'
  const [routeOptions, setRouteOptions] = useState({
    avoidTolls: false,
    avoidHighways: false,
    optimizeWaypoints: false
  });
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [recentLocations, setRecentLocations] = useState([]);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [trafficInfo, setTrafficInfo] = useState(null);
  const mapRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // 장소 검색 핸들러 (디바운싱 적용)
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // TODO: 실제 지도 API 연동
      // 현재는 Mock 데이터로 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockResults = [
        {
          id: '1',
          name: '강남역',
          address: '서울특별시 강남구 강남대로 396',
          lat: 37.4979,
          lng: 127.0276,
          type: 'transit_station',
          rating: 4.2,
          vicinity: '강남구',
          placeId: 'place_1'
        },
        {
          id: '2',
          name: '코엑스',
          address: '서울특별시 강남구 영동대로 513',
          lat: 37.5115,
          lng: 127.0595,
          type: 'shopping_mall',
          rating: 4.0,
          vicinity: '강남구',
          placeId: 'place_2'
        },
        {
          id: '3', 
          name: '롯데월드타워',
          address: '서울특별시 송파구 올림픽로 300',
          lat: 37.5125,
          lng: 127.1025,
          type: 'tourist_attraction',
          rating: 4.5,
          vicinity: '송파구',
          placeId: 'place_3'
        }
      ].filter(place => 
        place.name.includes(query) || 
        place.address.includes(query)
      );

      setSearchResults(mockResults);
    } catch (error) {
      console.error('장소 검색 실패:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 검색어 변경 시 디바운싱 적용
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, handleSearch]);

  // 장소 선택 핸들러
  const handleSelectLocation = useCallback((location) => {
    setSelectedLocation(location);
    setMapCenter({ lat: location.lat, lng: location.lng });
    
    // 최근 위치에 추가
    setRecentLocations(prev => {
      const filtered = prev.filter(loc => loc.id !== location.id);
      return [location, ...filtered].slice(0, 10);
    });
  }, []);

  // 현재 위치 가져오기
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('브라우저에서 위치 서비스를 지원하지 않습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentLocation = {
          id: 'current',
          name: '현재 위치',
          lat: latitude,
          lng: longitude,
          type: 'current_location'
        };
        
        handleSelectLocation(currentLocation);
        
        // 역지오코딩으로 주소 가져오기
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        console.error('위치 가져오기 실패:', error);
        alert('현재 위치를 가져올 수 없습니다.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }, [handleSelectLocation]);

  // 역지오코딩 (좌표 → 주소)
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      // TODO: 실제 역지오코딩 API 호출
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockAddress = '서울특별시 강남구 테헤란로 123';
      
      setSelectedLocation(prev => prev ? {
        ...prev,
        address: mockAddress
      } : null);
    } catch (error) {
      console.error('역지오코딩 실패:', error);
    }
  }, []);

  // 길찾기 요청
  const handleGetDirections = useCallback(async (destination, origin = null) => {
    if (!destination) return;

    try {
      setDirectionsData(null);
      
      // TODO: 실제 길찾기 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockDirections = {
        routes: [{
          summary: '경부고속도로 경유',
          distance: '15.2 km',
          duration: '25분',
          steps: [
            { instruction: '강남역에서 출발', distance: '0 km', duration: '0분' },
            { instruction: '테헤란로를 따라 동쪽으로 이동', distance: '2.1 km', duration: '3분' },
            { instruction: '우회전하여 올림픽대로 진입', distance: '5.8 km', duration: '8분' },
            { instruction: '잠실대교를 건너 송파구 방향', distance: '3.2 km', duration: '5분' },
            { instruction: '롯데월드타워 도착', distance: '4.1 km', duration: '9분' }
          ]
        }],
        origin: origin || { lat: 37.4979, lng: 127.0276, name: '강남역' },
        destination: destination
      };

      setDirectionsData(mockDirections);
      onGetDirections?.(mockDirections);
    } catch (error) {
      console.error('길찾기 실패:', error);
      alert('길찾기 정보를 가져올 수 없습니다.');
    }
  }, [onGetDirections]);

  // 주변 시설 검색
  const handleSearchNearby = useCallback(async (type, radius = 1000) => {
    if (!selectedLocation) return;

    try {
      // TODO: 실제 주변 검색 API 호출
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockNearbyPlaces = {
        restaurant: [
          { id: '1', name: '맛집 A', distance: '150m', rating: 4.5, type: 'restaurant' },
          { id: '2', name: '카페 B', distance: '220m', rating: 4.2, type: 'cafe' },
          { id: '3', name: '식당 C', distance: '380m', rating: 4.0, type: 'restaurant' }
        ],
        parking: [
          { id: '4', name: '지하주차장', distance: '50m', type: 'parking' },
          { id: '5', name: '공영주차장', distance: '180m', type: 'parking' }
        ],
        transit: [
          { id: '6', name: '지하철 2호선', distance: '100m', type: 'subway_station' },
          { id: '7', name: '버스정류장', distance: '80m', type: 'bus_station' }
        ],
        hospital: [
          { id: '8', name: '종합병원', distance: '500m', rating: 4.3, type: 'hospital' }
        ]
      };

      const results = mockNearbyPlaces[type] || [];
      setNearbyPlaces(results);
      onSearchNearby?.(type, results);
    } catch (error) {
      console.error('주변 검색 실패:', error);
    }
  }, [selectedLocation, onSearchNearby]);

  // 날씨 정보 가져오기
  const fetchWeatherInfo = useCallback(async (lat, lng) => {
    try {
      // TODO: 실제 날씨 API 호출
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockWeather = {
        temperature: 22,
        condition: '맑음',
        humidity: 65,
        windSpeed: 3.2,
        icon: '☀️',
        forecast: [
          { time: '12:00', temp: 22, condition: '맑음' },
          { time: '15:00', temp: 25, condition: '맑음' },
          { time: '18:00', temp: 23, condition: '구름조금' }
        ]
      };

      setWeatherInfo(mockWeather);
    } catch (error) {
      console.error('날씨 정보 가져오기 실패:', error);
    }
  }, []);

  // 교통 정보 가져오기
  const fetchTrafficInfo = useCallback(async () => {
    try {
      // TODO: 실제 교통 정보 API 호출
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockTraffic = {
        status: 'moderate',
        message: '평상시보다 10분 더 소요될 수 있습니다',
        incidents: [
          { type: 'construction', message: '도로 공사로 인한 지연' },
          { type: 'accident', message: '경부고속도로 사고로 인한 정체' }
        ]
      };

      setTrafficInfo(mockTraffic);
    } catch (error) {
      console.error('교통 정보 가져오기 실패:', error);
    }
  }, []);

  // 즐겨찾기 추가/제거
  const toggleFavorite = useCallback((location) => {
    setFavoriteLocations(prev => {
      const exists = prev.find(fav => fav.id === location.id);
      if (exists) {
        return prev.filter(fav => fav.id !== location.id);
      } else {
        return [...prev, location];
      }
    });
  }, []);

  // 위치 정보 저장
  const handleSaveLocation = useCallback(() => {
    if (!selectedLocation) return;

    onUpdateLocation?.(selectedLocation);
    onSavePlace?.(selectedLocation);
    onClose();
  }, [selectedLocation, onUpdateLocation, onSavePlace, onClose]);

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    if (isOpen && selectedLocation) {
      fetchWeatherInfo(selectedLocation.lat, selectedLocation.lng);
      fetchTrafficInfo();
    }
  }, [isOpen, selectedLocation, fetchWeatherInfo, fetchTrafficInfo]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">위치 및 지도</h2>
            <p className="text-sm text-gray-500 mt-1">
              {event?.title} - 장소 정보 설정 및 길찾기
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'search', label: '장소 검색', icon: '🔍' },
              { id: 'map', label: '지도 보기', icon: '🗺️' },
              { id: 'directions', label: '길찾기', icon: '🧭' },
              { id: 'nearby', label: '주변 시설', icon: '📍' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 탭 내용 */}
        <div className="flex-1 overflow-hidden flex">
          {/* 왼쪽 패널 */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            {/* 장소 검색 탭 */}
            {activeTab === 'search' && (
              <div className="flex flex-col h-full">
                {/* 검색 입력 */}
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="장소명, 주소 또는 키워드 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* 빠른 액션 버튼 */}
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={getCurrentLocation}
                      className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 text-sm rounded-md hover:bg-blue-200 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      현재 위치
                    </button>
                  </div>
                </div>

                {/* 검색 결과 */}
                <div className="flex-1 overflow-y-auto">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">검색 중...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="p-4 space-y-3">
                      {searchResults.map((place) => (
                        <div
                          key={place.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedLocation?.id === place.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                          onClick={() => handleSelectLocation(place)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{place.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{place.address}</p>
                              {place.vicinity && (
                                <p className="text-xs text-gray-500 mt-1">{place.vicinity}</p>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-3">
                              {place.rating && (
                                <div className="flex items-center">
                                  <span className="text-yellow-500 text-sm">★</span>
                                  <span className="text-sm text-gray-600 ml-1">{place.rating}</span>
                                </div>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(place);
                                }}
                                className={`p-1 rounded transition-colors ${
                                  favoriteLocations.find(fav => fav.id === place.id)
                                    ? 'text-red-500 hover:text-red-600'
                                    : 'text-gray-400 hover:text-red-500'
                                }`}
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <div className="text-center py-12">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-gray-500">검색 결과가 없습니다</p>
                      <p className="text-sm text-gray-400 mt-1">다른 키워드로 검색해보세요</p>
                    </div>
                  ) : (
                    <div className="p-4">
                      {/* 즐겨찾기 */}
                      {favoriteLocations.length > 0 && (
                        <div className="mb-6">
                          <h3 className="font-medium text-gray-900 mb-3">즐겨찾기</h3>
                          <div className="space-y-2">
                            {favoriteLocations.slice(0, 5).map((place) => (
                              <div
                                key={place.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSelectLocation(place)}
                              >
                                <div>
                                  <h4 className="font-medium text-gray-900 text-sm">{place.name}</h4>
                                  <p className="text-xs text-gray-600">{place.address}</p>
                                </div>
                                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 최근 검색 */}
                      {recentLocations.length > 0 && (
                        <div>
                          <h3 className="font-medium text-gray-900 mb-3">최근 검색</h3>
                          <div className="space-y-2">
                            {recentLocations.slice(0, 5).map((place) => (
                              <div
                                key={place.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSelectLocation(place)}
                              >
                                <div>
                                  <h4 className="font-medium text-gray-900 text-sm">{place.name}</h4>
                                  <p className="text-xs text-gray-600">{place.address}</p>
                                </div>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 지도 보기 탭 */}
            {activeTab === 'map' && (
              <div className="p-4 h-full">
                <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                    </svg>
                    <p className="text-lg font-medium text-gray-600">지도 컴포넌트</p>
                    <p className="text-sm text-gray-500 mt-1">
                      지도 API 연동 후 표시됩니다
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 길찾기 탭 */}
            {activeTab === 'directions' && (
              <div className="flex flex-col h-full">
                {/* 길찾기 설정 */}
                <div className="p-4 border-b border-gray-200">
                  <div className="space-y-4">
                    {/* 교통수단 선택 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">교통수단</label>
                      <div className="flex space-x-2">
                        {[
                          { id: 'driving', label: '자동차', icon: '🚗' },
                          { id: 'transit', label: '대중교통', icon: '🚌' },
                          { id: 'walking', label: '도보', icon: '🚶' },
                          { id: 'bicycling', label: '자전거', icon: '🚴' }
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            onClick={() => setTransportMode(mode.id)}
                            className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              transportMode === mode.id
                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <span className="mr-1">{mode.icon}</span>
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 경로 옵션 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">경로 옵션</label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={routeOptions.avoidTolls}
                            onChange={(e) => setRouteOptions(prev => ({ ...prev, avoidTolls: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">유료도로 피하기</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={routeOptions.avoidHighways}
                            onChange={(e) => setRouteOptions(prev => ({ ...prev, avoidHighways: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">고속도로 피하기</span>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={() => selectedLocation && handleGetDirections(selectedLocation)}
                      disabled={!selectedLocation}
                      className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      길찾기 시작
                    </button>
                  </div>
                </div>

                {/* 길찾기 결과 */}
                <div className="flex-1 overflow-y-auto">
                  {directionsData ? (
                    <div className="p-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-green-900">경로 정보</h3>
                          <div className="text-sm text-green-700">
                            {directionsData.routes[0].duration}
                          </div>
                        </div>
                        <div className="text-sm text-green-700">
                          <p>거리: {directionsData.routes[0].distance}</p>
                          <p>경로: {directionsData.routes[0].summary}</p>
                        </div>
                      </div>

                      {/* 교통 정보 */}
                      {trafficInfo && (
                        <div className={`border rounded-lg p-4 mb-4 ${
                          trafficInfo.status === 'good' ? 'bg-green-50 border-green-200' :
                          trafficInfo.status === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-red-50 border-red-200'
                        }`}>
                          <h4 className="font-medium text-gray-900 mb-2">실시간 교통 정보</h4>
                          <p className="text-sm text-gray-700">{trafficInfo.message}</p>
                          {trafficInfo.incidents.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {trafficInfo.incidents.map((incident, index) => (
                                <p key={index} className="text-xs text-gray-600">• {incident.message}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 단계별 길안내 */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">단계별 길안내</h4>
                        <div className="space-y-3">
                          {directionsData.routes[0].steps.map((step, index) => (
                            <div key={index} className="flex items-start">
                              <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-900">{step.instruction}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {step.distance} • {step.duration}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                        </svg>
                        <p className="text-gray-500">목적지를 선택하고 길찾기를 시작하세요</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 주변 시설 탭 */}
            {activeTab === 'nearby' && (
              <div className="flex flex-col h-full">
                {/* 시설 타입 선택 */}
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">주변 시설 검색</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'restaurant', label: '음식점', icon: '🍽️' },
                      { id: 'parking', label: '주차장', icon: '🅿️' },
                      { id: 'transit', label: '대중교통', icon: '🚌' },
                      { id: 'hospital', label: '병원', icon: '🏥' },
                      { id: 'gas_station', label: '주유소', icon: '⛽' },
                      { id: 'bank', label: '은행', icon: '🏦' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleSearchNearby(type.id)}
                        className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <span className="mr-2">{type.icon}</span>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 주변 시설 목록 */}
                <div className="flex-1 overflow-y-auto">
                  {nearbyPlaces.length > 0 ? (
                    <div className="p-4 space-y-3">
                      {nearbyPlaces.map((place) => (
                        <div key={place.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">{place.name}</h4>
                            <p className="text-xs text-gray-600">{place.distance}</p>
                            {place.rating && (
                              <div className="flex items-center mt-1">
                                <span className="text-yellow-500 text-xs">★</span>
                                <span className="text-xs text-gray-600 ml-1">{place.rating}</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleGetDirections(place)}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                          >
                            길찾기
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-gray-500">위치를 선택하고 주변 시설을 검색하세요</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽 패널 - 상세 정보 */}
          <div className="w-1/2 flex flex-col">
            {selectedLocation ? (
              <div className="p-6 h-full overflow-y-auto">
                {/* 선택된 위치 정보 */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedLocation.name}</h3>
                      {selectedLocation.address && (
                        <p className="text-sm text-gray-600 mt-1">{selectedLocation.address}</p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleFavorite(selectedLocation)}
                      className={`p-2 rounded-lg transition-colors ${
                        favoriteLocations.find(fav => fav.id === selectedLocation.id)
                          ? 'text-red-500 bg-red-50 hover:bg-red-100'
                          : 'text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-red-500'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  {/* 좌표 정보 */}
                  <div className="text-xs text-gray-500 mb-4">
                    좌표: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </div>

                  {/* 빠른 액션 버튼 */}
                  <div className="flex space-x-2 mb-6">
                    <button
                      onClick={() => handleGetDirections(selectedLocation)}
                      className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 text-sm rounded-md hover:bg-blue-200 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                      </svg>
                      길찾기
                    </button>
                    <button
                      onClick={() => handleSearchNearby('restaurant')}
                      className="flex items-center px-3 py-2 bg-green-100 text-green-700 text-sm rounded-md hover:bg-green-200 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      주변 검색
                    </button>
                  </div>
                </div>

                {/* 날씨 정보 */}
                {weatherInfo && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">날씨 정보</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{weatherInfo.icon}</span>
                          <div>
                            <p className="font-medium text-gray-900">{weatherInfo.temperature}°C</p>
                            <p className="text-sm text-gray-600">{weatherInfo.condition}</p>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <p>습도: {weatherInfo.humidity}%</p>
                          <p>바람: {weatherInfo.windSpeed}m/s</p>
                        </div>
                      </div>

                      {/* 시간별 예보 */}
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {weatherInfo.forecast.map((forecast, index) => (
                          <div key={index} className="text-center bg-white rounded-md p-2">
                            <p className="text-xs text-gray-600">{forecast.time}</p>
                            <p className="text-sm font-medium text-gray-900">{forecast.temp}°C</p>
                            <p className="text-xs text-gray-500">{forecast.condition}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 추가 정보 입력 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">장소 메모</h4>
                  <textarea
                    placeholder="장소에 대한 추가 정보나 메모를 입력하세요..."
                    className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    defaultValue={selectedLocation.notes || ''}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-600">장소를 선택하세요</p>
                  <p className="text-sm text-gray-500 mt-1">
                    왼쪽에서 장소를 검색하고 선택하면 상세 정보가 표시됩니다
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {selectedLocation ? (
                <span>선택된 위치: {selectedLocation.name}</span>
              ) : (
                <span>장소를 선택해주세요</span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveLocation}
                disabled={!selectedLocation}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                위치 저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationMapPanel;