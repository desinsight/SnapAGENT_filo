import React, { useState, useEffect, useRef } from 'react';
import { COLORS, THEME } from '../constants/colors';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { FiSearch, FiFileText, FiShield, FiRefreshCw, FiClock, FiLock, FiBarChart2, FiDatabase, FiCheckCircle } from 'react-icons/fi';

function useCountUp(target, duration = 4000, format = v => v, pause = 2000) {
  const [value, setValue] = useState(0);
  const raf = useRef();
  const timeout = useRef();
  useEffect(() => {
    let start = null;
    let stopped = false;
    function animate(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
      else {
        setValue(target);
        timeout.current = setTimeout(() => {
          setValue(0);
          start = null;
          if (!stopped) raf.current = requestAnimationFrame(animate);
        }, pause);
      }
    }
    raf.current = requestAnimationFrame(animate);
    return () => {
      stopped = true;
      raf.current && cancelAnimationFrame(raf.current);
      timeout.current && clearTimeout(timeout.current);
    };
  }, [target, duration, pause]);
  return format(value);
}

const solutionSlides = [
  // 도입 효과 (15개)
  { category: '도입 효과', title: '평균 파일 검색 시간 80% 단축', description: 'AI 기반 검색 도입 후, 전사 파일 검색 시간이 대폭 단축되어 업무 효율이 향상되었습니다.' },
  { category: '도입 효과', title: '데이터 유실 0건', description: '자동 백업 및 버전 관리로 중요한 데이터 유실 사고가 0건으로 감소했습니다.' },
  { category: '도입 효과', title: 'IT 관리 비용 30% 절감', description: '클라우드 통합 및 자동화로 IT 인프라 관리 비용이 절감되었습니다.' },
  { category: '도입 효과', title: '컴플라이언스 감사 대응 2배 빨라짐', description: '버전 관리와 감사 로그로 컴플라이언스 대응 시간이 크게 단축되었습니다.' },
  { category: '도입 효과', title: '업무 협업 효율 50% 향상', description: '실시간 동기화와 팀 협업 기능으로 부서 간 협업이 빨라졌습니다.' },
  { category: '도입 효과', title: '문서 분실률 0%', description: '중앙 집중 파일 관리로 문서 분실 사고가 사라졌습니다.' },
  { category: '도입 효과', title: '평균 파일 복구 시간 90% 단축', description: '버전 관리와 자동 백업으로 파일 복구가 신속하게 이루어집니다.' },
  { category: '도입 효과', title: '보안 사고 0건', description: '강력한 암호화와 접근 제어로 보안 사고가 발생하지 않았습니다.' },
  { category: '도입 효과', title: '연간 교육 시간 40% 감소', description: '직관적인 UI와 자동화로 직원 교육 시간이 줄었습니다.' },
  { category: '도입 효과', title: '모바일 업무 활용률 3배 증가', description: '모바일 연동으로 언제 어디서나 파일 관리가 가능해졌습니다.' },
  { category: '도입 효과', title: '고객 응대 속도 2배 향상', description: '자료 검색 및 공유가 빨라져 고객 응대가 신속해졌습니다.' },
  { category: '도입 효과', title: '서버 장애 복구율 99.99%', description: '자동화된 백업과 복구 시스템으로 장애 대응력이 강화되었습니다.' },
  { category: '도입 효과', title: '연간 종이 사용량 70% 절감', description: '디지털 파일 관리로 종이 문서 사용이 크게 줄었습니다.' },
  { category: '도입 효과', title: '외부 감사 대응 100% 성공', description: '감사 로그와 이력 관리로 외부 감사에 완벽 대응했습니다.' },
  { category: '도입 효과', title: '업무 자동화 60% 달성', description: '반복적인 파일 관리 업무가 자동화되어 생산성이 향상되었습니다.' },

  // 주요 활용 사례 (15개)
  { category: '주요 활용 사례', title: '법무팀 - 계약서 버전 관리', description: '계약서 변경 이력 자동 추적 및 복원으로 컴플라이언스 리스크를 최소화합니다.' },
  { category: '주요 활용 사례', title: '영업팀 - 실시간 자료 공유', description: '팀원 간 최신 자료를 실시간으로 공유하여 영업 기회 대응 속도가 빨라집니다.' },
  { category: '주요 활용 사례', title: '연구개발팀 - 대용량 데이터 분석', description: '고급 분석 기능으로 대용량 연구 데이터를 효율적으로 관리하고 인사이트를 도출합니다.' },
  { category: '주요 활용 사례', title: '인사팀 - 개인정보 보호', description: '민감 정보 암호화와 접근 제어로 개인정보 유출을 방지합니다.' },
  { category: '주요 활용 사례', title: '재무팀 - 결재 문서 관리', description: '결재 문서의 변경 이력과 접근 권한을 체계적으로 관리합니다.' },
  { category: '주요 활용 사례', title: '생산관리팀 - 설계도면 버전 관리', description: '설계도면의 변경 이력을 자동으로 관리하여 오류를 방지합니다.' },
  { category: '주요 활용 사례', title: '마케팅팀 - 캠페인 자료 공유', description: '캠페인별 자료를 팀원과 안전하게 공유하고 관리합니다.' },
  { category: '주요 활용 사례', title: '고객지원팀 - 고객 데이터 보호', description: '고객 데이터 암호화와 접근 제어로 개인정보를 안전하게 관리합니다.' },
  { category: '주요 활용 사례', title: 'IT팀 - 서버 로그 감사', description: '서버 및 시스템 로그를 자동으로 수집하고 감사에 활용합니다.' },
  { category: '주요 활용 사례', title: '구매팀 - 계약서 및 발주서 관리', description: '계약서와 발주서의 변경 이력과 접근 권한을 체계적으로 관리합니다.' },
  { category: '주요 활용 사례', title: '품질관리팀 - 인증 문서 관리', description: '품질 인증 관련 문서의 변경 이력과 접근 권한을 관리합니다.' },
  { category: '주요 활용 사례', title: '경영진 - 대시보드 보고', description: '실시간 대시보드로 파일 현황과 업무 진행 상황을 한눈에 파악합니다.' },
  { category: '주요 활용 사례', title: '교육팀 - 교육 자료 버전 관리', description: '교육 자료의 변경 이력과 배포 현황을 체계적으로 관리합니다.' },
  { category: '주요 활용 사례', title: '물류팀 - 출고/입고 문서 관리', description: '출고 및 입고 관련 문서의 변경 이력과 접근 권한을 관리합니다.' },
  { category: '주요 활용 사례', title: '프로젝트팀 - 협업 파일 관리', description: '프로젝트별 파일을 팀원과 안전하게 공유하고 실시간 협업을 지원합니다.' }
];

function SolutionAutoCarousel() {
  const [index, setIndex] = useState(0);
  const slideCount = solutionSlides.length;
  const visibleCount = 6;
  const autoRef = useRef();

  useEffect(() => {
    autoRef.current = setInterval(() => {
      setIndex(prev => (prev + visibleCount) % slideCount);
    }, 3500);
    return () => clearInterval(autoRef.current);
  }, [slideCount]);

  // 슬라이드 순환
  const getSlides = () => {
    const slides = [];
    for (let i = 0; i < visibleCount; i++) {
      slides.push(solutionSlides[(index + i) % slideCount]);
    }
    return slides;
  };

  return (
    <div className="solution-carousel">
      <div className="solutions-grid solutions-grid-6">
        {getSlides().map((slide, idx) => (
          <div key={idx} className="solution-card">
            <div className="solution-category">{slide.category}</div>
            <h3 className="solution-title">{slide.title}</h3>
            <p className="solution-description">{slide.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const heroSlides = [
  {
    headline: 'Work, Reimagined',
    sub: 'Filo는 단순한 파일 관리가 아니라, 일하는 방식을 혁신하는 새로운 표준입니다.',
    image: '/images/hero-vision-1.png',
  },
  {
    headline: 'One Platform, Infinite Possibilities',
    sub: '모든 파일, 모든 사람, 모든 워크플로우를 하나의 안전하고 지능적인 플랫폼에서 연결합니다.',
    image: '/images/hero-vision-2.png',
  },
  {
    headline: 'AI, Security, and Collaboration for the Enterprise',
    sub: 'AI-powered automation, enterprise-grade security, and flexible collaboration.\n변화하는 비즈니스에 최적화된 차세대 파일 관리 플랫폼.',
    image: '/images/hero-vision-3.png',
  },
];

function HeroCarousel() {
  const [idx, setIdx] = useState(0);
  const timeoutRef = useRef();
  const slideCount = heroSlides.length;

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIdx((prev) => (prev + 1) % slideCount);
    }, 5000);
    return () => clearTimeout(timeoutRef.current);
  }, [idx, slideCount]);

  const goTo = (i) => setIdx(i);

  // 슬라이드별 레이아웃 스타일 지정
  const slideStyles = [
    // 1번: 밝은 블루 배경
    {
      background:'linear-gradient(90deg,#e0e7ff 0%,#f8fafc 100%)',
      text: {textAlign:'left',alignItems:'flex-start',color:'#1e293b'},
      image: {justifyContent:'flex-end'},
      img: {maxWidth:380,maxHeight:320,objectFit:'contain',borderRadius:32,boxShadow:'0 8px 32px rgba(0,0,0,0.10)'}
    },
    // 2번: 연보라 배경
    {
      background:'linear-gradient(90deg,#f3e8ff 0%,#f8fafc 100%)',
      text: {textAlign:'right',alignItems:'flex-end',color:'#3b0764'},
      image: {justifyContent:'flex-start'},
      img: {maxWidth:400,maxHeight:320,objectFit:'cover',borderRadius:40,boxShadow:'0 8px 32px rgba(0,0,0,0.10)'}
    },
    // 3번: 연회색 배경
    {
      background:'linear-gradient(180deg,#f1f5f9 0%,#e0e7ef 100%)',
      text: {textAlign:'center',alignItems:'center',color:'#0f172a'},
      image: {justifyContent:'center'},
      img: {maxWidth:320,maxHeight:220,objectFit:'contain',borderRadius:24,boxShadow:'0 8px 32px rgba(0,0,0,0.10)',marginTop:32}
    }
  ];

  const slideImages = [
    '/images/hero-abstract-blue.png',
    '/images/hero-abstract-purple.png',
    '/images/hero-abstract-gray.png'
  ];

  return (
    <section className="hero" style={{width:'100vw',minHeight:680,padding:'0',overflow:'hidden',background:slideStyles[idx].background,transition:'background 0.5s'}}> 
      <div className="hero-carousel-container" style={{position:'relative',maxWidth:1400,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'center',minHeight:680,overflow:'hidden'}}>
        {/* 캐러셀 트랙 */}
        <div style={{display:'flex',width:'100%',height:'100%',minHeight:680,transition:'transform 0.5s cubic-bezier(.7,.2,.2,1)',transform:`translateX(-${idx*100}%)`}}>
          {/* 1번 슬라이드 */}
          <div style={{flex:'0 0 100%',display:'flex',alignItems:'center',justifyContent:'center',gap:0}}>
            <div style={{flex:1,minWidth:320,display:'flex',flexDirection:'column',...slideStyles[0].text,justifyContent:'center',alignItems:'center'}}>
              <h1 style={{fontSize:54,fontWeight:800,marginBottom:24,lineHeight:1.15,letterSpacing:'-2px'}}>{heroSlides[0].headline}</h1>
              <p style={{fontSize:22,marginBottom:40,maxWidth:520,textAlign:'center'}}>{heroSlides[0].sub}</p>
              <div style={{display:'flex',gap:16,justifyContent:'center'}}>
                <button className="btn-primary btn-large">무료 체험 시작</button>
                <button className="btn-ghost btn-large">데모 보기</button>
              </div>
            </div>
          </div>
          {/* 2번 슬라이드 */}
          <div style={{flex:'0 0 100%',display:'flex',alignItems:'center',justifyContent:'center',gap:0}}>
            <div style={{flex:1,minWidth:320,display:'flex',flexDirection:'column',...slideStyles[1].text,justifyContent:'center',alignItems:'center'}}>
              <h1 style={{fontSize:50,fontWeight:800,marginBottom:24,lineHeight:1.1,letterSpacing:'-1.5px'}}>{heroSlides[1].headline}</h1>
              <p style={{fontSize:21,marginBottom:40,maxWidth:520,textAlign:'center'}}>{heroSlides[1].sub}</p>
              <div style={{display:'flex',gap:16,justifyContent:'center'}}>
                <button className="btn-primary btn-large">무료 체험 시작</button>
                <button className="btn-ghost btn-large">데모 보기</button>
              </div>
            </div>
          </div>
          {/* 3번 슬라이드 */}
          <div style={{flex:'0 0 100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:0}}>
            <div style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center',...slideStyles[2].text,justifyContent:'center'}}>
              <h1 style={{fontSize:46,fontWeight:800,marginBottom:20,lineHeight:1.1,letterSpacing:'-1px'}}>{heroSlides[2].headline}</h1>
              <p style={{fontSize:20,marginBottom:32,maxWidth:520,textAlign:'center'}}>{heroSlides[2].sub}</p>
              <div style={{display:'flex',gap:16,justifyContent:'center'}}>
                <button className="btn-primary btn-large">무료 체험 시작</button>
                <button className="btn-ghost btn-large">데모 보기</button>
              </div>
            </div>
          </div>
        </div>
        {/* 인디케이터 */}
        <div style={{position:'absolute',bottom:32,left:'50%',transform:'translateX(-50%)',display:'flex',gap:12}}>
          {heroSlides.map((_, i) => (
            <button key={i} onClick={()=>goTo(i)} style={{width:14,height:14,borderRadius:'50%',border:'none',background:idx===i?'#2563eb':'#dbeafe',cursor:'pointer',transition:'background 0.2s'}} aria-label={`슬라이드 ${i+1}`}></button>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: <FiSearch size={32} color={COLORS.BRAND.ACCENT} />,
    title: 'AI-Powered Search',
    desc: 'Claude AI 기반 고급 검색으로 파일을 즉시 찾습니다',
  },
  {
    icon: <FiFileText size={32} color={COLORS.BRAND.ACCENT} />,
    title: 'AI File Analysis & Report',
    desc: 'AI가 폴더 및 파일을 자동 분석하여 리포트와 인사이트를 제공합니다',
  },
  {
    icon: <FiShield size={32} color={COLORS.STATUS.SUCCESS} />,
    title: 'Enterprise Security',
    desc: '군사급 암호화와 세밀한 접근 제어로 데이터를 보호합니다',
  },
  {
    icon: <FiRefreshCw size={32} color={COLORS.BRAND.ACCENT} />,
    title: 'Real-time Sync',
    desc: '여러 디바이스 간 실시간 동기화로 작업을 이어갑니다',
  },
  {
    icon: <FiClock size={32} color={COLORS.BRAND.ACCENT} />,
    title: 'Version Control',
    desc: '파일의 모든 변경 이력을 추적하고 복원할 수 있습니다',
  },
  {
    icon: <FiLock size={32} color={COLORS.STATUS.INFO} />,
    title: 'Access Control',
    desc: '관리자가 직원별/부서별 접근권한을 세밀하게 지정할 수 있습니다',
  },
  {
    icon: <FiBarChart2 size={32} color={COLORS.STATUS.WARNING} />,
    title: 'Advanced Analytics',
    desc: '파일 사용 패턴과 저장공간 최적화 인사이트 제공',
  },
  {
    icon: <FiDatabase size={32} color={COLORS.STATUS.SUCCESS} />,
    title: 'Automated Backup',
    desc: '자동 백업으로 데이터 손실을 방지합니다',
  },
  {
    icon: <FiCheckCircle size={32} color={COLORS.STATUS.ERROR} />,
    title: 'Compliance & Audit',
    desc: 'GDPR, SOX 등 규정 준수를 위한 감사 로그 제공',
  },
];

const Home = () => {
  const [scrolled, setScrolled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature);
    setModalOpen(true);
  };
  const handleModalClose = () => setModalOpen(false);

  return (
    <div className="home">
      {/* 헤더 */}
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          <div className="logo">
            <span className="logo-text">Filo</span>
          </div>
          <nav className="nav">
            <a href="#features" className="nav-link">Features</a>
            <a href="#solutions" className="nav-link">Solutions</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#about" className="nav-link">About</a>
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button className="btn-secondary" onClick={() => setProfileMenuOpen((v) => !v)}>
                    {user.name || user.email}
                  </button>
                  {profileMenuOpen && (
                    <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: 120, zIndex: 10 }}>
                      <button style={{ width: '100%', padding: 10, border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => { setProfileMenuOpen(false); navigate('/profile'); }}>내 정보</button>
                      <button style={{ width: '100%', padding: 10, border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', color: '#F04438' }} onClick={() => { logout(); navigate('/login'); }}>로그아웃</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button className="btn-secondary" onClick={() => navigate('/login')}>로그인</button>
                <button className="btn-primary" onClick={() => navigate('/download')}>시작하기</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <HeroCarousel />

      {/* 통계 섹션 */}
      <section className="stats">
        <div className="stats-container">
          {stats.map((stat, index) => {
            const animated = useCountUp(stat.number, 4000, v => {
              if (stat.decimals !== undefined) {
                return v.toFixed(stat.decimals);
              }
              return v;
            }, 2000);
            return (
              <div key={index} className="stat-item">
                <div className="stat-number">
                  {animated}{stat.suffix}
                </div>
                <div className="stat-label">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 기능 섹션 */}
      <section id="features" className="features">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Powerful Features</h2>
            <p className="section-description">
              엔터프라이즈 규모의 파일 관리를 위한 모든 기능
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, padding: '32px 0' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: COLORS.BACKGROUND.PRIMARY,
                border: `1px solid ${COLORS.BORDER.PRIMARY}`,
                borderRadius: 16,
                boxShadow: COLORS.SHADOW.SM,
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'box-shadow 0.2s, border 0.2s',
                cursor: 'pointer',
                minHeight: 220,
              }}>
                <div style={{ marginBottom: 16 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 20, color: COLORS.BRAND.PRIMARY, marginBottom: 8 }}>{f.title}</div>
                <div style={{ color: COLORS.TEXT.SECONDARY, fontSize: 15, textAlign: 'center' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 도입 효과/사용 사례 섹션 */}
      <section id="solutions" className="solutions">
        <div className="solutions-container">
          <div className="section-header">
            <h2 className="section-title">Filo 도입 효과 & 주요 활용 사례</h2>
            <p className="section-description">
              실제 기업들이 경험한 변화와 다양한 업무 활용 시나리오를 확인하세요
            </p>
          </div>
          <SolutionAutoCarousel />
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="cta">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">파일 관리를 혁신할 준비가 되셨나요?</h2>
            <p className="cta-description">
              수천 개의 기업이 파일 관리 요구사항에 Filo를 신뢰하고 있습니다
            </p>
            <div className="cta-actions">
              <button className="btn-primary btn-large">무료 체험 시작</button>
              <button className="btn-ghost btn-large">영업팀 문의</button>
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">Filo</div>
              <p className="footer-description">
                AI 기반 엔터프라이즈 파일 관리 플랫폼
              </p>
            </div>
            
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#solutions">Solutions</a>
                <a href="#pricing">Pricing</a>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#careers">Careers</a>
                <a href="#contact">Contact</a>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <a href="#help">Help Center</a>
                <a href="#docs">Documentation</a>
                <a href="#api">API</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-copyright">
              © 2024 Filo. All rights reserved.
            </div>
            <div className="footer-legal">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      <FeatureModal open={modalOpen} onClose={handleModalClose} feature={selectedFeature} />
    </div>
  );
};

function FeatureModal({ open, onClose, feature }) {
  if (!open || !feature) return null;
  return (
    <div className="modal-backdrop" style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.35)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="modal-content" style={{background:'#fff',borderRadius:20,padding:40,minWidth:350,maxWidth:600,boxShadow:'0 8px 32px rgba(0,0,0,0.18)',textAlign:'center',position:'relative'}}>
        <img src={feature.image} alt={feature.title} style={{width:80,height:80,objectFit:'contain',marginBottom:24}} />
        <h2 style={{fontWeight:700,marginBottom:12}}>{feature.title}</h2>
        <p style={{color:'#222',fontSize:17,marginBottom:24}}>{feature.desc}</p>
        <button onClick={onClose} style={{position:'absolute',top:18,right:18,background:'none',border:'none',fontSize:22,cursor:'pointer'}}>×</button>
      </div>
    </div>
  );
}

export default Home; 