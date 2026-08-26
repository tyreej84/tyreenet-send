import { SVGAttributes, useId } from 'react';

/** TyreeNet's continuous Celtic-knot mark, woven around a strong T. */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    const gradientId = useId();

    return (
        <svg {...props} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="TyreeNet">
            <defs>
                <linearGradient id={gradientId} x1="10" y1="8" x2="55" y2="58" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#81d8d0" />
                    <stop offset="0.48" stopColor="#4169e1" />
                    <stop offset="0.86" stopColor="#6d8299" />
                    <stop offset="1" stopColor="#b7791f" />
                </linearGradient>
            </defs>
            <g fill="none" stroke={`url(#${gradientId})`} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M32 7 48 23 32 39 16 23 32 7Z" />
                <path d="M32 25 49 42 32 57 15 42 32 25Z" />
                <path d="M15 15h34M32 15v42" />
            </g>
        </svg>
    );
}
