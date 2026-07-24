# 臻叔 · Brand Spec

极客终端工坊：phosphor 绿 + 近黑底 + mono 排版，Three.js 滚动驱动舞台承载 IP。

## Tokens

```css
:root {
  --bg: oklch(11% 0.012 155);
  --surface: oklch(15% 0.016 155);
  --fg: oklch(93% 0.02 145);
  --muted: oklch(62% 0.03 150);
  --border: oklch(28% 0.03 150);
  --accent: oklch(78% 0.19 145);

  --font-display: "JetBrains Mono", ui-monospace, monospace;
  --font-body: "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

## Posture

1. 终端感：小圆角、等宽标题、`>_` / HUD 标签、扫描线纹理。
2. IP 是 3D 场景主角：网格地面、线框环、粒子；滚动驱动旋转与镜头推进。
3. 强调色 phosphor 绿，每屏最多两处实色（眉标 + 主 CTA），其余用 hairline 绿边。
4. 文案像 shell 日志：短句、路径感、技术大叔口吻。
