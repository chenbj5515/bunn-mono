"use client"
import React from "react";
import { Card } from "ui/components/card";
import { Button } from "ui/components/button";
import { useAtomValue } from "jotai";
import { cardIdAtom } from "@/lib/atom";
import { usePathname, useRouter } from "next/navigation";
import { insertWordCard } from "./server-functions";
import { useTranslations } from "next-intl";

// 简化类型定义
type TranslationPopupProps = {
  word: string;
  meaning: string;
  position: { top: number; left: number };
  isVisible: boolean;
  onClose: () => void;
  onAddToWordCards: () => void;
};

// 翻译结果弹窗组件
export function TranslationPopup({
  word,
  meaning,
  position,
  isVisible,
  onClose,
  onAddToWordCards
}: TranslationPopupProps) {
  const { top, left } = position;
  const t = useTranslations('wordCard');

  return (
    <Card
      className="z-[15] fixed mx-auto p-3 rounded-[6px] max-w-[240px] text-[15px] translation-popup"
      style={{ 
        top, 
        left, 
        visibility: isVisible ? "visible" : "hidden" 
      }}
    >
      <div>{t('word')}：{word}</div>
      <div className="flex">
        <div className="whitespace-nowrap">{t('meaning')}：</div>
        <div className="whitespace-pre-wrap">{meaning}</div>
      </div>

      <div className="flex justify-center mt-2">
        <Button
          variant="outline"
          onClick={onAddToWordCards}
        >
          {t('addToWordCards')}
        </Button>
      </div>
    </Card>
  );
}

// 主组件 - 处理文本选择和翻译弹窗的显示
export function WordCardAdder() {
  const [translationState, setTranslationState] = React.useState({
    isVisible: false,
    word: '',
    meaning: '',
    position: { top: 0, left: 0 }
  });
  const cardId = useAtomValue(cardIdAtom);
  const pathname = usePathname();
  const router = useRouter();

  // 处理文本选择
  React.useEffect(() => {
    function handleTextSelection() {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      // 获取选择范围的位置
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // 获取带上下文的原始文本
      const parentElement = range.startContainer.parentElement;
      const contextText = parentElement?.textContent || '';

      // 设置状态
      fetchTranslation(selectedText, contextText, rect);
    }

    document.addEventListener('mouseup', handleTextSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, []);

  // 处理ruby标签悬停
  React.useEffect(() => {
    // 处理ruby悬停
    async function handleRubyHover(event: MouseEvent) {
      const rubyElement = event.target as Element;
      if (rubyElement.tagName?.toLowerCase() === 'ruby' || rubyElement.closest('ruby')) {
        const ruby = rubyElement.tagName?.toLowerCase() === 'ruby' ? rubyElement : rubyElement.closest('ruby');
        if (ruby) {
          const rtElement = ruby.querySelector('rt');
          const rubyText = ruby.textContent?.replace(rtElement?.textContent || '', '') || '';
          const rect = ruby.getBoundingClientRect();
          
          const originalTextElement = ruby.closest('.original-text');
          if (originalTextElement) {
            const originalText = originalTextElement.textContent || '';
            
            // 处理ruby文本悬停时的翻译
            try {
              // 调用API获取翻译
              const response = await fetch('/api/ai/generate-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  prompt: `在「${originalText}」这个上下文中出现了「${rubyText.trim()}」这个单词或短语、我要你尽可能简短地给出「${rubyText.trim()}」这个单词或短语的意思，注意我只需要这个单词或短语在这个句子中文含义，不要给出除此之外的任何内容，注意「这个意思是」的前缀也不要。`
                })
              });

              if (response.ok) {
                const data = await response.json();
                
                setTranslationState({
                  isVisible: true,
                  word: rubyText.trim(),
                  meaning: data.data,
                  position: {
                    top: rect.bottom + window.scrollY,
                    left: rect.right + window.scrollX
                  }
                });
              }
            } catch (error) {
              console.error('获取翻译失败:', error);
            }
          }
        }
      }
    }

    // 处理鼠标离开ruby标签
    function handleRubyLeave() {
      setTranslationState(prev => ({ ...prev, isVisible: false }));
    }

    // 添加对ruby标签的监听
    function addRubyHoverListeners() {
      const rubyElements = document.querySelectorAll('ruby');
      rubyElements.forEach(ruby => {
        ruby.addEventListener('mouseenter', handleRubyHover);
        ruby.addEventListener('mouseleave', handleRubyLeave);
      });
    }
    
    // 移除对ruby标签的监听
    function removeRubyHoverListeners() {
      const rubyElements = document.querySelectorAll('ruby');
      rubyElements.forEach(ruby => {
        ruby.removeEventListener('mouseenter', handleRubyHover);
        ruby.removeEventListener('mouseleave', handleRubyLeave);
      });
    }
    
    // 初始添加监听
    addRubyHoverListeners();
    
    // 设置MutationObserver监听DOM变化，以便处理动态添加的ruby标签
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          addRubyHoverListeners();
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      removeRubyHoverListeners();
      observer.disconnect();
    };
  }, []);

  // 获取翻译
  async function fetchTranslation(selectedText: string, contextText: string, rect: DOMRect) {
    try {
      // 调用API获取翻译
      const response = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `在「${contextText}」这个上下文中出现了「${selectedText}」这个单词或短语、我要你尽可能简短地给出「${selectedText}」这个单词或短语的意思，注意我只需要这个单词或短语在这个句子中文含义，不要给出除此之外的任何内容，注意「这个意思是」的前缀也不要。`
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        setTranslationState({
          isVisible: true,
          word: selectedText,
          meaning: data.data,
          position: {
            top: rect.bottom + window.scrollY,
            left: rect.right + window.scrollX
          }
        });
      }
    } catch (error) {
      console.error('获取翻译失败:', error);
    }
  }

  // 添加到单词本
  async function handleAddToWordCards() {
    try {
      const { word, meaning } = translationState;
      await insertWordCard(word, meaning, cardId);
      
      // 重置状态并隐藏弹窗
      setTranslationState(prev => ({ ...prev, isVisible: false }));
      
      // 如果在单词卡页面，刷新页面
      if (pathname.includes("/word-cards")) {
        router.refresh();
      }
    } catch (error) {
      console.error('添加到单词本失败:', error);
    }
  }

  // 关闭弹窗
  function handleClose() {
    setTranslationState(prev => ({ ...prev, isVisible: false }));
  }

  // 点击页面其他区域时关闭弹窗
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (translationState.isVisible) {
        const target = event.target as Element;
        if (!target.closest('.translation-popup')) {
          handleClose();
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [translationState.isVisible]);

  return (
    <TranslationPopup
      word={translationState.word}
      meaning={translationState.meaning}
      position={translationState.position}
      isVisible={translationState.isVisible}
      onClose={handleClose}
      onAddToWordCards={handleAddToWordCards}
    />
  );
}
