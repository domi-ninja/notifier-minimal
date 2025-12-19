# Ticket: Add Tailwind CSS (NativeWind) to Chores App

**ID:** tailwind_setup_001  
**Status:** Completed  
**Priority:** Medium

## Summary

Integrate Tailwind CSS into the React Native/Expo Chores app using NativeWind v4 to replace the current ~900 lines of StyleSheet definitions with utility classes.

## Background

The current `App.tsx` contains over 900 lines of StyleSheet definitions. Using Tailwind CSS will:
- Reduce style boilerplate significantly
- Enable faster UI development with utility classes
- Provide consistent design tokens
- Work across Android, iOS, and Web

## Technical Approach

Use **NativeWind v4** - the official Tailwind CSS adapter for React Native that compiles Tailwind classes at build time.

## Implementation Steps

### Phase 1: Setup & Configuration ✅

- [x] **1.1** Install dependencies
  - `nativewind` - Tailwind CSS for React Native
  - `tailwindcss@^3` - Core Tailwind CSS (v3 required by NativeWind)
  - `react-native-reanimated` - Required peer dependency
  - `react-native-css-interop` - CSS interop for React Native
  - `react-native-worklets` - Required by reanimated

- [x] **1.2** Create `babel.config.js` with NativeWind preset

- [x] **1.3** Create `tailwind.config.js` with:
  - Content paths for App.tsx and any component files
  - Custom colors matching current theme (#90D4A3 primary green, etc.)

- [x] **1.4** Create `metro.config.js` with NativeWind CSS support

- [x] **1.5** Create `global.css` with Tailwind directives

- [x] **1.6** Update entry point to import global.css

### Phase 2: Migrate Styles (incremental) ✅

- [x] **2.1** Migrate LoginScreen component
- [x] **2.2** Migrate header and navigation styles  
- [x] **2.3** Migrate family setup card
- [x] **2.4** Migrate loading states
- [x] **2.5** Migrate error states

### Phase 3: Testing & Cleanup ✅

- [x] **3.1** Web export successful (CSS generated: 10.3 kB)
- [x] **3.2** Android build successful (BUILD SUCCESSFUL in 1m 33s)
- [ ] **3.3** Remove unused StyleSheet definitions (optional - can do incrementally)
- [x] **3.4** Custom colors added to tailwind.config.js

## Dependencies

- Expo SDK 54 ✓
- React Native 0.81 ✓
- NativeWind 4.2.1 ✓
- Tailwind CSS 3.4.19 ✓

## Files Created/Modified

- `package.json` - Added dependencies
- `babel.config.js` - New file with NativeWind + Reanimated plugins
- `tailwind.config.js` - New file with custom theme colors
- `metro.config.js` - New file with CSS support
- `global.css` - New file with Tailwind directives
- `nativewind-env.d.ts` - TypeScript declarations
- `App.tsx` - Import CSS, migrated key components to Tailwind classes

## Testing Checklist

- [x] App builds without errors (Android ✓, Web ✓)
- [x] CSS generated correctly (web-9259a4850b3bf27339e104e8ea0f6eb5.css)
- [ ] Login screen renders correctly (needs device test)
- [ ] Main chore list renders correctly (needs device test)
- [ ] Android APK at: `android/app/build/outputs/apk/debug/app-debug.apk`

## Usage

Components can now use Tailwind classes via the `className` prop:

```tsx
<View className="flex-1 bg-white p-4">
  <Text className="text-lg font-bold text-primary">Hello</Text>
</View>
```

Custom theme colors available:
- `primary` / `primary-dark` - Green (#90D4A3 / #2E7D32)
- `danger` - Red (#FF3B30)
- `warning` - Orange (#FF9500)
- `border` / `border-dark` - Gray borders
- `bg-muted` / `bg-input` - Background colors

