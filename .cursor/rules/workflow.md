---
alwaysApply: true
---

# Chrome Extension Development Workflow

## Our Standard Workflow:

1. **Discuss improvement** - We talk about what to add/fix
2. **Implement & build** - I make the changes and build the extension
3. **Ask for testing** - I ask "Is everything working as expected?"
4. **Get feedback** - You test and let me know if it's good or needs changes
5. **Commit if good** - If everything looks good, I commit with a short message (no prefixes like 'feat:')

## Commit Message Guidelines:
- Keep commit messages short
- Omit prefixes like 'feat:', 'fix:', etc.
- Focus on what was changed/improved

## Project Context:
- Google Tasks Chrome Extension
- React + TypeScript
- Uses Google Tasks API
- Multi-account support
- Google Tasks-like UI with separate incomplete/completed sections
- Persistent settings for completed tasks visibility
- Hover-only task actions with trash can delete icon
- No starring system (removed due to API limitations)

## Design System & Styling Rules:

### STRICT NO-INLINE-STYLES POLICY:
- **NEVER use inline styles** (`style={{}}`) in React components
- **ALWAYS use CSS classes** for all styling
- **NEVER hardcode colors, sizes, or spacing** in components
- **ALWAYS use CSS variables** from `src/styles/variables.css`

### CSS Variables Usage:
- **Typography**: Use `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl`
- **Colors**: Use semantic variables like `--text-primary`, `--text-secondary`, `--text-info`, `--text-success`, `--text-danger`
- **Spacing**: Use `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`
- **Component Sizes**: Use `--icon-size-sm`, `--icon-size-md`, `--icon-size-lg`, `--button-size-md`
- **Layout**: Use `--app-width`, `--slider-width`, `--menu-min-width`, `--subtask-indent`

### File Organization:
- **Design tokens**: `src/styles/variables.css` (50+ CSS variables)
- **Global styles**: `src/styles/global.css` (utility classes and component styles)
- **Component styles**: `src/components/TaskItem.css` (component-specific styles)
- **HTML structure**: `src/popup.html` (includes variables.css)

### Code Quality Standards:
- **Consistency**: All similar elements use the same CSS variables
- **Maintainability**: Changes to design tokens only require updates in `variables.css`
- **Semantic naming**: Use descriptive variable names (e.g., `--text-primary` not `--color-1`)
- **Responsive design**: Use CSS variables for breakpoints (`--spacing-480px`)

### Before Adding New Styles:
1. **Check existing variables** in `variables.css` first
2. **Add new variables** to `variables.css` if needed
3. **Create CSS classes** in appropriate CSS file
4. **Use semantic class names** that describe the purpose
5. **Test the build** to ensure everything compiles correctly

### Examples of CORRECT usage:
```tsx
// ✅ GOOD - Using CSS classes
<button className="refresh-tasks-btn-styled">Refresh</button>

// ✅ GOOD - Using semantic class names
<div className="header-controls-styled">...</div>

// ❌ BAD - Inline styles (NEVER DO THIS)
<button style={{ padding: '4px', color: '#666' }}>Refresh</button>
```

### Examples of CORRECT CSS:
```css
/* ✅ GOOD - Using CSS variables */
.refresh-btn {
  padding: var(--spacing-xs);
  color: var(--text-gray);
  font-size: var(--text-lg);
}

/* ❌ BAD - Hardcoded values (NEVER DO THIS) */
.refresh-btn {
  padding: 4px;
  color: #666;
  font-size: 16px;
}
``` 