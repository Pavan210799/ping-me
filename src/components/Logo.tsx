export function Logo({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/logo.svg"
      alt="PingMe"
      width={size}
      height={size}
      className="object-contain drop-shadow-sm transition duration-300 hover:scale-110 hover:-rotate-6"
    />
  );
}
