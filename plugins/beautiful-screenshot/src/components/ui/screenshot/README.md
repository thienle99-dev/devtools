# Screenshot UI Components

Reusable UI components for the Screenshot Studio tool.

## Components

### CollapsibleSection

A collapsible section with icon, title, badge, and expandable content.

**Props:**

- `icon: React.ReactNode` - Icon to display
- `title: string` - Section title
- `children: React.ReactNode` - Content to show/hide
- `defaultOpen?: boolean` - Initial open state (default: true)
- `badge?: React.ReactNode` - Optional badge next to title
- `iconBg?: string` - Tailwind gradient classes for icon background

**Example:**

```tsx
<CollapsibleSection
  icon={<Layout className="w-4 h-4 text-indigo-400" />}
  title="Canvas"
  iconBg="from-indigo-500/20 to-purple-500/20"
>
  <div>Your content here</div>
</CollapsibleSection>
```

### CompactSlider

A compact slider with label, number input, and range control.

**Props:**

- `label: string` - Slider label
- `value: number` - Current value
- `onChange: (value: number) => void` - Change handler
- `min: number` - Minimum value
- `max: number` - Maximum value
- `unit?: string` - Unit label (default: 'px')
- `color?: 'indigo' | 'blue' | 'amber' | 'pink'` - Color theme (default: 'indigo')

**Example:**

```tsx
<CompactSlider
  label="Padding"
  value={padding}
  onChange={setPadding}
  min={0}
  max={200}
  color="indigo"
/>
```

### ToggleSwitch

iOS-style toggle switch component.

**Props:**

- `checked: boolean` - Current state
- `onChange: (checked: boolean) => void` - Change handler
- `size?: 'sm' | 'md'` - Size variant (default: 'md')

**Example:**

```tsx
<ToggleSwitch checked={enabled} onChange={setEnabled} size="sm" />
```

## Usage

Import components from the index:

```tsx
import {
  CollapsibleSection,
  CompactSlider,
  ToggleSwitch,
} from "./ui/screenshot";
```

## Styling

All components use Tailwind CSS and follow the app's design system with:

- Glass morphism effects
- Gradient accents
- Smooth transitions
- Dark mode support
