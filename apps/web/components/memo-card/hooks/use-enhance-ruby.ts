"use client"
import React from "react";
import { speakText } from "@utils/tts";
import { insertWordCard } from "../server-functions/insert-word-card";
import { usePathname } from "next/navigation";

interface UseEnhanceRubyProps {
  originalTextRef: { current: HTMLDivElement | null };
  rubyTranslationMap: Record<string, string>;
  id: string;
}

export function useEnhanceRuby({ 
  originalTextRef, 
  rubyTranslationMap, 
  id 
}: UseEnhanceRubyProps) {
  const pathname = usePathname();

  // 播放Ruby元素的发音
  const handleRubyClick = (text: string) => {
    speakText(text, {
      voiceName: "ja-JP-NanamiNeural",
    });
  };

  // 添加单词到单词本
  const handleAddToDictionary = async (word: string, meaning: string) => {
    try {
      const result = await insertWordCard(word, meaning, id);
      if (result instanceof Error) {
        throw result;
      }
      // 使用简单的alert替代toast
    } catch (error) {
      console.error('添加单词失败', error);
    }
  };

  // 增强Ruby元素，添加悬停显示翻译弹窗功能
  React.useEffect(() => {
    if (!originalTextRef.current) return;

    const rubyElements = originalTextRef.current.querySelectorAll('ruby');

    rubyElements.forEach(ruby => {
      ruby.style.cursor = 'pointer';

      // 移除所有现有事件监听器
      ruby.removeEventListener('click', handleRubyClick as any);

      // 添加点击事件监听器播放发音
      ruby.addEventListener('click', () => {
        const rtElement = ruby.querySelector('rt');
        const rubyText = rtElement?.textContent || '';
        handleRubyClick(rubyText);
      });

      // 获取原文本
      const textNode = ruby.childNodes[0];
      const originalWord = textNode ? textNode.textContent || '' : '';

      // 如果有翻译，添加悬停提示
      if (originalWord && rubyTranslationMap[originalWord]) {
        // 确保originalWord不为undefined（添加类型安全检查）
        const word = originalWord;
        const meaning = rubyTranslationMap[originalWord] || '';

        // 添加数据属性
        ruby.setAttribute('data-word', word);
        ruby.setAttribute('data-meaning', meaning);
        ruby.classList.add('ruby-word-tooltip');

        // 移除旧的悬停事件
        ruby.onmouseenter = null;
        ruby.onmouseleave = null;

        // 添加悬停事件
        ruby.onmouseenter = (e) => {
          // 先移除所有现有弹窗，确保只有一个弹窗显示
          const existingTooltips = document.querySelectorAll('.ruby-tooltip-popup');
          existingTooltips.forEach(tip => tip.remove());

          const tooltip = document.createElement('div');
          tooltip.className = 'ruby-tooltip-popup';
          tooltip.innerHTML = `
            <div class="tooltip-content">
              <div class="word-info">
                <div class="word-title">語句: ${word}</div>
                <div class="word-meaning">意味: ${meaning}</div>
              </div>
              <button class="add-to-dictionary-btn">单語帳に追加</button>
            </div>
          `;

          // 计算位置
          const rubyRect = ruby.getBoundingClientRect();
          tooltip.style.position = 'absolute';
          tooltip.style.top = `${rubyRect.bottom + window.scrollY - 20}px`;
          tooltip.style.left = `${rubyRect.left + window.scrollX}px`;

          // 添加到DOM
          document.body.appendChild(tooltip);

          // 添加按钮点击事件
          const addButton = tooltip.querySelector('.add-to-dictionary-btn');
          if (addButton) {
            addButton.addEventListener('click', () => {
              handleAddToDictionary(word, meaning);
              tooltip.remove(); // 添加后关闭弹窗
            });
          }
        };

        // 移除mouseleave事件，让弹窗保持显示
        ruby.onmouseleave = null;
      }
    });

    // 监听document点击，关闭悬浮窗（点击空白区域或其他ruby元素时关闭）
    const handleDocumentClick = (e: MouseEvent) => {
      const tooltip = document.querySelector('.ruby-tooltip-popup');
      if (tooltip) {
        const target = e.target as Element;
        // 如果点击的不是弹窗内部元素，并且不是正在触发弹窗的ruby元素，则关闭弹窗
        if (!tooltip.contains(target) && !target.closest('.ruby-word-tooltip')) {
          tooltip.remove();
        }

        // 如果点击的是另一个ruby元素，也关闭当前弹窗（新弹窗会在mouseenter事件中创建）
        const clickedRuby = target.closest('ruby');
        if (clickedRuby && !clickedRuby.contains(e.target as Node)) {
          tooltip.remove();
        }
      }
    };

    document.addEventListener('click', handleDocumentClick);

    return () => {
      rubyElements.forEach(ruby => {
        ruby.removeEventListener('click', handleRubyClick as any);
        ruby.onmouseenter = null;
        ruby.onmouseleave = null;
      });
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [originalTextRef, rubyTranslationMap, id]);

  // 样式：定义Ruby元素的悬停提示样式
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // 添加CSS样式
    const styleId = 'ruby-tooltip-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        ruby.ruby-word-tooltip {
            position: relative;
            border-bottom: 1px dotted #888;
            z-index: 999;
        }
        
        .ruby-tooltip-popup {
            z-index: 1000;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            padding: 12px;
            min-width: 200px;
            animation: fadeIn 0.15s ease-out;
            border-top: 2px solid #f0f0f0;
        }
        
        .ruby-tooltip-popup .tooltip-content {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .ruby-tooltip-popup .word-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        
        .ruby-tooltip-popup .add-to-dictionary-btn {
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .ruby-tooltip-popup .add-to-dictionary-btn:hover {
            background: #f5f5f5;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const element = document.getElementById(styleId);
      if (element) {
        element.remove();
      }
    };
  }, []);

  return { handleRubyClick, handleAddToDictionary };
}
