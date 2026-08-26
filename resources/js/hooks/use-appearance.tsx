import { useEffect, useState } from 'react';

export type Appearance = 'tiffany' | 'pigeon' | 'royal' | 'midnight' | 'system' | 'highland' | 'heather' | 'light' | 'dark';

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

const normalizeAppearance = (appearance: Appearance): Appearance => {
    if (appearance === 'light' || appearance === 'highland') return 'tiffany';
    if (appearance === 'heather') return 'pigeon';
    if (appearance === 'dark') return 'midnight';
    return appearance;
};

const applyTheme = (appearance: Appearance) => {
    const normalized = normalizeAppearance(appearance);
    const isDark = normalized === 'midnight' || (normalized === 'system' && prefersDark());

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.remove('theme-highland', 'theme-heather', 'theme-tiffany', 'theme-pigeon', 'theme-royal', 'theme-midnight');
    document.documentElement.classList.add(`theme-${normalized === 'system' ? (isDark ? 'midnight' : 'tiffany') : normalized}`);
};

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

const handleSystemThemeChange = () => {
    const currentAppearance = localStorage.getItem('appearance') as Appearance;
    applyTheme(currentAppearance || 'system');
};

export function initializeTheme() {
    const savedAppearance = (localStorage.getItem('appearance') as Appearance) || 'system';

    applyTheme(savedAppearance);

    // Add the event listener for system theme changes...
    mediaQuery.addEventListener('change', handleSystemThemeChange);
}

/**
 * Whether the `dark` class is currently applied to <html> — tracked via a
 * MutationObserver rather than reading `useAppearance()`'s own state,
 * because that state only changes when *this* hook instance's own
 * `updateAppearance` is called. A toggle rendered elsewhere on the page
 * (or a 'system' appearance reacting to an OS-level change) mutates the
 * DOM directly through `applyTheme()` without notifying other components,
 * so observing the class attribute itself is the only way every consumer
 * stays in sync with the actual rendered appearance.
 */
export function useIsDark() {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    return isDark;
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('system');

    const updateAppearance = (mode: Appearance) => {
        const normalized = normalizeAppearance(mode);
        setAppearance(normalized);
        localStorage.setItem('appearance', normalized);
        applyTheme(normalized);
    };

    useEffect(() => {
        const savedAppearance = localStorage.getItem('appearance') as Appearance | null;
        updateAppearance(savedAppearance || 'system');

        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }, []);

    return { appearance, updateAppearance };
}
