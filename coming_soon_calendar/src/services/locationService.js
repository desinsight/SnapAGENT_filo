const axios = require('axios');
const logger = require('../utils/logger');
const response = require('../utils/response');

/**
 * 위치 정보 및 지도 연동 서비스
 * Google Maps API, 네이버 지도 API 등을 활용한 위치 서비스
 */
class LocationService {
  constructor() {
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || 'your-api-key';
    this.naverMapsApiKey = process.env.NAVER_MAPS_API_KEY;
    this.kakaoMapsApiKey = process.env.KAKAO_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  /**
   * 주소를 좌표로 변환 (Geocoding)
   * @param {string} address - 주소
   * @param {string} [provider='google'] - 지도 제공자 (google, naver, kakao)
   * @returns {Promise<Object>} 좌표 정보
   */
  async geocodeAddress(address, provider = 'google') {
    try {
      if (!address || typeof address !== 'string') {
        throw new Error('유효한 주소가 필요합니다.');
      }

      switch (provider.toLowerCase()) {
        case 'google':
          return await this.geocodeWithGoogle(address);
        case 'naver':
          return await this.geocodeWithNaver(address);
        case 'kakao':
          return await this.geocodeWithKakao(address);
        default:
          throw new Error('지원하지 않는 지도 제공자입니다.');
      }
    } catch (error) {
      logger.error('주소 좌표 변환 오류:', error);
      throw error;
    }
  }

  /**
   * Google Maps API를 사용한 주소 좌표 변환
   * @param {string} address - 주소
   * @returns {Promise<Object>} 좌표 정보
   */
  async geocodeWithGoogle(address) {
    try {
      if (!this.googleMapsApiKey) {
        throw new Error('Google Maps API 키가 설정되지 않았습니다.');
      }

      const url = `${this.baseUrl}/geocode/json`;
      const params = {
        address: address,
        key: this.googleMapsApiKey,
        language: 'ko'
      };

      const response = await axios.get(url, { params });
      
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;
        
        return {
          success: true,
          data: {
            address: result.formatted_address,
            coordinates: {
              latitude: location.lat,
              longitude: location.lng
            },
            placeId: result.place_id,
            types: result.types,
            components: result.address_components,
            confidence: this.calculateConfidence(result.geometry.location_type)
          }
        };
      } else {
        throw new Error('주소를 찾을 수 없습니다.');
      }
    } catch (error) {
      logger.error('Google Geocoding 오류:', error);
      throw error;
    }
  }

  /**
   * 네이버 지도 API를 사용한 주소 좌표 변환
   * @param {string} address - 주소
   * @returns {Promise<Object>} 좌표 정보
   */
  async geocodeWithNaver(address) {
    try {
      if (!this.naverMapsApiKey) {
        throw new Error('네이버 지도 API 키가 설정되지 않았습니다.');
      }

      const url = 'https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode';
      const params = {
        query: address
      };
      const headers = {
        'X-NCP-APIGW-API-KEY-ID': this.naverMapsApiKey,
        'X-NCP-APIGW-API-KEY': process.env.NAVER_MAPS_SECRET_KEY
      };

      const response = await axios.get(url, { params, headers });
      
      if (response.data.status === 'OK' && response.data.addresses.length > 0) {
        const result = response.data.addresses[0];
        const coordinates = result.roadAddress ? result.roadAddress : result.jibunAddress;
        
        return {
          success: true,
          data: {
            address: result.roadAddress || result.jibunAddress,
            coordinates: {
              latitude: parseFloat(coordinates.y),
              longitude: parseFloat(coordinates.x)
            },
            types: ['establishment'],
            confidence: 0.8
          }
        };
      } else {
        throw new Error('주소를 찾을 수 없습니다.');
      }
    } catch (error) {
      logger.error('네이버 Geocoding 오류:', error);
      throw error;
    }
  }

  /**
   * 카카오 지도 API를 사용한 주소 좌표 변환
   * @param {string} address - 주소
   * @returns {Promise<Object>} 좌표 정보
   */
  async geocodeWithKakao(address) {
    try {
      if (!this.kakaoMapsApiKey) {
        throw new Error('카카오 지도 API 키가 설정되지 않았습니다.');
      }

      const url = 'https://dapi.kakao.com/v2/local/search/address.json';
      const params = {
        query: address
      };
      const headers = {
        'Authorization': `KakaoAK ${this.kakaoMapsApiKey}`
      };

      const response = await axios.get(url, { params, headers });
      
      if (response.data.documents.length === 0) {
        throw new Error('주소를 찾을 수 없습니다.');
      }

      const result = response.data.documents[0];
      
      return {
        success: true,
        data: {
          address: result.address_name,
          coordinates: {
            latitude: parseFloat(result.y),
            longitude: parseFloat(result.x)
          },
          types: ['establishment'],
          confidence: 0.8
        }
      };
    } catch (error) {
      logger.error('카카오 Geocoding 오류:', error);
      throw error;
    }
  }

  /**
   * 좌표를 주소로 변환 (Reverse Geocoding)
   * @param {number} latitude - 위도
   * @param {number} longitude - 경도
   * @param {string} [provider='google'] - 지도 제공자
   * @returns {Promise<Object>} 주소 정보
   */
  async reverseGeocode(latitude, longitude, provider = 'google') {
    try {
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new Error('유효한 좌표가 필요합니다.');
      }

      switch (provider.toLowerCase()) {
        case 'google':
          return await this.reverseGeocodeWithGoogle(latitude, longitude);
        case 'naver':
          return await this.reverseGeocodeWithNaver(latitude, longitude);
        case 'kakao':
          return await this.reverseGeocodeWithKakao(latitude, longitude);
        default:
          throw new Error('지원하지 않는 지도 제공자입니다.');
      }
    } catch (error) {
      logger.error('좌표 주소 변환 오류:', error);
      throw error;
    }
  }

  /**
   * Google Maps API를 사용한 좌표 주소 변환
   * @param {number} latitude - 위도
   * @param {number} longitude - 경도
   * @returns {Promise<Object>} 주소 정보
   */
  async reverseGeocodeWithGoogle(latitude, longitude) {
    try {
      if (!this.googleMapsApiKey) {
        throw new Error('Google Maps API 키가 설정되지 않았습니다.');
      }

      const url = `${this.baseUrl}/geocode/json`;
      const params = {
        latlng: `${latitude},${longitude}`,
        key: this.googleMapsApiKey,
        language: 'ko'
      };

      const response = await axios.get(url, { params });
      
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        
        return {
          success: true,
          data: {
            address: result.formatted_address,
            coordinates: {
              latitude: latitude,
              longitude: longitude
            },
            placeId: result.place_id,
            types: result.types,
            components: result.address_components
          }
        };
      } else {
        throw new Error('좌표에 해당하는 주소를 찾을 수 없습니다.');
      }
    } catch (error) {
      logger.error('Google Reverse Geocoding 오류:', error);
      throw error;
    }
  }

  /**
   * 장소 검색 (Place Search)
   * @param {string} query - 검색어
   * @param {Object} options - 검색 옵션
   * @param {number} options.latitude - 중심 위도
   * @param {number} options.longitude - 중심 경도
   * @param {number} options.radius - 검색 반경 (미터)
   * @param {string} options.type - 장소 타입
   * @returns {Promise<Object>} 검색 결과
   */
  async searchPlaces(query, options = {}) {
    try {
      if (!query || typeof query !== 'string') {
        throw new Error('검색어가 필요합니다.');
      }

      const url = `${this.baseUrl}/place/textsearch/json`;
      const params = {
        query: query,
        key: this.googleMapsApiKey,
        language: 'ko',
        ...options
      };

      const response = await axios.get(url, { params });
      
      if (response.data.status === 'OK') {
        const results = response.data.results.map(place => ({
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          coordinates: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
          },
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          types: place.types,
          photos: place.photos ? place.photos.slice(0, 3) : [],
          openingHours: place.opening_hours,
          priceLevel: place.price_level,
          vicinity: place.vicinity
        }));

        return {
          success: true,
          data: {
            results: results,
            total: results.length,
            nextPageToken: response.data.next_page_token
          }
        };
      } else {
        throw new Error('장소 검색에 실패했습니다.');
      }
    } catch (error) {
      logger.error('장소 검색 오류:', error);
      throw error;
    }
  }

  /**
   * 장소 상세 정보 조회
   * @param {string} placeId - Google Place ID
   * @returns {Promise<Object>} 장소 상세 정보
   */
  async getPlaceDetails(placeId) {
    try {
      if (!placeId || typeof placeId !== 'string') {
        throw new Error('장소 ID가 필요합니다.');
      }

      const url = `${this.baseUrl}/place/details/json`;
      const params = {
        place_id: placeId,
        key: this.googleMapsApiKey,
        language: 'ko',
        fields: 'name,formatted_address,geometry,rating,user_ratings_total,types,photos,opening_hours,price_level,website,formatted_phone_number,reviews'
      };

      const response = await axios.get(url, { params });
      
      if (response.data.status === 'OK') {
        const place = response.data.result;
        
        return {
          success: true,
          data: {
            placeId: place.place_id,
            name: place.name,
            address: place.formatted_address,
            coordinates: {
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng
            },
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            types: place.types,
            photos: place.photos ? place.photos.slice(0, 5) : [],
            openingHours: place.opening_hours,
            priceLevel: place.price_level,
            website: place.website,
            phoneNumber: place.formatted_phone_number,
            reviews: place.reviews || []
          }
        };
      } else {
        throw new Error('장소 상세 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      logger.error('장소 상세 정보 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 경로 안내 (Directions)
   * @param {Object} origin - 출발지
   * @param {Object} destination - 목적지
   * @param {string} [mode='driving'] - 이동 수단 (driving, walking, transit, bicycling)
   * @returns {Promise<Object>} 경로 정보
   */
  async getDirections(origin, destination, mode = 'driving') {
    try {
      if (!origin || !destination) {
        throw new Error('출발지와 목적지가 필요합니다.');
      }

      const url = `${this.baseUrl}/directions/json`;
      const params = {
        origin: typeof origin === 'string' ? origin : `${origin.latitude},${origin.longitude}`,
        destination: typeof destination === 'string' ? destination : `${destination.latitude},${destination.longitude}`,
        mode: mode,
        key: this.googleMapsApiKey
      };

      const response = await axios.get(url, { params });
      
      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];
        
        return {
          success: true,
          data: {
            distance: leg.distance.value,
            duration: leg.duration.value,
            durationText: leg.duration.text,
            distanceText: leg.distance.text,
            startAddress: leg.start_address,
            endAddress: leg.end_address,
            steps: leg.steps.map(step => ({
              instruction: step.html_instructions,
              distance: step.distance.text,
              duration: step.duration.text,
              travelMode: step.travel_mode
            })),
            polyline: route.overview_polyline.points
          }
        };
      } else {
        throw new Error('경로를 찾을 수 없습니다.');
      }
    } catch (error) {
      logger.error('경로 안내 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 주변 교통 정보 조회
   * @param {number} latitude - 위도
   * @param {number} longitude - 경도
   * @param {number} [radius=1000] - 반경 (미터)
   * @returns {Promise<Object>} 교통 정보
   */
  async getNearbyTransportation(latitude, longitude, radius = 1000) {
    try {
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new Error('유효한 좌표가 필요합니다.');
      }

      const location = `${latitude},${longitude}`;
      
      // 지하철역 검색
      const subwayResponse = await this.searchPlaces('지하철역', {
        location: location,
        radius: radius,
        type: 'subway_station'
      });

      // 버스정류장 검색
      const busResponse = await this.searchPlaces('버스정류장', {
        location: location,
        radius: radius,
        type: 'bus_station'
      });

      return {
        success: true,
        data: {
          location: { latitude, longitude },
          radius: radius,
          subway: subwayResponse.data.results.slice(0, 5),
          bus: busResponse.data.results.slice(0, 5),
          total: {
            subway: subwayResponse.data.total,
            bus: busResponse.data.total
          }
        }
      };
    } catch (error) {
      logger.error('주변 교통 정보 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 위치 정보 검증
   * @param {Object} location - 위치 정보
   * @returns {Object} 검증 결과
   */
  async validateLocation(location) {
    try {
      const errors = [];
      
      // 주소 검증
      if (location.address) {
        try {
          const geocodeResult = await this.geocodeAddress(location.address);
          if (geocodeResult.success) {
            location.coordinates = geocodeResult.data.coordinates;
            location.placeId = geocodeResult.data.placeId;
          }
        } catch (error) {
          errors.push('유효하지 않은 주소입니다.');
        }
      }
      
      // 좌표 검증
      if (location.coordinates) {
        const { latitude, longitude } = location.coordinates;
        
        if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
          errors.push('유효하지 않은 위도입니다.');
        }
        
        if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
          errors.push('유효하지 않은 경도입니다.');
        }
      }
      
      // 장소 ID 검증
      if (location.placeId) {
        try {
          await this.getPlaceDetails(location.placeId);
        } catch (error) {
          errors.push('유효하지 않은 장소 ID입니다.');
        }
      }
      
      return {
        success: true,
        data: {
          isValid: errors.length === 0,
          errors: errors,
          location: location
        }
      };
    } catch (error) {
      logger.error('위치 정보 검증 오류:', error);
      throw error;
    }
  }

  /**
   * 위치 정보 정규화
   * @param {Object} location - 위치 정보
   * @returns {Object} 정규화된 위치 정보
   */
  async normalizeLocation(location) {
    try {
      let normalized = { ...location };
      
      // 주소가 있으면 좌표로 변환
      if (location.address && !location.coordinates) {
        const geocodeResult = await this.geocodeAddress(location.address);
        if (geocodeResult.success) {
          normalized.coordinates = geocodeResult.data.coordinates;
          normalized.placeId = geocodeResult.data.placeId;
        }
      }
      
      // 좌표가 있으면 주소로 변환
      if (location.coordinates && !location.address) {
        const reverseResult = await this.reverseGeocode(
          location.coordinates.latitude,
          location.coordinates.longitude
        );
        if (reverseResult.success) {
          normalized.address = reverseResult.data.address;
          normalized.placeId = reverseResult.data.placeId;
        }
      }
      
      return {
        success: true,
        data: normalized
      };
    } catch (error) {
      logger.error('위치 정보 정규화 오류:', error);
      throw error;
    }
  }

  /**
   * Google Geocoding 결과의 신뢰도 계산
   * @param {string} locationType - 위치 타입
   * @returns {number} 신뢰도 (0-1)
   */
  calculateConfidence(locationType) {
    const confidenceMap = {
      'ROOFTOP': 1.0,
      'RANGE_INTERPOLATED': 0.8,
      'GEOMETRIC_CENTER': 0.6,
      'APPROXIMATE': 0.4
    };
    return confidenceMap[locationType] || 0.5;
  }
}

// 서비스 인스턴스 생성 및 내보내기
const locationService = new LocationService();

module.exports = locationService; 