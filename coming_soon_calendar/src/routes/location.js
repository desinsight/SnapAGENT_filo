// location.js
// 위치 정보 라우트 - 주소 변환, 장소 검색, 경로 안내, 교통 정보
// 확장성, AI 연동성, 실시간성을 고려한 체계적인 위치 API

const express = require('express');
const router = express.Router();
const locationService = require('../services/locationService');
const auth = require('../middlewares/auth');
const { validateLocation } = require('../middlewares/validation');

// 모든 위치 정보 API에 인증 적용
router.use(auth.authenticate);

/**
 * 주소를 좌표로 변환 (Geocoding)
 * POST /api/location/geocode
 */
router.post('/geocode', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: '주소가 필요합니다.',
        code: 'MISSING_ADDRESS'
      });
    }

    const result = await locationService.geocodeAddress(address);
    res.json(result);
  } catch (error) {
    console.error('주소 좌표 변환 오류:', error);
    res.status(500).json({
      success: false,
      message: '주소 좌표 변환 중 오류가 발생했습니다.',
      code: 'GEOCODING_ERROR'
    });
  }
});

/**
 * 좌표를 주소로 변환 (Reverse Geocoding)
 * POST /api/location/reverse-geocode
 */
router.post('/reverse-geocode', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        success: false,
        message: '유효한 위도와 경도가 필요합니다.',
        code: 'INVALID_COORDINATES'
      });
    }

    const result = await locationService.reverseGeocode(latitude, longitude);
    res.json(result);
  } catch (error) {
    console.error('좌표 주소 변환 오류:', error);
    res.status(500).json({
      success: false,
      message: '좌표 주소 변환 중 오류가 발생했습니다.',
      code: 'REVERSE_GEOCODING_ERROR'
    });
  }
});

/**
 * 장소 검색
 * GET /api/location/search
 */
router.get('/search', async (req, res) => {
  try {
    const { query, latitude, longitude, radius, type } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: '검색어가 필요합니다.',
        code: 'MISSING_QUERY'
      });
    }

    const options = {};
    if (latitude && longitude) {
      options.location = `${latitude},${longitude}`;
    }
    if (radius) {
      options.radius = parseInt(radius);
    }
    if (type) {
      options.type = type;
    }

    const result = await locationService.searchPlaces(query, options);
    res.json(result);
  } catch (error) {
    console.error('장소 검색 오류:', error);
    res.status(500).json({
      success: false,
      message: '장소 검색 중 오류가 발생했습니다.',
      code: 'PLACE_SEARCH_ERROR'
    });
  }
});

/**
 * 장소 상세 정보 조회
 * GET /api/location/place/:placeId
 */
router.get('/place/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    
    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: '장소 ID가 필요합니다.',
        code: 'MISSING_PLACE_ID'
      });
    }

    const result = await locationService.getPlaceDetails(placeId);
    res.json(result);
  } catch (error) {
    console.error('장소 상세 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '장소 상세 정보 조회 중 오류가 발생했습니다.',
      code: 'PLACE_DETAILS_ERROR'
    });
  }
});

/**
 * 경로 안내 조회
 * POST /api/location/directions
 */
router.post('/directions', async (req, res) => {
  try {
    const { origin, destination, mode = 'driving' } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: '출발지와 목적지가 필요합니다.',
        code: 'MISSING_ORIGIN_DESTINATION'
      });
    }

    const result = await locationService.getDirections(origin, destination, mode);
    res.json(result);
  } catch (error) {
    console.error('경로 안내 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '경로 안내 조회 중 오류가 발생했습니다.',
      code: 'DIRECTIONS_ERROR'
    });
  }
});

/**
 * 주변 교통 정보 조회
 * GET /api/location/transportation
 */
router.get('/transportation', async (req, res) => {
  try {
    const { latitude, longitude, radius = 1000 } = req.query;
    
    if (typeof parseFloat(latitude) !== 'number' || typeof parseFloat(longitude) !== 'number') {
      return res.status(400).json({
        success: false,
        message: '유효한 위도와 경도가 필요합니다.',
        code: 'INVALID_COORDINATES'
      });
    }

    const result = await locationService.getNearbyTransportation(
      parseFloat(latitude),
      parseFloat(longitude),
      parseInt(radius)
    );
    res.json(result);
  } catch (error) {
    console.error('주변 교통 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '주변 교통 정보 조회 중 오류가 발생했습니다.',
      code: 'TRANSPORTATION_ERROR'
    });
  }
});

/**
 * 위치 정보 검증
 * POST /api/location/validate
 */
router.post('/validate', validateLocation, async (req, res) => {
  try {
    const location = req.body;
    
    const result = await locationService.validateLocation(location);
    res.json(result);
  } catch (error) {
    console.error('위치 정보 검증 오류:', error);
    res.status(500).json({
      success: false,
      message: '위치 정보 검증 중 오류가 발생했습니다.',
      code: 'LOCATION_VALIDATION_ERROR'
    });
  }
});

/**
 * 위치 정보 정규화
 * POST /api/location/normalize
 */
router.post('/normalize', async (req, res) => {
  try {
    const location = req.body;
    
    const result = await locationService.normalizeLocation(location);
    res.json(result);
  } catch (error) {
    console.error('위치 정보 정규화 오류:', error);
    res.status(500).json({
      success: false,
      message: '위치 정보 정규화 중 오류가 발생했습니다.',
      code: 'LOCATION_NORMALIZATION_ERROR'
    });
  }
});

module.exports = router; 