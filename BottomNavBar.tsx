// This file acts as a re-exporter to resolve any potential module resolution conflicts
// caused by an accidental file in the root directory. It points to the correct component.
export { default } from './components/BottomNavBar';
