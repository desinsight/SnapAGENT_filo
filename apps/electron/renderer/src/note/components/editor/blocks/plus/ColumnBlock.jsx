/**
 * 열(Column) 블록 컴포넌트
 * 
 * @description 생성되자마자 2개의 독립적인 텍스트 블록으로 분리
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from 'react';

const ColumnBlock = ({ 
  block, 
  onUpdate, 
  onFocus, 
  onAdd,
  onDelete,
  index,
  readOnly = false, 
  placeholder = "",
  isEditing,
  onEditingChange 
}) => {
  // 자동 분리 useEffect 완전히 제거

  // 열블록 자체만 렌더링 (예시 UI)
  return (
    <div className="column-block py-2 border border-blue-200 bg-blue-50 rounded flex items-center justify-center min-h-[40px]">
      <span className="text-blue-700 text-sm font-semibold">열 블록</span>
    </div>
  );
};

export default ColumnBlock; 