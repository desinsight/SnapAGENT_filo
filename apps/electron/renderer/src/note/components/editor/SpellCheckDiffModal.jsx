import React from 'react';
import { diffWords } from 'diff';

const highlightDiff = (diffArr, addedColor, removedColor) =>
  diffArr.map((part, i) => {
    if (part.added) return <span key={i} style={{ background: addedColor }}>{part.value}</span>;
    if (part.removed) return <span key={i} style={{ background: removedColor, textDecoration: 'line-through' }}>{part.value}</span>;
    return <span key={i}>{part.value}</span>;
  });

const SpellCheckDiffModal = ({ originalText, correctedText, onClose, onApply }) => {
  const diff = diffWords(originalText, correctedText);
  return (
    <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:8,padding:24,minWidth:600,maxWidth:900,boxShadow:'0 2px 16px #0002'}}>
        <h2 style={{marginBottom:16}}>맞춤법 교정 결과</h2>
        <div style={{display:'flex',gap:24}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:'bold',marginBottom:8}}>원본</div>
            <div style={{whiteSpace:'pre-wrap',wordBreak:'break-all',border:'1px solid #eee',borderRadius:4,padding:8,minHeight:120}}>
              {highlightDiff(diff, '', '#ffe0e0')}
            </div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:'bold',marginBottom:8}}>교정본</div>
            <div style={{whiteSpace:'pre-wrap',wordBreak:'break-all',border:'1px solid #eee',borderRadius:4,padding:8,minHeight:120}}>
              {highlightDiff(diff, '#e0ffe0', '')}
            </div>
          </div>
        </div>
        <div style={{textAlign:'right',marginTop:24, display:'flex', gap:12, justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'8px 20px',borderRadius:4,border:'none',background:'#aaa',color:'#fff',fontWeight:'bold',fontSize:16,cursor:'pointer'}}>닫기</button>
          <button onClick={onApply} style={{padding:'8px 20px',borderRadius:4,border:'none',background:'#3182f6',color:'#fff',fontWeight:'bold',fontSize:16,cursor:'pointer'}}>적용하기</button>
        </div>
      </div>
    </div>
  );
};

export default SpellCheckDiffModal; 