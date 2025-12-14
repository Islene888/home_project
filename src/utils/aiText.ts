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
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // 注意：生产环境应该使用后端代理
});

// 预定义的文字优化规则
const improvementRules = [
  {
    pattern: /\b(ok|okay)\b/gi,
    replacement: "excellent",
    reason: "Using stronger positive language"
  },
  {
    pattern: /\b(good|nice)\b/gi,
    replacement: "outstanding",
    reason: "Enhanced descriptive language"
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
    pattern: /\b(fast)\b/gi,
    replacement: "efficient",
    reason: "Professional terminology"
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
  console.log('optimizeText called with:', text, options);
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
  let optimizedText = text;
  let reason = "";

  switch (options.action) {
    case "improve":
      for (const rule of improvementRules) {
        if (rule.pattern.test(optimizedText)) {
          optimizedText = optimizedText.replace(rule.pattern, rule.replacement);
          reason = rule.reason;
          break;
        }
      }
      if (reason === "") {
        optimizedText = text.charAt(0).toUpperCase() + text.slice(1);
        reason = "Capitalized first letter for better presentation";
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
        optimizedText = text.replace(/\b(very|really|quite|rather)\s+/gi, "");
        reason = "Removed unnecessary qualifying words";
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
        reason = `Adjusted to ${options.tone} tone`;
      }
      break;
  }

  return {
    original: text,
    suggestion: optimizedText,
    reason: `${reason} (Offline mode)`
  };
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