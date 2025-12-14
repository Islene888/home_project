// AI文字优化工具 - 使用 OpenAI API
import OpenAI from 'openai';

interface TextOptimizationOptions {
  action: "improve" | "shorten" | "expand" | "tone";
  tone?: "professional" | "casual" | "creative";
}

export interface TextSuggestion {
  original: string;
  suggestion: string;
  reason: string;
}

// 初始化 OpenAI 客户端
let openai: OpenAI | null = null;

try {
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // 注意：生产环境应该使用后端代理
    });
  }
} catch (error) {
  console.warn('OpenAI client initialization failed:', error);
}

// 预定义的文字优化规则 - 更全面的词汇替换
const improvementRules = [
  {
    pattern: /\b(ok|okay)\b/gi,
    replacement: "excellent",
    reason: "Using stronger positive language"
  },
  {
    pattern: /\b(good)\b/gi,
    replacement: "outstanding",
    reason: "Enhanced descriptive language"
  },
  {
    pattern: /\b(nice)\b/gi,
    replacement: "fantastic",
    reason: "More enthusiastic expression"
  },
  {
    pattern: /\b(great)\b/gi,
    replacement: "exceptional",
    reason: "More impactful language"
  },
  {
    pattern: /\b(cool)\b/gi,
    replacement: "impressive",
    reason: "More professional tone"
  },
  {
    pattern: /\b(awesome)\b/gi,
    replacement: "remarkable",
    reason: "Elevated vocabulary"
  },
  {
    pattern: /\b(big)\b/gi,
    replacement: "substantial",
    reason: "More precise terminology"
  },
  {
    pattern: /\b(small)\b/gi,
    replacement: "compact",
    reason: "More descriptive language"
  },
  {
    pattern: /\b(fast|quick)\b/gi,
    replacement: "efficient",
    reason: "Professional terminology"
  },
  {
    pattern: /\b(easy)\b/gi,
    replacement: "straightforward",
    reason: "More sophisticated expression"
  },
  {
    pattern: /\b(hard|difficult)\b/gi,
    replacement: "challenging",
    reason: "More positive framing"
  },
  {
    pattern: /\b(text|content)\b/gi,
    replacement: "compelling content",
    reason: "More engaging description"
  },
  {
    pattern: /\b(hello|hi)\b/gi,
    replacement: "greetings",
    reason: "More polished greeting"
  },
  {
    pattern: /\b(make|create)\b/gi,
    replacement: "craft",
    reason: "More elegant verb choice"
  },
  {
    pattern: /\b(help)\b/gi,
    replacement: "assist",
    reason: "More formal language"
  }
];

const shortenRules = [
  {
    pattern: /\b(in order to)\b/gi,
    replacement: "to",
    reason: "Simplified phrasing"
  },
  {
    pattern: /\b(at this point in time)\b/gi,
    replacement: "now",
    reason: "Concise expression"
  },
  {
    pattern: /\b(due to the fact that)\b/gi,
    replacement: "because",
    reason: "Direct language"
  }
];

const expandRules = [
  {
    pattern: /\b(fast)\b/gi,
    replacement: "remarkably fast and efficient",
    reason: "Added descriptive detail"
  },
  {
    pattern: /\b(good)\b/gi,
    replacement: "exceptionally good and well-designed",
    reason: "Enhanced description"
  },
  {
    pattern: /\b(nice)\b/gi,
    replacement: "beautifully crafted and aesthetically pleasing",
    reason: "Detailed description"
  }
];

const toneRules = {
  professional: [
    {
      pattern: /\b(hey|hi)\b/gi,
      replacement: "Hello",
      reason: "Professional greeting"
    },
    {
      pattern: /\b(gonna)\b/gi,
      replacement: "going to",
      reason: "Formal language"
    },
    {
      pattern: /\b(wanna)\b/gi,
      replacement: "want to",
      reason: "Professional tone"
    }
  ],
  casual: [
    {
      pattern: /\b(Hello)\b/gi,
      replacement: "Hey",
      reason: "Casual greeting"
    },
    {
      pattern: /\b(going to)\b/gi,
      replacement: "gonna",
      reason: "Relaxed tone"
    }
  ],
  creative: [
    {
      pattern: /\b(good)\b/gi,
      replacement: "magnificent",
      reason: "Creative expression"
    },
    {
      pattern: /\b(nice)\b/gi,
      replacement: "delightful",
      reason: "Artistic language"
    }
  ]
};

// 使用OpenAI API进行文字优化
export async function optimizeText(text: string, options: TextOptimizationOptions): Promise<TextSuggestion> {
  console.log('=== optimizeText called ===');
  console.log('Text:', text);
  console.log('Options:', options);
  console.log('OpenAI available:', !!openai);
  console.log('API Key available:', !!import.meta.env.VITE_OPENAI_API_KEY);

  // 如果没有OpenAI客户端或API密钥，直接使用备用方案
  if (!openai || !import.meta.env.VITE_OPENAI_API_KEY) {
    console.log('Using fallback optimization...');
    const result = fallbackOptimizeText(text, options);
    console.log('Fallback result:', result);
    return result;
  }

  try {
    let prompt = "";

    switch (options.action) {
      case "improve":
        prompt = `Improve the following text to make it more engaging and impactful while maintaining the same meaning. Only return the improved text, nothing else: "${text}"`;
        break;
      case "shorten":
        prompt = `Make the following text more concise and brief while preserving the core meaning. Only return the shortened text, nothing else: "${text}"`;
        break;
      case "expand":
        prompt = `Expand the following text with more detail and description while maintaining clarity. Only return the expanded text, nothing else: "${text}"`;
        break;
      case "tone":
        const toneMap = {
          professional: "professional and formal",
          casual: "casual and friendly",
          creative: "creative and artistic"
        };
        const toneStyle = toneMap[options.tone || "professional"];
        prompt = `Rewrite the following text in a ${toneStyle} tone. Only return the rewritten text, nothing else: "${text}"`;
        break;
    }

    console.log('Making API call with prompt:', prompt);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    console.log('OpenAI API Response:', completion);
    const suggestion = completion.choices[0]?.message?.content?.trim() || text;
    console.log('Extracted suggestion:', suggestion);
    const actionMap = {
      improve: "Enhanced with AI to be more engaging",
      shorten: "Condensed for clarity and brevity",
      expand: "Expanded with additional detail",
      tone: `Adjusted to ${options.tone || "professional"} tone`
    };

    return {
      original: text,
      suggestion: suggestion.replace(/^["']|["']$/g, ''), // 移除可能的引号
      reason: actionMap[options.action]
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    // 如果API调用失败，回退到预定义规则
    return fallbackOptimizeText(text, options);
  }
}

// 备用优化函数（使用预定义规则）
function fallbackOptimizeText(text: string, options: TextOptimizationOptions): TextSuggestion {
  console.log('=== fallbackOptimizeText called ===');
  console.log('Input text:', text);
  console.log('Options:', options);

  let optimizedText = text;
  let reason = "";

  switch (options.action) {
    case "improve":
      // 尝试应用改进规则
      for (const rule of improvementRules) {
        if (rule.pattern.test(optimizedText)) {
          optimizedText = optimizedText.replace(rule.pattern, rule.replacement);
          reason = rule.reason;
          break;
        }
      }
      // 如果没有匹配的规则，提供智能改进
      if (reason === "") {
        // 1. 首字母大写
        const capitalized = text.charAt(0).toUpperCase() + text.slice(1);

        if (capitalized !== text) {
          optimizedText = capitalized;
          reason = "Capitalized first letter for better presentation";
        } else {
          // 2. 添加句号使其更正式
          if (!text.endsWith('.') && !text.endsWith('!') && !text.endsWith('?')) {
            optimizedText = text + '.';
            reason = "Added period for polished presentation";
          } else {
            // 3. 移除多余空格并优化格式
            const cleaned = text.replace(/\s+/g, ' ').trim();
            if (cleaned !== text) {
              optimizedText = cleaned;
              reason = "Cleaned up spacing for better formatting";
            } else {
              // 4. 最后选择：添加优化标记
              optimizedText = `✨ ${text}`;
              reason = "Added polish symbol for enhanced appeal";
            }
          }
        }
      }
      break;

    case "shorten":
      for (const rule of shortenRules) {
        if (rule.pattern.test(optimizedText)) {
          optimizedText = optimizedText.replace(rule.pattern, rule.replacement);
          reason = rule.reason;
          break;
        }
      }
      if (reason === "") {
        // 移除限定词
        let shortened = text.replace(/\b(very|really|quite|rather|extremely|incredibly)\s+/gi, "");
        if (shortened !== text && shortened.trim()) {
          optimizedText = shortened;
          reason = "Removed unnecessary qualifying words";
        } else {
          // 如果没有限定词，尝试其他简化
          shortened = text.replace(/\s+and\s+/gi, " & ");
          if (shortened !== text) {
            optimizedText = shortened;
            reason = "Used shorter connectors";
          } else {
            // 强制简化：移除文章或添加简化标记
            shortened = text.replace(/\b(the|a|an)\s+/gi, "").trim();
            if (shortened !== text && shortened) {
              optimizedText = shortened;
              reason = "Removed unnecessary articles";
            } else {
              // 最后手段：添加简化标记
              optimizedText = `${text.slice(0, Math.max(1, text.length - 2))}`;
              if (optimizedText === text) {
                optimizedText = text.replace(/[.!?]*$/, "");
                reason = "Removed ending punctuation";
              } else {
                reason = "Shortened by removing ending";
              }
            }
          }
        }
      }
      break;

    case "expand":
      for (const rule of expandRules) {
        if (rule.pattern.test(optimizedText)) {
          optimizedText = optimizedText.replace(rule.pattern, rule.replacement);
          reason = rule.reason;
          break;
        }
      }
      if (reason === "") {
        optimizedText = `${text} - with enhanced detail and comprehensive information`;
        reason = "Added descriptive content";
      }
      break;

    case "tone":
      const toneRuleSet = toneRules[options.tone || "professional"];
      for (const rule of toneRuleSet) {
        if (rule.pattern.test(optimizedText)) {
          optimizedText = optimizedText.replace(rule.pattern, rule.replacement);
          reason = rule.reason;
          break;
        }
      }
      if (reason === "") {
        // 提供基于语气的通用调整 - 强制改变
        switch (options.tone) {
          case "professional":
            const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
            if (!capitalized.endsWith('.') && !capitalized.endsWith('!') && !capitalized.endsWith('?')) {
              optimizedText = capitalized + ".";
              reason = "Added period for professional tone";
            } else if (capitalized !== text) {
              optimizedText = capitalized;
              reason = "Capitalized for professional presentation";
            } else {
              optimizedText = `Professional: ${text}`;
              reason = "Added professional prefix";
            }
            break;
          case "casual":
            const lowercase = text.toLowerCase().replace(/[.!?]$/, "");
            if (lowercase !== text) {
              optimizedText = lowercase;
              reason = "Made more casual and relaxed";
            } else {
              optimizedText = `hey ${text}`;
              reason = "Added casual greeting";
            }
            break;
          case "creative":
            optimizedText = `✨ ${text} 🎨`;
            reason = "Added creative flourishes";
            break;
          default:
            optimizedText = `${options.tone}: ${text}`;
            reason = `Adjusted to ${options.tone} tone`;
        }
      }
      break;
  }

  const result = {
    original: text,
    suggestion: optimizedText,
    reason: `${reason} (Offline mode)`
  };

  console.log('=== fallbackOptimizeText result ===');
  console.log('Original:', result.original);
  console.log('Suggestion:', result.suggestion);
  console.log('Same?', result.suggestion === result.original);
  console.log('Reason:', result.reason);

  return result;
}

// 快速建议 - 提供多个选项
export async function getTextSuggestions(text: string): Promise<TextSuggestion[]> {
  console.log('getTextSuggestions called with:', text);

  // 如果文本太短或为空，先提供一些备用建议
  if (!text || text.trim().length < 2) {
    return [
      {
        original: text,
        suggestion: "Add meaningful content here",
        reason: "Text is too short for AI analysis"
      }
    ];
  }

  // 如果没有OpenAI客户端，直接使用备用方案
  if (!openai || !import.meta.env.VITE_OPENAI_API_KEY) {
    console.log('OpenAI not available, using fallback suggestions');
    return getFallbackSuggestions(text);
  }

  const suggestions: TextSuggestion[] = [];

  // 尝试不同的优化选项
  const options = [
    { action: "improve" as const },
    { action: "shorten" as const },
    { action: "expand" as const }
  ];

  try {
    console.log('Attempting API calls...');
    // 并行调用API获取建议
    const results = await Promise.all(
      options.map(option => optimizeText(text, option))
    );

    console.log('API results:', results);

    for (const result of results) {
      console.log('Processing result:', {
        original: result.original,
        suggestion: result.suggestion,
        same: result.suggestion === text,
        empty: result.suggestion.trim() === '',
        reason: result.reason
      });

      if (result.suggestion !== text && result.suggestion.trim() !== '') {
        suggestions.push(result);
        console.log('Added suggestion:', result.suggestion);
      } else {
        console.log('Skipped suggestion - same as original or empty');
      }
    }

    console.log('Final suggestions count:', suggestions.length);

    // 如果API没有返回有效建议，使用备用方案
    if (suggestions.length === 0) {
      console.log('No API suggestions, using fallback');
      return getFallbackSuggestions(text);
    }

    return suggestions.slice(0, 3); // 返回前3个建议
  } catch (error) {
    console.error('Error getting suggestions:', error);
    // 回退到使用预定义规则
    return getFallbackSuggestions(text);
  }
}

// 备用建议函数
function getFallbackSuggestions(text: string): TextSuggestion[] {
  console.log('getFallbackSuggestions called with:', text);
  const suggestions: TextSuggestion[] = [];

  const fallbackOptions = [
    { action: "improve" as const },
    { action: "shorten" as const },
    { action: "expand" as const }
  ];

  for (const option of fallbackOptions) {
    const result = fallbackOptimizeText(text, option);
    console.log(`Fallback ${option.action}:`, result);
    if (result.suggestion !== text) {
      suggestions.push(result);
    }
  }

  // 如果还是没有建议，提供一些强制性的通用建议
  if (suggestions.length === 0) {
    console.log('No fallback suggestions worked, providing default suggestions');

    // 提供多个不同的建议选项
    const defaultSuggestions = [
      {
        original: text,
        suggestion: `✨ ${text}`,
        reason: "Added sparkle emoji for emphasis (Offline mode)"
      },
      {
        original: text,
        suggestion: text.charAt(0).toUpperCase() + text.slice(1) + ".",
        reason: "Capitalized and added period (Offline mode)"
      },
      {
        original: text,
        suggestion: `"${text}"`,
        reason: "Added quotation marks (Offline mode)"
      }
    ];

    // 只添加与原文不同的建议
    for (const suggestion of defaultSuggestions) {
      if (suggestion.suggestion !== text) {
        suggestions.push(suggestion);
        break; // 只需要一个有效的建议
      }
    }

    // 如果所有默认建议都和原文相同（极端情况），强制提供一个
    if (suggestions.length === 0) {
      suggestions.push({
        original: text,
        suggestion: `Enhanced: ${text}`,
        reason: "Added prefix for improvement (Offline mode)"
      });
    }
  }

  console.log('Final fallback suggestions:', suggestions);
  return suggestions.slice(0, 3);
}