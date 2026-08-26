import { SVGAttributes } from 'react';
import AppLogoIcon from './app-logo-icon';

/** Full TyreeNet Send identity used on recipient sign-in surfaces. */
export default function ProjectSendLogo(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 420 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="TyreeNet Send">
            <AppLogoIcon x="4" y="8" width="80" height="80" />
            <text
                x="100"
                y="52"
                fill="currentColor"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fontSize="38"
                fontWeight="700"
                letterSpacing="-1.2"
            >
                TyreeNet
            </text>
            <text
                x="102"
                y="75"
                fill="currentColor"
                opacity="0.68"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fontSize="14"
                fontWeight="600"
                letterSpacing="5"
            >
                SEND
            </text>
        </svg>
    );
}
