/**
 * Mobile Export Components
 *
 * This folder contains types and components for the mobile version of the export step.
 *
 * Currently, the mobile tab content is defined inline in ExportStep.tsx for simplicity,
 * as the content is tightly coupled to the parent component's state. The types defined
 * here can be used for future extraction of mobile tab content into separate components.
 *
 * Future structure:
 * - ThemeTab.tsx - Theme selection tab content
 * - BackgroundTab.tsx - Background selection tab content
 * - ScaleTab.tsx - Scale and aspect ratio controls
 * - ContentTab.tsx - Content visibility toggles
 * - HeaderTab.tsx - Day header customization
 * - TimeTab.tsx - Time column customization
 * - ColorTab.tsx - Event color picker (shown when event is selected)
 * - MobileExportLayout.tsx - Main mobile layout wrapper
 */

export * from './types';
