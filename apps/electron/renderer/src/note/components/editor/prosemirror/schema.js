import { Schema } from 'prosemirror-model';

// 마크 정의 (텍스트 포맷팅)
const marks = {
  bold: {
    parseDOM: [{ tag: 'strong' }, { tag: 'b' }],
    toDOM() { return ['strong', 0] }
  },
  italic: {
    parseDOM: [{ tag: 'em' }, { tag: 'i' }],
    toDOM() { return ['em', 0] }
  },
  underline: {
    parseDOM: [{ tag: 'u' }],
    toDOM() { return ['u', 0] }
  },
  strikethrough: {
    parseDOM: [{ tag: 's' }, { tag: 'strike' }],
    toDOM() { return ['s', 0] }
  },
  code: {
    parseDOM: [{ tag: 'code' }],
    toDOM() { return ['code', 0] }
  },
  link: {
    attrs: { href: { default: null } },
    inclusive: false,
    parseDOM: [{ 
      tag: 'a[href]',
      getAttrs: (dom) => ({ href: dom.getAttribute('href') })
    }],
    toDOM(mark) { 
      return ['a', { href: mark.attrs.href }, 0] 
    }
  },
  textColor: {
    attrs: { color: { default: null } },
    parseDOM: [{ 
      tag: 'span[style*="color"]',
      getAttrs: (dom) => ({ color: dom.style.color })
    }],
    toDOM(mark) { 
      return ['span', { style: `color: ${mark.attrs.color}` }, 0] 
    }
  },
  backgroundColor: {
    attrs: { color: { default: null } },
    parseDOM: [{ 
      tag: 'span[style*="background-color"]',
      getAttrs: (dom) => ({ color: dom.style.backgroundColor })
    }],
    toDOM(mark) { 
      return ['span', { style: `background-color: ${mark.attrs.color}` }, 0] 
    }
  },
  fontSize: {
    attrs: { size: { default: '14px' } },
    parseDOM: [{ 
      tag: 'span[style*="font-size"]',
      getAttrs: (dom) => ({ size: dom.style.fontSize })
    }],
    toDOM(mark) { 
      return ['span', { style: `font-size: ${mark.attrs.size}` }, 0] 
    }
  },
  fontFamily: {
    attrs: { family: { default: 'Inter' } },
    parseDOM: [{ 
      tag: 'span[style*="font-family"]',
      getAttrs: (dom) => ({ family: dom.style.fontFamily })
    }],
    toDOM(mark) { 
      return ['span', { style: `font-family: ${mark.attrs.family}` }, 0] 
    }
  }
};

// 노드 정의
const nodes = {
  doc: {
    content: 'block+'
  },
  paragraph: {
    group: 'block',
    content: 'inline*',
    attrs: { align: { default: 'left' } },
    parseDOM: [{ 
      tag: 'p',
      getAttrs: (dom) => ({ align: dom.style.textAlign || 'left' })
    }],
    toDOM(node) { 
      return ['p', { style: `text-align: ${node.attrs.align}` }, 0] 
    }
  },
  heading: {
    group: 'block',
    content: 'inline*',
    defining: true,
    attrs: { level: { default: 1 } },
    parseDOM: [
      { tag: 'h1', attrs: { level: 1 } },
      { tag: 'h2', attrs: { level: 2 } },
      { tag: 'h3', attrs: { level: 3 } },
      { tag: 'h4', attrs: { level: 4 } },
      { tag: 'h5', attrs: { level: 5 } },
      { tag: 'h6', attrs: { level: 6 } }
    ],
    toDOM(node) { 
      return [`h${node.attrs.level}`, 0] 
    }
  },
  blockquote: {
    group: 'block',
    content: 'block+',
    defining: true,
    parseDOM: [{ tag: 'blockquote' }],
    toDOM() { return ['blockquote', 0] }
  },
  code_block: {
    group: 'block',
    content: 'text*',
    code: true,
    defining: true,
    parseDOM: [{ tag: 'pre', preserveWhitespace: 'full' }],
    toDOM() { return ['pre', ['code', 0]] }
  },
  horizontal_rule: {
    group: 'block',
    parseDOM: [{ tag: 'hr' }],
    toDOM() { return ['hr'] }
  },
  bullet_list: {
    group: 'block',
    content: 'list_item+',
    parseDOM: [{ tag: 'ul' }],
    toDOM() { return ['ul', 0] }
  },
  ordered_list: {
    group: 'block',
    content: 'list_item+',
    attrs: { order: { default: 1 } },
    parseDOM: [{ tag: 'ol' }],
    toDOM(node) { return ['ol', { start: node.attrs.order }, 0] }
  },
  list_item: {
    content: 'paragraph block*',
    defining: true,
    parseDOM: [{ tag: 'li' }],
    toDOM() { return ['li', 0] }
  },
  image: {
    group: 'inline',
    inline: true,
    attrs: { 
      src: { default: null },
      alt: { default: null },
      title: { default: null }
    },
    parseDOM: [{ 
      tag: 'img[src]',
      getAttrs: (dom) => ({
        src: dom.getAttribute('src'),
        alt: dom.getAttribute('alt'),
        title: dom.getAttribute('title')
      })
    }],
    toDOM(node) { 
      return ['img', node.attrs] 
    }
  },
  hard_break: {
    group: 'inline',
    inline: true,
    selectable: false,
    parseDOM: [{ tag: 'br' }],
    toDOM() { return ['br'] }
  },
  text: {
    group: 'inline'
  }
};

// 스키마 생성
export const schema = new Schema({ nodes, marks }); 