/**
 * 👤 Contact Controller
 * 
 * 연락처 CRUD 및 비즈니스 로직 처리
 * 
 * @author Your Team
 * @version 1.0.0
 */

import Contact from '../models/Contact.js';
import { cacheManager } from '../config/database.js';
import { 
  asyncHandler, 
  createNotFoundError, 
  createValidationError,
  createPermissionError 
} from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * 📝 연락처 생성
 * POST /api/contacts
 */
export const createContact = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const contactData = { ...req.body, userId, createdBy: userId };
  
  // 중복 검사
  if (contactData.emails && contactData.emails.length > 0) {
    const existingContact = await Contact.findOne({
      userId,
      'emails.value': { $in: contactData.emails.map(e => e.value) }
    });
    
    if (existingContact) {
      return res.status(409).json({
        error: true,
        message: '이미 존재하는 이메일 주소가 있습니다.',
        duplicateContact: existingContact._id
      });
    }
  }
  
  const contact = new Contact(contactData);
  await contact.save();
  
  // 캐시 무효화
  await cacheManager.delPattern(`contacts:${userId}:*`);
  
  logger.info(`연락처 생성: ${contact._id} by user ${userId}`);
  
  res.status(201).json({
    success: true,
    data: contact,
    message: '연락처가 성공적으로 생성되었습니다.'
  });
});

/**
 * 📋 연락처 목록 조회
 * GET /api/contacts
 */
export const getContacts = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { 
    page = 1, 
    limit = 20, 
    search, 
    industry, 
    company, 
    tags, 
    category,
    status = 'active',
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;
  
  // 캐시 키 생성
  const cacheKey = `contacts:${userId}:${JSON.stringify(req.query)}`;
  const cached = await cacheManager.get(cacheKey);
  
  if (cached) {
    return res.json(cached);
  }
  
  // 쿼리 빌드
  const query = { userId, status };
  
  if (search) {
    query.$text = { $search: search };
  }
  
  if (industry) {
    query.industry = { $regex: industry, $options: 'i' };
  }
  
  if (company) {
    query.company = { $regex: company, $options: 'i' };
  }
  
  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim());
    query.tags = { $in: tagArray };
  }
  
  if (category) {
    query.categories = category;
  }
  
  // 정렬 설정
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  // 페이지네이션
  const skip = (page - 1) * limit;
  
  // 데이터 조회
  const [contacts, total] = await Promise.all([
    Contact.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('projects.projectId', 'name status')
      .lean(),
    Contact.countDocuments(query)
  ]);
  
  const totalPages = Math.ceil(total / limit);
  
  const result = {
    success: true,
    data: contacts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
  
  // 캐시 저장 (5분)
  await cacheManager.set(cacheKey, result, 300);
  
  res.json(result);
});

/**
 * 👤 연락처 상세 조회
 * GET /api/contacts/:id
 */
export const getContact = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  
  const contact = await Contact.findOne({ _id: id, userId })
    .populate('projects.projectId', 'name description status startDate endDate')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
  
  if (!contact) {
    throw createNotFoundError('연락처');
  }
  
  // 마지막 연락 시간 업데이트
  contact.updateLastContact();
  
  res.json({
    success: true,
    data: contact
  });
});

/**
 * ✏️ 연락처 수정
 * PUT /api/contacts/:id
 */
export const updateContact = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const updateData = { ...req.body, updatedBy: userId };
  
  const contact = await Contact.findOne({ _id: id, userId });
  
  if (!contact) {
    throw createNotFoundError('연락처');
  }
  
  // 이메일 중복 검사 (자신 제외)
  if (updateData.emails && updateData.emails.length > 0) {
    const emailValues = updateData.emails.map(e => e.value);
    const existingContact = await Contact.findOne({
      _id: { $ne: id },
      userId,
      'emails.value': { $in: emailValues }
    });
    
    if (existingContact) {
      throw createValidationError('이미 존재하는 이메일 주소가 있습니다.');
    }
  }
  
  // 업데이트
  Object.assign(contact, updateData);
  await contact.save();
  
  // 캐시 무효화
  await cacheManager.delPattern(`contacts:${userId}:*`);
  
  logger.info(`연락처 수정: ${id} by user ${userId}`);
  
  res.json({
    success: true,
    data: contact,
    message: '연락처가 성공적으로 수정되었습니다.'
  });
});

/**
 * 🗑️ 연락처 삭제
 * DELETE /api/contacts/:id
 */
export const deleteContact = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  
  const contact = await Contact.findOne({ _id: id, userId });
  
  if (!contact) {
    throw createNotFoundError('연락처');
  }
  
  // 실제 삭제 대신 아카이브 처리
  contact.status = 'archived';
  await contact.save();
  
  // 캐시 무효화
  await cacheManager.delPattern(`contacts:${userId}:*`);
  
  logger.info(`연락처 아카이브: ${id} by user ${userId}`);
  
  res.json({
    success: true,
    message: '연락처가 아카이브되었습니다.'
  });
});

/**
 * 🔍 중복 연락처 확인
 * POST /api/contacts/:id/duplicate-check
 */
export const checkDuplicate = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { emails, phones, name, company } = req.body;
  
  const query = { userId, _id: { $ne: id } };
  const duplicates = [];
  
  // 이메일 중복 검사
  if (emails && emails.length > 0) {
    const emailValues = emails.map(e => e.value);
    const emailDuplicates = await Contact.find({
      ...query,
      'emails.value': { $in: emailValues }
    }).select('name company emails phones');
    
    duplicates.push(...emailDuplicates.map(contact => ({
      type: 'email',
      contact,
      matchingEmails: contact.emails.filter(e => emailValues.includes(e.value))
    })));
  }
  
  // 전화번호 중복 검사
  if (phones && phones.length > 0) {
    const phoneValues = phones.map(p => p.value);
    const phoneDuplicates = await Contact.find({
      ...query,
      'phones.value': { $in: phoneValues }
    }).select('name company emails phones');
    
    duplicates.push(...phoneDuplicates.map(contact => ({
      type: 'phone',
      contact,
      matchingPhones: contact.phones.filter(p => phoneValues.includes(p.value))
    })));
  }
  
  // 이름 + 회사 중복 검사
  if (name && company) {
    const nameCompanyDuplicates = await Contact.find({
      ...query,
      name: { $regex: name, $options: 'i' },
      company: { $regex: company, $options: 'i' }
    }).select('name company emails phones');
    
    duplicates.push(...nameCompanyDuplicates.map(contact => ({
      type: 'name_company',
      contact
    })));
  }
  
  // 중복 제거
  const uniqueDuplicates = duplicates.filter((duplicate, index, arr) => 
    arr.findIndex(d => d.contact._id.toString() === duplicate.contact._id.toString()) === index
  );
  
  res.json({
    success: true,
    data: {
      hasDuplicates: uniqueDuplicates.length > 0,
      duplicates: uniqueDuplicates,
      count: uniqueDuplicates.length
    }
  });
});

/**
 * 🔗 연락처 병합
 * POST /api/contacts/merge
 */
export const mergeContacts = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { primaryId, secondaryIds, mergeOptions } = req.body;
  
  if (!primaryId || !secondaryIds || secondaryIds.length === 0) {
    throw createValidationError('병합할 연락처를 선택해주세요.');
  }
  
  const primaryContact = await Contact.findOne({ _id: primaryId, userId });
  if (!primaryContact) {
    throw createNotFoundError('주 연락처');
  }
  
  const secondaryContacts = await Contact.find({
    _id: { $in: secondaryIds },
    userId
  });
  
  if (secondaryContacts.length !== secondaryIds.length) {
    throw createNotFoundError('일부 보조 연락처');
  }
  
  // 병합 로직
  for (const secondary of secondaryContacts) {
    // 이메일 병합
    if (mergeOptions.emails !== false) {
      for (const email of secondary.emails) {
        const exists = primaryContact.emails.some(e => e.value === email.value);
        if (!exists) {
          primaryContact.emails.push(email);
        }
      }
    }
    
    // 전화번호 병합
    if (mergeOptions.phones !== false) {
      for (const phone of secondary.phones) {
        const exists = primaryContact.phones.some(p => p.value === phone.value);
        if (!exists) {
          primaryContact.phones.push(phone);
        }
      }
    }
    
    // 주소 병합
    if (mergeOptions.addresses !== false) {
      for (const address of secondary.addresses) {
        const exists = primaryContact.addresses.some(a => 
          a.street === address.street && a.city === address.city
        );
        if (!exists) {
          primaryContact.addresses.push(address);
        }
      }
    }
    
    // 태그 병합
    if (mergeOptions.tags !== false) {
      for (const tag of secondary.tags) {
        if (!primaryContact.tags.includes(tag)) {
          primaryContact.tags.push(tag);
        }
      }
    }
    
    // 프로젝트 병합
    if (mergeOptions.projects !== false) {
      for (const project of secondary.projects) {
        const exists = primaryContact.projects.some(p => 
          p.projectId.toString() === project.projectId.toString()
        );
        if (!exists) {
          primaryContact.projects.push(project);
        }
      }
    }
    
    // 메모 병합
    if (mergeOptions.notes !== false && secondary.notes) {
      if (primaryContact.notes) {
        primaryContact.notes += `\n\n--- 병합된 메모 ---\n${secondary.notes}`;
      } else {
        primaryContact.notes = secondary.notes;
      }
    }
    
    // 보조 연락처 삭제
    secondary.status = 'archived';
    await secondary.save();
  }
  
  // 주 연락처 저장
  await primaryContact.save();
  
  // 캐시 무효화
  await cacheManager.delPattern(`contacts:${userId}:*`);
  
  logger.info(`연락처 병합: ${primaryId} with ${secondaryIds.join(', ')} by user ${userId}`);
  
  res.json({
    success: true,
    data: primaryContact,
    message: '연락처가 성공적으로 병합되었습니다.'
  });
});

/**
 * 📊 연락처 통계
 * GET /api/contacts/stats
 */
export const getContactStats = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  
  const cacheKey = `contacts:stats:${userId}`;
  const cached = await cacheManager.get(cacheKey);
  
  if (cached) {
    return res.json(cached);
  }
  
  const [
    totalContacts,
    activeContacts,
    publicContacts,
    industryStats,
    categoryStats,
    recentContacts
  ] = await Promise.all([
    Contact.countDocuments({ userId }),
    Contact.countDocuments({ userId, status: 'active' }),
    Contact.countDocuments({ userId, isPublic: true }),
    Contact.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    Contact.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Contact.find({ userId })
      .sort({ lastContact: -1 })
      .limit(5)
      .select('name company lastContact')
      .lean()
  ]);
  
  const stats = {
    success: true,
    data: {
      total: totalContacts,
      active: activeContacts,
      public: publicContacts,
      industries: industryStats,
      categories: categoryStats,
      recent: recentContacts
    }
  };
  
  // 캐시 저장 (10분)
  await cacheManager.set(cacheKey, stats, 600);
  
  res.json(stats);
});

/**
 * 🔄 연락처 가져오기
 * POST /api/contacts/import
 */
export const importContacts = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { contacts, options = {} } = req.body;
  
  if (!contacts || !Array.isArray(contacts)) {
    throw createValidationError('연락처 데이터가 필요합니다.');
  }
  
  const results = {
    success: 0,
    failed: 0,
    duplicates: 0,
    errors: []
  };
  
  for (const contactData of contacts) {
    try {
      // 중복 검사
      const existingContact = await Contact.findOne({
        userId,
        $or: [
          { 'emails.value': { $in: contactData.emails?.map(e => e.value) || [] } },
          { 'phones.value': { $in: contactData.phones?.map(p => p.value) || [] } }
        ]
      });
      
      if (existingContact && !options.overwrite) {
        results.duplicates++;
        continue;
      }
      
      // 연락처 생성/업데이트
      const contact = new Contact({
        ...contactData,
        userId,
        createdBy: userId,
        source: 'import'
      });
      
      await contact.save();
      results.success++;
      
    } catch (error) {
      results.failed++;
      results.errors.push({
        contact: contactData.name || 'Unknown',
        error: error.message
      });
    }
  }
  
  // 캐시 무효화
  await cacheManager.delPattern(`contacts:${userId}:*`);
  
  logger.info(`연락처 가져오기: ${results.success} 성공, ${results.failed} 실패 by user ${userId}`);
  
  res.json({
    success: true,
    data: results,
    message: `연락처 가져오기가 완료되었습니다. (성공: ${results.success}, 실패: ${results.failed}, 중복: ${results.duplicates})`
  });
});

/**
 * 📤 연락처 내보내기
 * GET /api/contacts/export
 */
export const exportContacts = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { format = 'json', filters = {} } = req.query;
  
  const query = { userId, status: 'active', ...filters };
  const contacts = await Contact.find(query)
    .populate('projects.projectId', 'name')
    .lean();
  
  let data;
  let filename;
  let contentType;
  
  switch (format.toLowerCase()) {
    case 'csv':
      data = convertToCSV(contacts);
      filename = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
      contentType = 'text/csv';
      break;
      
    case 'vcf':
      data = convertToVCF(contacts);
      filename = `contacts_${new Date().toISOString().split('T')[0]}.vcf`;
      contentType = 'text/vcard';
      break;
      
    default:
      data = JSON.stringify(contacts, null, 2);
      filename = `contacts_${new Date().toISOString().split('T')[0]}.json`;
      contentType = 'application/json';
  }
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(data);
});

// CSV 변환 헬퍼
const convertToCSV = (contacts) => {
  const headers = ['Name', 'Company', 'Position', 'Email', 'Phone', 'Tags'];
  const rows = contacts.map(contact => [
    contact.name,
    contact.company || '',
    contact.position || '',
    contact.primaryEmail || '',
    contact.primaryPhone || '',
    contact.tags?.join(', ') || ''
  ]);
  
  return [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
};

// VCF 변환 헬퍼
const convertToVCF = (contacts) => {
  return contacts.map(contact => {
    let vcf = 'BEGIN:VCARD\nVERSION:3.0\n';
    vcf += `FN:${contact.name}\n`;
    if (contact.company) vcf += `ORG:${contact.company}\n`;
    if (contact.position) vcf += `TITLE:${contact.position}\n`;
    if (contact.primaryEmail) vcf += `EMAIL:${contact.primaryEmail}\n`;
    if (contact.primaryPhone) vcf += `TEL:${contact.primaryPhone}\n`;
    vcf += 'END:VCARD\n';
    return vcf;
  }).join('\n');
}; 