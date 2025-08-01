import React from 'react';
import COLORS from '../constants/colors';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  return (
    <div style={{ background: COLORS.BACKGROUND.PRIMARY, borderRadius: 16, boxShadow: COLORS.SHADOW.MD, padding: 32, minHeight: 400 }}>
      <h2 style={{ color: COLORS.BRAND.ACCENT, marginBottom: 16 }}>설정</h2>
      <div style={{ color: COLORS.TEXT.PRIMARY, fontSize: 18, marginBottom: 24 }}>
        Filo Copilot의 다양한 환경설정 및 계정 관리 기능을 제공합니다.
      </div>

      {/* AI 설정 섹션 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <SparklesIcon className="w-5 h-5 mr-2 text-purple-500" />
          AI 설정
        </h3>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              API 키 설정 방법
            </h4>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <p>• 루트 디렉토리의 <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">.env</code> 파일에서 API 키를 관리합니다</p>
              <p>• <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">OPENAI_API_KEY=your_openai_key</code></p>
              <p>• <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">ANTHROPIC_API_KEY=your_anthropic_key</code></p>
              <p>• 설정 후 서버 재시작이 필요합니다</p>
            </div>
          </div>
          
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>보안을 위해 API 키는 웹 인터페이스에서 직접 수정할 수 없습니다.</p>
            <p>.env 파일을 직접 편집해주세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 