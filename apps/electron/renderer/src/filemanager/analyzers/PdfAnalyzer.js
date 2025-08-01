import { nanoid } from 'nanoid';

/**
 * PDF 분석 결과를 블록으로 변환하는 분석기
 */
export class PdfAnalyzer {
  /**
   * PDF 분석 결과를 블록으로 변환
   * @param {Object} analysisResult - 분석 결과 객체
   * @returns {Array} 블록 배열
   */
  static convertToBlocks(analysisResult) {
    const blocks = [];
    
    try {
      // ===== 문서 분석 결과 =====
      
      // 1. 메인 헤더 (문서 제목)
      blocks.push({
        id: nanoid(),
        type: 'heading1',
        content: `📄 ${analysisResult.file.name}`,
        focused: false
      });
      
      // 2. 분석 요약 (인용구 형태)
      const documentSummary = analysisResult.result.data?.analysis?.summary;
      if (documentSummary) {
        blocks.push({
          id: nanoid(),
          type: 'quote',
          content: `📋 문서 요약\n\n${documentSummary}`,
          focused: false
        });
      }
      
      // 3. 구분선
      blocks.push({
        id: nanoid(),
        type: 'divider',
        content: '',
        focused: false
      });
      
      // 2. 이미지 추출 및 표시 (개선된 버전)
      const images = analysisResult.result.data?.completeAnalysis?.results?.images || [];
      const pageImages = analysisResult.result.data?.completeAnalysis?.results?.pageImages || [];
      
      // 브라우저 콘솔과 Node.js 콘솔 모두에서 로그 출력
      if (typeof console !== 'undefined') {
        console.log('🚨🚨🚨 [PdfAnalyzer] 이미지 데이터 확인 🚨🚨🚨:', {
          images: images.length,
          pageImages: pageImages.length,
          imagesData: images,
          pageImagesData: pageImages
        });
      }
      
      // 테스트용: 강제로 이미지 블록 생성
      const hasImages = images.length > 0 || pageImages.length > 0;
      
              if (typeof console !== 'undefined') {
          console.log('🚨🚨🚨 [PdfAnalyzer] 이미지 블록 생성 조건 🚨🚨🚨:', { hasImages, imagesLength: images.length, pageImagesLength: pageImages.length });
        }
      
      if (hasImages) {
        // 이미지 섹션 제목
        blocks.push({
          id: nanoid(),
          type: 'heading2',
          content: `🖼️ 추출된 이미지 (${images.length + pageImages.length}개)`,
          focused: false
        });
        
        // 이미지들을 개별 블록으로 표시
        const imageBlocks = [];
        
        // 페이지 이미지들 (PDF 페이지를 이미지로 변환한 것)
        pageImages.forEach((pageImage, index) => {
          const imageUrl = pageImage.dataUrl || pageImage.path;
          if (typeof console !== 'undefined') {
            console.log(`🚨🚨🚨 [PdfAnalyzer] 페이지 이미지 ${index + 1} 🚨🚨🚨:`, {
              imageUrl,
              pageImage
            });
          }
          
          if (imageUrl) {
            const imageBlock = {
              id: nanoid(),
              type: 'image',
              content: imageUrl, // ImageBlock은 content를 이미지 URL로 사용
              focused: false,
              metadata: {
                caption: `📄 페이지 ${pageImage.page || index + 1}${pageImage.isDummy ? ' (미리보기)' : ''}`,
                type: 'page_image',
                page: pageImage.page || index + 1,
                method: pageImage.method || 'unknown',
                size: pageImage.size || 0,
                isDummy: pageImage.isDummy || false
              }
            };
            
            if (typeof console !== 'undefined') {
              console.log(`🚨🚨🚨 [PdfAnalyzer] 이미지 블록 생성 🚨🚨🚨:`, imageBlock);
            }
            imageBlocks.push(imageBlock);
          }
        });
        
        // 추출된 이미지들 (PDF 내부에 포함된 이미지)
        images.forEach((image, index) => {
          const imageUrl = image.dataUrl || image.path;
          if (imageUrl) {
            imageBlocks.push({
              id: nanoid(),
              type: 'image',
              content: imageUrl, // ImageBlock은 content를 이미지 URL로 사용
              focused: false,
              metadata: {
                caption: `🖼️ 내장 이미지 ${index + 1} (페이지 ${image.page})`,
                type: 'embedded_image',
                page: image.page,
                name: image.name,
                format: image.format || 'unknown',
                size: image.size || 0,
                mimeType: image.mimeType || 'image/png'
              }
            });
          }
        });
        
        // 이미지들을 개별 블록으로 직접 추가 (최대 4개까지만)
        if (imageBlocks.length > 0) {
          if (typeof console !== 'undefined') {
            console.log(`🚨🚨🚨 [PdfAnalyzer] 총 ${imageBlocks.length}개의 이미지 블록 생성됨 🚨🚨🚨`);
          }
          
          // 개별 이미지 블록들을 직접 blocks 배열에 추가
          imageBlocks.slice(0, 4).forEach((imageBlock, index) => {
            if (typeof console !== 'undefined') {
              console.log(`🚨🚨🚨 [PdfAnalyzer] 이미지 블록 ${index + 1} 추가 🚨🚨🚨:`, imageBlock);
            }
            blocks.push(imageBlock);
          });
          
          // 추가 이미지가 있으면 알림
          if (imageBlocks.length > 4) {
            blocks.push({
              id: nanoid(),
              type: 'alert',
              content: `📝 참고: 총 ${imageBlocks.length}개의 이미지 중 4개만 표시되었습니다.`,
              focused: false,
              alertType: 'info'
            });
          }
        }
      } else {
        // 이미지가 없는 경우 이미지 섹션을 생성하지 않음
        if (typeof console !== 'undefined') {
          console.log('🚨🚨🚨 [PdfAnalyzer] 이미지가 없어서 이미지 섹션을 생성하지 않음 🚨🚨🚨');
        }
      }
      
      // ===== 📊 문서 통계 =====
      
      // 4. 섹션 헤더
      blocks.push({
        id: nanoid(),
        type: 'heading2',
        content: '📊 문서 통계',
        focused: false
      });
      
      // 5. 기본 정보 (고급 카드 레이아웃)
      const basicInfo = analysisResult.result.data?.summary || {};
      const metadata = analysisResult.result.data?.metadata || {};
      
      // 기본 정보를 카드 형태로 표시
      const basicInfoCards = [];
      if (basicInfo.pages) {
        basicInfoCards.push({
          id: nanoid(),
          title: '페이지 수',
          value: `${basicInfo.pages}페이지`,
          icon: '📖',
          color: basicInfo.pages > 10 ? 'blue' : basicInfo.pages > 5 ? 'green' : 'gray'
        });
      }
      if (basicInfo.characters) {
        basicInfoCards.push({
          id: nanoid(),
          title: '문자 수',
          value: `${basicInfo.characters.toLocaleString()}자`,
          icon: '📝',
          color: basicInfo.characters > 10000 ? 'purple' : basicInfo.characters > 5000 ? 'blue' : 'green'
        });
      }
      if (basicInfo.words) {
        basicInfoCards.push({
          id: nanoid(),
          title: '단어 수',
          value: `${basicInfo.words.toLocaleString()}단어`,
          icon: '🔤',
          color: basicInfo.words > 2000 ? 'purple' : basicInfo.words > 1000 ? 'blue' : 'green'
        });
      }
      if (basicInfo.paragraphs) {
        basicInfoCards.push({
          id: nanoid(),
          title: '단락 수',
          value: `${basicInfo.paragraphs}단락`,
          icon: '📄',
          color: basicInfo.paragraphs > 50 ? 'purple' : basicInfo.paragraphs > 20 ? 'blue' : 'green'
        });
      }
      
      // 보드 레이아웃으로 기본 정보 표시
      if (basicInfoCards.length > 0) {
        blocks.push({
          id: nanoid(),
          type: 'board',
          content: JSON.stringify({
            title: '📊 문서 기본 정보',
            columns: [
              { id: 'basic-info', title: '문서 통계', cards: basicInfoCards }
            ]
          }),
          focused: false
        });
      }
      
      // ===== 🖼️ 미디어 정보 =====
      
      // 6. 미디어 정보 (고급 카드 레이아웃)
      const mediaInfoCards = [];
      if (metadata.hasImages || basicInfo.imageCount > 0) {
        mediaInfoCards.push({
          id: nanoid(),
          title: '이미지',
          value: `${basicInfo.imageCount || '있음'}`,
          icon: '🖼️',
          color: 'blue',
          description: '문서 내 포함된 이미지'
        });
      }
      if (basicInfo.ocrCount && basicInfo.ocrCount > 0) {
        mediaInfoCards.push({
          id: nanoid(),
          title: 'OCR 텍스트',
          value: `${basicInfo.ocrCount}개`,
          icon: '🔍',
          color: 'green',
          description: '이미지에서 추출된 텍스트'
        });
      }
      
      if (mediaInfoCards.length > 0) {
        blocks.push({
          id: nanoid(),
          type: 'board',
          content: JSON.stringify({
            title: '📊 미디어 정보',
            columns: [
              { id: 'media-info', title: '미디어 요소', cards: mediaInfoCards }
            ]
          }),
          focused: false
        });
      }
      
      // 4. 구분선
      blocks.push({
        id: nanoid(),
        type: 'divider',
        content: '',
        focused: false
      });
      
      // 5. 요약 정보 (인용구 블록)
      const summary = analysisResult.result.data?.analysis?.summary;
      if (summary) {
        blocks.push({
          id: nanoid(),
          type: 'quote',
          content: `📋 문서 요약:\n${summary}`,
          focused: false
        });
      }
      
      // 6. 키워드 (태그 블록들)
      const keywords = analysisResult.result.data?.analysis?.keywords;
      if (keywords && keywords.length > 0) {
        // 키워드를 개별 태그 블록으로 생성
        keywords.slice(0, 8).forEach(keyword => {
          blocks.push({
            id: nanoid(),
            type: 'tag',
            content: keyword,
            focused: false
          });
        });
      }
      
      // 7. 품질 분석 (고급 진행바 + 별점)
      const quality = analysisResult.result.data?.analysis?.quality;
      if (quality) {
        // 품질 점수 계산
        const getQualityScore = (qualityLevel) => {
          const scores = { 'excellent': 5, 'good': 4, 'fair': 3, 'poor': 2, 'very_poor': 1 };
          return scores[qualityLevel] || 3;
        };
        
        const textScore = getQualityScore(quality.textQuality);
        const imageScore = getQualityScore(quality.imageQuality);
        const ocrScore = getQualityScore(quality.ocrQuality);
        
        // 품질 카드들
        const qualityCards = [];
        
        if (quality.textQuality) {
          qualityCards.push({
            id: nanoid(),
            title: '텍스트 품질',
            value: quality.textQuality,
            icon: '📝',
            color: textScore >= 4 ? 'green' : textScore >= 3 ? 'yellow' : 'red',
            description: `점수: ${textScore}/5`
          });
        }
        
        if (quality.imageQuality) {
          qualityCards.push({
            id: nanoid(),
            title: '이미지 품질',
            value: quality.imageQuality,
            icon: '🖼️',
            color: imageScore >= 4 ? 'green' : imageScore >= 3 ? 'yellow' : 'red',
            description: `점수: ${imageScore}/5`
          });
        }
        
        if (quality.ocrQuality) {
          qualityCards.push({
            id: nanoid(),
            title: 'OCR 품질',
            value: quality.ocrQuality,
            icon: '🔍',
            color: ocrScore >= 4 ? 'green' : ocrScore >= 3 ? 'yellow' : 'red',
            description: `점수: ${ocrScore}/5`
          });
        }
        
        // 보드 레이아웃으로 품질 정보 표시
        if (qualityCards.length > 0) {
          blocks.push({
            id: nanoid(),
            type: 'board',
            content: JSON.stringify({
              title: '📊 문서 품질 분석',
              columns: [
                { id: 'quality', title: '품질 지표', cards: qualityCards }
              ]
            }),
            focused: false
          });
        }
        
        // 전체 품질 별점
        const overallScore = Math.round((textScore + imageScore + ocrScore) / 3);
        blocks.push({
          id: nanoid(),
          type: 'rating',
          content: JSON.stringify({
            value: overallScore,
            max: 5,
            label: '전체 문서 품질',
            size: 'large',
            readonly: true
          }),
          focused: false
        });
        
        // 품질별 진행바
        if (quality.textQuality) {
          blocks.push({
            id: nanoid(),
            type: 'progressBar',
            content: JSON.stringify({
              value: textScore * 20, // 5점을 100%로 변환
              max: 100,
              label: '텍스트 품질',
              color: textScore >= 4 ? 'green' : textScore >= 3 ? 'blue' : 'orange'
            }),
            focused: false
          });
        }
      }
      
      // 8. 섹션 분석 (고급 탭 레이아웃 + 타임라인)
      const sections = analysisResult.result.data?.completeAnalysis?.results?.analysis?.sections || [];
      if (sections.length > 0) {
        blocks.push({
          id: nanoid(),
          type: 'heading2',
          content: `📋 문서 구조 분석 (${sections.length}개 섹션)`,
          focused: false
        });
        
        // 섹션들을 카드로 변환
        const sectionCards = sections.slice(0, 6).map((section, index) => ({
          id: nanoid(),
          title: section.title || `섹션 ${index + 1}`,
          value: section.content ? section.content.substring(0, 100) + '...' : '내용 없음',
          icon: '📖',
          color: index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'green' : 'purple',
          description: `${index + 1}번째 섹션`
        }));
        
        // 보드 레이아웃으로 섹션 표시
        blocks.push({
          id: nanoid(),
          type: 'board',
          content: JSON.stringify({
            title: '📋 문서 섹션',
            columns: [
              { id: 'sections', title: '문서 구조', cards: sectionCards }
            ]
          }),
          focused: false
        });
        
        // 타임라인 블록으로 섹션 순서 표시
        const timelineEvents = sections.slice(0, 8).map((section, index) => ({
          title: section.title || `섹션 ${index + 1}`,
          content: section.content ? section.content.substring(0, 150) + '...' : '내용 없음',
          type: 'milestone',
          icon: '📖',
          date: `${index + 1}단계`
        }));
        
        blocks.push({
          id: nanoid(),
          type: 'timeline',
          content: JSON.stringify({
            events: timelineEvents,
            viewMode: 'expanded',
            showCompleted: true
          }),
          focused: false
        });
      }
      
      // 9. 테이블 추출 (고급 카드 + 테이블)
      const tables = analysisResult.result.data?.completeAnalysis?.results?.analysis?.tables || [];
      if (tables.length > 0) {
        blocks.push({
          id: nanoid(),
          type: 'heading2',
          content: `📊 추출된 테이블 (${tables.length}개)`,
          focused: false
        });
        
        // 테이블 정보를 카드로 표시
        const tableCards = tables.slice(0, 5).map((table, index) => ({
          id: nanoid(),
          title: `테이블 ${index + 1}`,
          value: table.caption || '제목 없음',
          icon: '📊',
          color: index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'green' : 'purple',
          description: `${table.data ? table.data.length : 0}행의 데이터`
        }));
        
        // 보드 레이아웃으로 테이블 정보 표시
        blocks.push({
          id: nanoid(),
          type: 'board',
          content: JSON.stringify({
            title: '📊 테이블 정보',
            columns: [
              { id: 'tables', title: '추출된 테이블', cards: tableCards }
            ]
          }),
          focused: false
        });
        
        // 실제 테이블 데이터 표시 (최대 3개)
        tables.slice(0, 3).forEach((table, index) => {
          if (table.data && table.data.length > 0) {
            blocks.push({
              id: nanoid(),
              type: 'table',
              content: `📊 테이블 ${index + 1}${table.caption ? `: ${table.caption}` : ''}`,
              tableData: table.data,
              focused: false
            });
          }
        });
      }
      
      // 10. 통계 정보 (차트 + 보드 + 진행바 블록)
      if (basicInfo.pages || basicInfo.words || basicInfo.characters) {
        const stats = {
          pages: basicInfo.pages || 0,
          words: basicInfo.words || 0,
          characters: basicInfo.characters || 0,
          paragraphs: basicInfo.paragraphs || 0
        };
        
        // 차트 블록
        blocks.push({
          id: nanoid(),
          type: 'chart',
          content: JSON.stringify({
            type: 'bar',
            data: {
              labels: ['페이지', '단어', '문자', '단락'],
              datasets: [{
                label: '문서 통계',
                data: [stats.pages, stats.words, stats.characters, stats.paragraphs],
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
              }]
            }
          }),
          focused: false
        });
        
        // 보드 블록 (문서 품질 지표)
        const qualityIndicators = [
          { title: '텍스트 품질', value: stats.words > 1000 ? '우수' : stats.words > 100 ? '양호' : '보통', color: stats.words > 1000 ? 'green' : stats.words > 100 ? 'blue' : 'yellow' },
          { title: '문서 길이', value: stats.pages > 10 ? '긴 문서' : stats.pages > 3 ? '중간 문서' : '짧은 문서', color: stats.pages > 10 ? 'purple' : stats.pages > 3 ? 'blue' : 'gray' },
          { title: '내용 밀도', value: stats.paragraphs > 20 ? '높음' : stats.paragraphs > 10 ? '보통' : '낮음', color: stats.paragraphs > 20 ? 'green' : stats.paragraphs > 10 ? 'blue' : 'orange' }
        ];
        
        blocks.push({
          id: nanoid(),
          type: 'board',
          content: JSON.stringify({
            title: '문서 품질 지표',
            columns: [
              { id: 'quality', title: '품질 지표', cards: qualityIndicators }
            ]
          }),
          focused: false
        });
        
        // 진행바 블록 (문서 완성도)
        const completionRate = Math.min(100, (stats.words / 1000) * 100);
        blocks.push({
          id: nanoid(),
          type: 'progressBar',
          content: JSON.stringify({
            value: completionRate,
            max: 100,
            label: '문서 완성도',
            color: completionRate > 80 ? 'green' : completionRate > 50 ? 'blue' : 'orange'
          }),
          focused: false
        });
        
        // 별점 블록 (문서 품질 평가)
        const qualityScore = Math.min(5, Math.max(1, Math.floor(completionRate / 20)));
        blocks.push({
          id: nanoid(),
          type: 'rating',
          content: JSON.stringify({
            value: qualityScore,
            max: 5,
            label: '문서 품질',
            size: 'large',
            readonly: false
          }),
          focused: false
        });
        
        // 웹 임베드 블록 (문서 관련 링크)
        if (stats.words > 500) {
          blocks.push({
            id: nanoid(),
            type: 'webEmbed',
            content: JSON.stringify({
              url: 'https://example.com/document-help',
              title: '문서 분석 도움말',
              description: '긴 문서 분석에 대한 도움말을 확인하세요.',
              thumbnail: 'https://via.placeholder.com/300x200?text=Document+Help'
            }),
            focused: false
          });
        }
      }
      
      // 11. OCR 결과 (고급 토글 + 카드)
      const ocrResults = analysisResult.result.data?.completeAnalysis?.results?.ocrResults || [];
      if (ocrResults.length > 0) {
        blocks.push({
          id: nanoid(),
          type: 'heading2',
          content: `🔍 OCR 분석 결과 (${ocrResults.length}개)`,
          focused: false
        });
        
        // OCR 결과를 카드로 표시
        const ocrCards = ocrResults.slice(0, 5).map((ocr, index) => ({
          id: nanoid(),
          title: `${ocr.type || 'OCR'} ${index + 1}`,
          value: ocr.text.substring(0, 50) + (ocr.text.length > 50 ? '...' : ''),
          icon: '🔍',
          color: 'green',
          description: `${ocr.text.length}자 추출됨`
        }));
        
        // 보드 레이아웃으로 OCR 정보 표시
        blocks.push({
          id: nanoid(),
          type: 'board',
          content: JSON.stringify({
            title: '🔍 OCR 추출 정보',
            columns: [
              { id: 'ocr', title: 'OCR 결과', cards: ocrCards }
            ]
          }),
          focused: false
        });
        
        // 상세 OCR 텍스트 (토글 블록)
        ocrResults.slice(0, 3).forEach((ocr, index) => {
          blocks.push({
            id: nanoid(),
            type: 'toggle',
            content: `🔍 ${ocr.type || 'OCR'} ${index + 1} (${ocr.text.length}자)\n\n${ocr.text}`,
            focused: false
          });
        });
      }
      
      // 12. 스마트 텍스트 분석 및 블록 변환 (완전히 새로 구현)
      const content = analysisResult.result.data?.content;
      if (content && content.length > 0) {
        console.log('스마트 텍스트 분석 시작:', content.length, '글자');
        
        // 1. 기본 분할 및 정제
        const cleanContent = content.replace(/\s+/g, ' ').trim();
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 20);
        
        // 2. 문서 구조 분석
        const documentStructure = this.analyzeDocumentStructure(cleanContent);
        
        // 3. 문서 구조에 따른 블록 생성
        if (documentStructure.hasStructure) {
          blocks.push({
            id: nanoid(),
            type: 'heading2',
            content: `📋 문서 구조 분석`,
            focused: false
          });
          
          // 제목들을 heading 블록으로 변환
          documentStructure.headings.forEach((heading, index) => {
            const level = Math.min(3, Math.max(1, heading.level));
            blocks.push({
              id: nanoid(),
              type: `heading${level}`,
              content: heading.text,
              focused: false
            });
            
            // 제목 아래 내용이 있으면 추가
            if (heading.content && heading.content.length > 30) {
              this.createContentBlocks(heading.content, blocks);
            }
          });
        }
        
        // 4. 특수 컨텐츠 추출 및 블록 변환
        const specialContent = this.extractSpecialContent(cleanContent);
        
        // 연락처 정보
        if (specialContent.contacts.length > 0) {
          blocks.push({
            id: nanoid(),
            type: 'heading3',
            content: `👤 연락처 정보 (${specialContent.contacts.length}개)`,
            focused: false
          });
          
          specialContent.contacts.forEach(contact => {
            // 설명 부분 구성
            const descriptionParts = [];
            if (contact.email) descriptionParts.push(`📧 ${contact.email}`);
            if (contact.phone) descriptionParts.push(`📞 ${contact.phone}`);
            if (contact.address) descriptionParts.push(`📍 ${contact.address}`);
            
            blocks.push({
              id: nanoid(),
              type: 'profile',
              content: { 
                type: 'doc', 
                content: [{ 
                  type: 'paragraph', 
                  content: [{ 
                    type: 'text', 
                    text: descriptionParts.join('\n') || '연락처 정보'
                  }] 
                }] 
              },
              metadata: {
                name: { 
                  type: 'doc', 
                  content: [{ 
                    type: 'paragraph', 
                    content: [{ 
                      type: 'text', 
                      text: contact.name || '연락처'
                    }] 
                  }] 
                },
                title: { 
                  type: 'doc', 
                  content: [{ 
                    type: 'paragraph', 
                    content: [{ 
                      type: 'text', 
                      text: contact.email ? '이메일 연락처' : contact.phone ? '전화 연락처' : '연락처'
                    }] 
                  }] 
                },
                image: null
              },
              focused: false
            });
          });
        }
        
        // 날짜 및 일정 정보
        if (specialContent.dates.length > 0) {
          blocks.push({
            id: nanoid(),
            type: 'heading3',
            content: `📅 날짜 및 일정 (${specialContent.dates.length}개)`,
            focused: false
          });
          
          // 달력 블록으로 표시
          const calendarEvents = specialContent.dates.map(date => ({
            id: nanoid(),
            title: date.context || '일정',
            date: date.date,
            type: 'event'
          }));
          
          blocks.push({
            id: nanoid(),
            type: 'calendar',
            content: JSON.stringify({
              events: calendarEvents,
              viewMode: 'month'
            }),
            focused: false
          });
        }
        
        // 숫자 데이터 (금액, 통계 등)
        if (specialContent.numbers.length > 0) {
          blocks.push({
            id: nanoid(),
            type: 'heading3',
            content: `📊 숫자 데이터 (${specialContent.numbers.length}개)`,
            focused: false
          });
          
          // 보드 블록으로 숫자 데이터 표시
          const numberCards = specialContent.numbers.map(num => ({
            id: nanoid(),
            title: num.label || '수치',
            value: num.value,
            color: num.type === 'money' ? 'green' : num.type === 'percentage' ? 'blue' : 'gray'
          }));
          
          blocks.push({
            id: nanoid(),
            type: 'board',
            content: JSON.stringify({
              title: '중요 수치',
              columns: [
                { id: 'numbers', title: '수치 정보', cards: numberCards }
              ]
            }),
            focused: false
          });
        }
        
        // URL 링크들
        if (specialContent.urls.length > 0) {
          blocks.push({
            id: nanoid(),
            type: 'heading3',
            content: `🔗 링크 정보 (${specialContent.urls.length}개)`,
            focused: false
          });
          
          specialContent.urls.slice(0, 5).forEach(url => {
            blocks.push({
              id: nanoid(),
              type: 'webEmbed',
              content: JSON.stringify({
                url: url.url,
                title: url.title || url.url,
                description: url.context || '문서에서 발견된 링크'
              }),
              focused: false
            });
          });
        }
        
        // 5. 스마트 문단 분할 및 블록 생성
        if (paragraphs.length > 0) {
          blocks.push({
            id: nanoid(),
            type: 'heading2',
            content: `📝 문서 내용 (${paragraphs.length}개 문단)`,
            focused: false
          });
          
          const processedParagraphs = this.processSmartParagraphs(paragraphs);
          
          processedParagraphs.forEach((para, index) => {
            switch (para.type) {
              case 'important':
                blocks.push({
                  id: nanoid(),
                  type: 'alert',
                  content: JSON.stringify({
                    type: 'info',
                    title: '중요 내용',
                    message: para.content,
                    icon: '⭐'
                  }),
                  focused: false
                });
                break;
                
              case 'question':
                blocks.push({
                  id: nanoid(),
                  type: 'alert',
                  content: JSON.stringify({
                    type: 'warning',
                    title: '질문/의문',
                    message: para.content,
                    icon: '❓'
                  }),
                  focused: false
                });
                break;
                
              case 'instruction':
                blocks.push({
                  id: nanoid(),
                  type: 'reminder',
                  content: JSON.stringify({
                    title: '지시사항/안내',
                    description: para.content,
                    priority: 'medium',
                    category: 'instruction'
                  }),
                  focused: false
                });
                break;
                
              case 'quote':
                blocks.push({
                  id: nanoid(),
                  type: 'quote',
                  content: para.content,
                  focused: false
                });
                break;
                
              case 'list':
                const listItems = para.content.split(/\n/).filter(item => item.trim());
                blocks.push({
                  id: nanoid(),
                  type: 'bulletList',
                  content: JSON.stringify({
                    items: listItems.map(item => ({ text: item.replace(/^[-*•]\s*/, '') }))
                  }),
                  focused: false
                });
                break;
                
              default:
                // 문단의 내용과 성격을 분석하여 적절한 블록 타입 선택
                const blockType = this.analyzeParagraphType(para.content);
                
                switch (blockType) {
                  case 'heading':
                    blocks.push({
                      id: nanoid(),
                      type: 'heading3',
                      content: para.content,
                      focused: false
                    });
                    break;
                    
                  case 'list':
                    const listItems = para.content.split(/\n/).filter(item => item.trim());
                    blocks.push({
                      id: nanoid(),
                      type: 'list',
                      content: JSON.stringify({
                        items: listItems.map(item => ({ text: item.replace(/^[-*•]\s*/, '') }))
                      }),
                      focused: false
                    });
                    break;
                    
                  case 'quote':
                    blocks.push({
                      id: nanoid(),
                      type: 'quote',
                      content: para.content,
                      focused: false
                    });
                    break;
                    
                  case 'long_text':
                    // 긴 텍스트는 여러 개의 텍스트 블록으로 분할
                    const textChunks = this.splitTextIntoChunks(para.content, 200);
                    textChunks.forEach((chunk, chunkIndex) => {
                      blocks.push({
                        id: nanoid(),
                        type: 'text',
                        content: chunk,
                        focused: false
                      });
                    });
                    break;
                    
                  default:
                    // 일반 텍스트 블록
                    blocks.push({
                      id: nanoid(),
                      type: 'text',
                      content: para.content,
                      focused: false
                    });
                }
            }
          });
        }
        
        // 6. 요약 및 핵심 문장 추출
        const keySentences = this.extractKeySentences(cleanContent);
        if (keySentences.length > 0) {
          blocks.push({
            id: nanoid(),
            type: 'heading3',
            content: `💡 핵심 문장 (${keySentences.length}개)`,
            focused: false
          });
          
          keySentences.forEach(sentence => {
            blocks.push({
              id: nanoid(),
              type: 'quote',
              content: `"${sentence}"`,
              focused: false
            });
          });
        }
        

      }
      
      // 13. 문서 평가 및 피드백 (고급 대시보드)
      const documentQuality = analysisResult.result.data?.analysis?.quality;
      if (documentQuality) {
        // 품질 평가 카드들
        const evaluationCards = [];
        
        // 텍스트 품질 평가
        const textQualityLevel = documentQuality.textQuality;
        evaluationCards.push({
          id: nanoid(),
          title: '텍스트 품질',
          value: textQualityLevel,
          icon: '📝',
          color: textQualityLevel === 'excellent' ? 'green' : textQualityLevel === 'good' ? 'blue' : textQualityLevel === 'fair' ? 'yellow' : 'red',
          description: textQualityLevel === 'excellent' ? '매우 우수' : textQualityLevel === 'good' ? '양호' : textQualityLevel === 'fair' ? '보통' : '개선 필요'
        });
        
        // 이미지 품질 평가
        if (documentQuality.imageQuality) {
          const imageQualityLevel = documentQuality.imageQuality;
          evaluationCards.push({
            id: nanoid(),
            title: '이미지 품질',
            value: imageQualityLevel,
            icon: '🖼️',
            color: imageQualityLevel === 'excellent' ? 'green' : imageQualityLevel === 'good' ? 'blue' : imageQualityLevel === 'fair' ? 'yellow' : 'red',
            description: imageQualityLevel === 'excellent' ? '매우 우수' : imageQualityLevel === 'good' ? '양호' : imageQualityLevel === 'fair' ? '보통' : '개선 필요'
          });
        }
        
        // OCR 품질 평가
        if (documentQuality.ocrQuality) {
          const ocrQualityLevel = documentQuality.ocrQuality;
          evaluationCards.push({
            id: nanoid(),
            title: 'OCR 품질',
            value: ocrQualityLevel,
            icon: '🔍',
            color: ocrQualityLevel === 'excellent' ? 'green' : ocrQualityLevel === 'good' ? 'blue' : ocrQualityLevel === 'fair' ? 'yellow' : 'red',
            description: ocrQualityLevel === 'excellent' ? '매우 우수' : ocrQualityLevel === 'good' ? '양호' : ocrQualityLevel === 'fair' ? '보통' : '개선 필요'
          });
        }
        
        // 평가 대시보드
        blocks.push({
          id: nanoid(),
          type: 'board',
          content: JSON.stringify({
            title: '📊 문서 품질 평가',
            columns: [
              { id: 'evaluation', title: '품질 지표', cards: evaluationCards }
            ]
          }),
          focused: false
        });
        
        // 알림 블록 (품질 경고)
        if (documentQuality.textQuality === 'poor' || documentQuality.textQuality === 'very_poor') {
          blocks.push({
            id: nanoid(),
            type: 'alert',
            content: JSON.stringify({
              type: 'warning',
              title: '텍스트 품질 주의',
              message: '텍스트 품질이 낮습니다. OCR 결과를 확인해보세요.',
              icon: '⚠️'
            }),
            focused: false
          });
        }
        
        // 리마인더 블록 (후속 작업)
        blocks.push({
          id: nanoid(),
          type: 'reminder',
          content: JSON.stringify({
            title: '문서 분석 후속 작업',
            description: '추출된 정보를 검토하고 필요한 경우 추가 분석을 진행하세요.',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
            priority: 'medium',
            category: 'document-analysis'
          }),
          focused: false
        });
        
        // 댓글 블록 (분석 노트)
        blocks.push({
          id: nanoid(),
          type: 'comment',
          content: JSON.stringify({
            author: '시스템',
            content: `문서 분석이 완료되었습니다.\n- 텍스트 품질: ${documentQuality.textQuality}\n- 이미지 품질: ${documentQuality.imageQuality}\n- OCR 품질: ${documentQuality.ocrQuality}`,
            timestamp: new Date().toISOString(),
            replies: []
          }),
          focused: false
        });
        
        // 투표 블록 (문서 평가)
        blocks.push({
          id: nanoid(),
          type: 'poll',
          content: JSON.stringify({
            question: '이 문서의 품질을 평가해주세요',
            options: [
              { id: 'excellent', text: '매우 우수', votes: 0 },
              { id: 'good', text: '양호', votes: 0 },
              { id: 'fair', text: '보통', votes: 0 },
              { id: 'poor', text: '개선 필요', votes: 0 }
            ],
            allowMultiple: false
          }),
          focused: false
        });
      }
      
      // 14. 분석 시간 정보 (버튼 블록)
      if (analysisResult.timestamp) {
        blocks.push({
          id: nanoid(),
          type: 'button',
          content: `⏰ 분석 시간: ${analysisResult.timestamp.toLocaleString()}`,
          focused: false
        });
      }
      
    } catch (error) {
      console.error('PDF 분석 결과를 블록으로 변환 중 오류:', error);
      // 오류 발생 시 기본 블록 추가
      blocks.push({
        id: nanoid(),
        type: 'text',
        content: `❌ 블록 변환 중 오류가 발생했습니다: ${error.message}`,
        focused: false
      });
    }
    
    return blocks;
  }
  
  /**
   * 파일 확장자가 PDF인지 확인
   * @param {string} filename - 파일명
   * @returns {boolean} PDF 여부
   */
  static isPdfFile(filename) {
    return filename.toLowerCase().endsWith('.pdf');
  }
  
  /**
   * 문서 구조 분석 (제목, 섹션 등)
   */
  static analyzeDocumentStructure(content) {
    const headings = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.length === 0) return;
      
      // 제목 패턴 감지
      let level = 0;
      let isHeading = false;
      let headingText = trimmed;
      
      // 1. 숫자 제목 (1. 2. 3. 등)
      const numberPattern = /^(\d+\.)\s*(.+)$/;
      const numberMatch = trimmed.match(numberPattern);
      if (numberMatch) {
        level = 2;
        isHeading = true;
        headingText = numberMatch[2];
      }
      
      // 2. 대문자로만 이루어진 짧은 줄 (제목일 가능성)
      if (!isHeading && trimmed.length < 50 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
        level = 1;
        isHeading = true;
      }
      
      // 3. 특수 문자로 구분된 제목
      if (!isHeading && /^[=\-#*]{3,}/.test(trimmed)) {
        level = 1;
        isHeading = true;
        headingText = lines[index - 1]?.trim() || lines[index + 1]?.trim() || trimmed;
      }
      
      // 4. 짧고 다음 줄이 빈 줄이거나 들여쓰기된 경우
      if (!isHeading && trimmed.length < 60 && trimmed.length > 10) {
        const nextLine = lines[index + 1];
        if (!nextLine || nextLine.trim() === '' || nextLine.startsWith('  ')) {
          level = 3;
          isHeading = true;
        }
      }
      
      if (isHeading) {
        // 제목 아래 내용 수집
        let content = '';
        for (let i = index + 1; i < lines.length && i < index + 10; i++) {
          const nextLine = lines[i].trim();
          if (nextLine && !this.looksLikeHeading(nextLine)) {
            content += nextLine + ' ';
          } else if (nextLine) {
            break;
          }
        }
        
        headings.push({
          level,
          text: headingText,
          content: content.trim(),
          lineIndex: index
        });
      }
    });
    
    return {
      hasStructure: headings.length > 0,
      headings: headings.slice(0, 10) // 최대 10개만
    };
  }
  
  /**
   * 제목처럼 보이는지 판단
   */
  static looksLikeHeading(text) {
    if (text.length > 60) return false;
    if (/^(\d+\.|\*|\-|#)/.test(text)) return true;
    if (text === text.toUpperCase() && /[A-Z]/.test(text)) return true;
    return false;
  }
  
  /**
   * 특수 컨텐츠 추출 (연락처, 날짜, 숫자, URL 등)
   */
  static extractSpecialContent(content) {
    const contacts = [];
    const dates = [];
    const numbers = [];
    const urls = [];
    
    // 연락처 정보 추출
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi;
    const phonePattern = /(\+?[0-9]{1,4}[-.\s]?)?\(?[0-9]{2,4}\)?[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{4}/g;
    const namePattern = /([가-힣]{2,4}\s*[가-힣]{1,4})/g;
    const addressPattern = /(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주).*?[시군구].*?[동읍면로길]/g;
    
    // matchAll을 안전하게 사용
    const emails = content.match(emailPattern) || [];
    const phones = content.match(phonePattern) || [];
    const names = content.match(namePattern) || [];
    const addresses = content.match(addressPattern) || [];
    
    // 연락처 정보 조합
    const emailSet = new Set(emails);
    const phoneSet = new Set(phones);
    const nameSet = new Set(names);
    const addressSet = new Set(addresses);
    
    // 이메일 기준으로 연락처 생성
    emailSet.forEach(email => {
      contacts.push({
        email,
        name: this.findNearbyName(content, email, Array.from(nameSet)),
        phone: this.findNearbyPhone(content, email, Array.from(phoneSet)),
        address: this.findNearbyAddress(content, email, Array.from(addressSet))
      });
    });
    
    // 날짜 정보 추출
    const datePatterns = [
      /(\d{4})[년\-\/.](\d{1,2})[월\-\/.](\d{1,2})[일]?/g,
      /(\d{1,2})[월\-\/.](\d{1,2})[일]?/g,
      /(\d{4})\-(\d{2})\-(\d{2})/g
    ];
    
    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const context = this.getContext(content, match.index, 50);
        dates.push({
          date: match[0],
          context: context,
          fullMatch: match[0]
        });
      }
    });
    
    // 숫자 데이터 추출 (금액, 퍼센트, 수량 등)
    const numberPatterns = [
      { pattern: /([0-9,]+)\s*원/g, type: 'money', label: '금액' },
      { pattern: /([0-9,]+)\s*달러/g, type: 'money', label: '달러' },
      { pattern: /([0-9.]+)\s*%/g, type: 'percentage', label: '퍼센트' },
      { pattern: /([0-9,]+)\s*개/g, type: 'count', label: '개수' },
      { pattern: /([0-9,]+)\s*명/g, type: 'count', label: '인원' }
    ];
    
    numberPatterns.forEach(({ pattern, type, label }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const context = this.getContext(content, match.index, 30);
        numbers.push({
          value: match[1],
          type,
          label: context || label,
          fullMatch: match[0]
        });
      }
    });
    
    // URL 추출
    const urlPattern = /(https?:\/\/[^\s]+)/gi;
    let urlMatch;
    while ((urlMatch = urlPattern.exec(content)) !== null) {
      const context = this.getContext(content, urlMatch.index, 40);
      urls.push({
        url: urlMatch[0],
        context: context,
        title: this.extractUrlTitle(urlMatch[0])
      });
    }
    
    return {
      contacts: contacts.slice(0, 5),
      dates: dates.slice(0, 10),
      numbers: numbers.slice(0, 8),
      urls: urls.slice(0, 5)
    };
  }
  
  /**
   * 스마트 문단 처리 (문단 타입 분류)
   */
  static processSmartParagraphs(paragraphs) {
    return paragraphs.map(para => {
      const content = para.trim();
      
      // 리스트 형태 (가장 명확한 패턴부터)
      if (/^[-*•]\s|^\d+\.\s|첫째|둘째|셋째|넷째|다섯째/i.test(content)) {
        return { type: 'list', content };
      }
      
      // 인용구 (따옴표로 시작하거나 명확한 인용 표시)
      if (/^["']|^인용:|^발표:|^성명:/i.test(content)) {
        return { type: 'quote', content };
      }
      
      // 지시사항/안내 (명확한 지시 패턴)
      if (/^[•-]\s*(하세요|해주세요|하시기|바랍니다)|^안내:|^지침:|^절차:/i.test(content)) {
        return { type: 'instruction', content };
      }
      
      // 중요 표시 (명확한 중요 표시만)
      if (/^[•-]\s*(중요|주의|경고|필수)|^WARNING:|^IMPORTANT:|^NOTE:/i.test(content)) {
        return { type: 'important', content };
      }
      
      // 질문 형태 (명확한 질문만)
      if (/^[•-]\s*\?|^질문:|^문의:/i.test(content)) {
        return { type: 'question', content };
      }
      
      return { type: 'normal', content };
    });
  }
  
  /**
   * 핵심 문장 추출
   */
  static extractKeySentences(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keywordPatterns = [
      /결론|요약|핵심|중요|주요|목적|목표|결과|성과/i,
      /따라서|그러므로|결국|최종적으로|마지막으로/i,
      /발견|확인|증명|입증|보여|나타|드러/i
    ];
    
    const keySentences = [];
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      
      // 키워드가 포함된 문장
      const hasKeyword = keywordPatterns.some(pattern => pattern.test(trimmed));
      
      // 적당한 길이의 문장 (너무 짧거나 길지 않은)
      const goodLength = trimmed.length > 30 && trimmed.length < 200;
      
      // 숫자나 데이터가 포함된 문장
      const hasData = /\d+/.test(trimmed);
      
      if ((hasKeyword || hasData) && goodLength) {
        keySentences.push(trimmed);
      }
    });
    
    return keySentences.slice(0, 5);
  }
  
  /**
   * 내용 블록 생성 헬퍼
   */
  static createContentBlocks(content, blocks) {
    if (content.length < 50) return;
    
    // 긴 내용은 여러 개의 텍스트 블록으로 분할
    if (content.length > 300) {
      const textChunks = this.splitTextIntoChunks(content, 200);
      textChunks.forEach((chunk, chunkIndex) => {
        blocks.push({
          id: nanoid(),
          type: 'text',
          content: chunk,
          focused: false
        });
      });
    } else {
      blocks.push({
        id: nanoid(),
        type: 'text',
        content: content,
        focused: false
      });
    }
  }
  
  /**
   * 컨텍스트 추출 헬퍼
   */
  static getContext(content, index, length) {
    const start = Math.max(0, index - length);
    const end = Math.min(content.length, index + length);
    return content.substring(start, end).trim();
  }
  
  /**
   * 근처 이름 찾기
   */
  static findNearbyName(content, email, names) {
    const emailIndex = content.indexOf(email);
    const nearby = content.substring(Math.max(0, emailIndex - 100), emailIndex + 100);
    
    for (const name of names) {
      if (nearby.includes(name)) {
        return name;
      }
    }
    return null;
  }
  
  /**
   * 근처 전화번호 찾기
   */
  static findNearbyPhone(content, email, phones) {
    const emailIndex = content.indexOf(email);
    const nearby = content.substring(Math.max(0, emailIndex - 100), emailIndex + 100);
    
    for (const phone of phones) {
      if (nearby.includes(phone)) {
        return phone;
      }
    }
    return null;
  }
  
  /**
   * 근처 주소 찾기
   */
  static findNearbyAddress(content, email, addresses) {
    const emailIndex = content.indexOf(email);
    const nearby = content.substring(Math.max(0, emailIndex - 200), emailIndex + 200);
    
    for (const address of addresses) {
      if (nearby.includes(address)) {
        return address;
      }
    }
    return null;
  }
  
  /**
   * URL 제목 추출 시도
   */
  static extractUrlTitle(url) {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  }
  
  /**
   * 문단의 내용과 성격을 분석하여 적절한 블록 타입 결정
   */
  static analyzeParagraphType(content) {
    const lines = content.split('\n').filter(line => line.trim());
    
    // 1. 제목/헤딩 감지
    if (this.looksLikeHeading(content)) {
      return 'heading';
    }
    
    // 2. 리스트 감지
    if (lines.length > 1 && lines.every(line => /^[-*•]\s/.test(line.trim()))) {
      return 'list';
    }
    
    // 3. 인용문 감지
    if (content.includes('"') || content.includes('"') || content.startsWith('"') || content.endsWith('"')) {
      return 'quote';
    }
    
    // 4. 긴 텍스트 감지 (300자 이상)
    if (content.length > 300) {
      return 'long_text';
    }
    
    // 5. 일반 텍스트
    return 'text';
  }
  
  /**
   * 긴 텍스트를 적절한 크기로 분할
   */
  static splitTextIntoChunks(text, maxLength = 200) {
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 10);
    const chunks = [];
    let currentChunk = '';
    
    sentences.forEach(sentence => {
      const trimmedSentence = sentence.trim();
      
      if (currentChunk.length + trimmedSentence.length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
      }
      
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
    });
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
} 