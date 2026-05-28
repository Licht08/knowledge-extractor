import type { KnowledgeNote } from '../types';

function renderList(items: string[], fallback: string): string {
  if (items.length === 0) {
    return `- ${fallback}`;
  }

  return items.map((item) => `- ${item}`).join('\n');
}

export function buildMarkdownNote(note: Omit<KnowledgeNote, 'markdown'>): string {
  const keywords = note.keywords.length > 0 ? note.keywords.join(', ') : '待补充';

  return `# ${note.title || '未命名知识摘录'}

> 来源类型：${note.sourceType}
> 提取时间：${note.extractedAt}

## 原文

${note.originalText || '待补充'}

## 摘要

${note.summary || '待整理'}

## 关键词

${keywords}

## 待整理问题

${renderList(note.questions, '这段材料最值得追问的问题是什么？')}
`;
}
