export default function CoinIcon({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer circle */}
      <circle cx="12" cy="12" r="10" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5" />
      {/* Inner circle for shine */}
      <circle cx="12" cy="12" r="7" fill="none" stroke="#FEF3C7" strokeWidth="0.5" opacity="0.6" />
      {/* Dollar sign */}
      <path d="M12 8v8" stroke="#92400E" strokeWidth="1.5" />
      <path d="M9 9h6c0.5 0 1 0.5 1 1s-0.5 1-1 1h-6c-0.5 0-1 0.5-1 1s0.5 1 1 1h6" stroke="#92400E" strokeWidth="1.5" />
    </svg>
  );
}
