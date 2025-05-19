# Optimized Bottom Sheet Component

This is a high-performance implementation of a bottom sheet using the `@gorhom/bottom-sheet` library. The component has been optimized for maximum performance, especially on lower-end devices.

## Performance Optimizations

### 1. Component Memoization
- Used `React.memo` to prevent unnecessary re-renders of the entire component
- Implemented shallow prop comparison for better performance

### 2. Callbacks and Memoization
- All callbacks are wrapped with `useCallback` to prevent recreation on each render
- Used `useMemo` for all computed values and styles to avoid recalculations
- Memoized the backdrop component, header components, and other render functions

### 3. Ref Stability
- Stored callback references in refs to maintain stability across renders
- Used stable refs for component instances to prevent recreation

### 4. Event Handling
- Optimized event handlers by using refs to access the latest callback functions
- Reduced the number of event listener registrations

### 5. Rendering Optimizations
- Conditional rendering only when necessary
- Optimized style objects with `StyleSheet.create` for better performance
- Used `hitSlop` for better touch handling performance

### 6. Animation Performance
- Zero-delay timeout for smooth animations during presentation
- Properly configured animation parameters
- Utilized `animateOnMount` for smoother initial animations

### 7. Styling Performance
- Used constant styles where possible to avoid recreation
- Applied className memoization for Tailwind classes
- Optimized backdrop styling to reduce GPU usage

### 8. Reduced Layout Thrashing
- Minimized style calculations during animations
- Used proper layout properties to avoid expensive layout recalculations

### 9. Memory Optimizations
- Avoided closures that capture large objects
- Cleaned up timeouts properly to prevent memory leaks

## Usage Example

```jsx
<BottomSheet
  show={showBottomSheet}
  onRequestClose={() => setShowBottomSheet(false)}
  snapPoints={["50%", "90%"]}
  title="My Bottom Sheet"
  bgColor="#121212"
>
  <Text>Bottom sheet content goes here</Text>
</BottomSheet>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| show | boolean | false | Controls whether the bottom sheet is visible |
| children | ReactNode | - | Content to render inside the bottom sheet |
| title | string | "" | Title text to display at the top |
| childrenStyle | string | - | Additional className for the children container |
| bgColor | string | "#FDFFFC" | Background color of the bottom sheet |
| titleColor | string | - | Additional className for title color/styling |
| titleCenter | boolean | true | Whether to center the title text |
| onRequestClose | () => void | - | Callback when the sheet is dismissed |
| snapPoints | string[] | [] | Array of snap points (e.g. ["25%", "50%"]) |
| enableDynamicSizing | boolean | true | Enable dynamic sizing behavior |
| showCloseIcon | boolean | true | Show close icon in the header |
| enablePanDownToClose | boolean | true | Allow panning down to close |
| footerComponent | FC | - | Custom footer component |
| keyboardBehavior | "interactive" \| "extend" \| "fillParent" | "interactive" | Keyboard behavior |
| enableContentPanningGesture | boolean | false | Allow content panning gesture | 