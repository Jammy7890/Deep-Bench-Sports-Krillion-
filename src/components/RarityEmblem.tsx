import { RARITY_CONFIG, type RarityTier } from '../types';

interface RarityEmblemProps {
  tier: RarityTier;
  size?: number;
  className?: string;
}

export function RarityEmblem({ tier, size = 20, className = '' }: RarityEmblemProps) {
  const color = RARITY_CONFIG[tier].accentHex;

  switch (tier) {
    case 'Rookie':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" />
          <path d="M9 12h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'Starter':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M12 3l7 4v10l-7 4-7-4V7l7-4z"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.5" fill={color} />
        </svg>
      );
    case 'All-Star':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M12 3l2.6 5.4 6 .8-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.4 9.2l6-.8L12 3z"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'Deep Cut':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M12 2l8.5 10L12 22 3.5 12 12 2z"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M12 7l4.5 5-4.5 5-4.5-5L12 7z"
            fill={color}
            fillOpacity="0.28"
            stroke={color}
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'Mythic':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M4 17l1.5-9 4.5 3.5L12 4l2 7.5L18.5 8 20 17H4z"
            fill={color}
            fillOpacity="0.22"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M5 20h14" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}
