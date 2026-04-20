/**
 * Shared split-screen layout for Login / Register.
 * Brand panel on the left (hidden on mobile), form slot on the right.
 */
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Brand panel */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white p-10 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-indigo-300 blur-3xl" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-bold">
            C
          </div>
          <span className="text-lg font-semibold">CreditX</span>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            {title}
          </h1>
          <p className="text-base text-white/80 max-w-md">
            {subtitle}
          </p>
          <ul className="space-y-2 text-sm text-white/90">
            <Feature>5-stage guided application flow</Feature>
            <Feature>Resume drafts any time, from any device</Feature>
            <Feature>Upload, manage and review documents</Feature>
          </ul>
        </div>

        <p className="relative text-xs text-white/70">
          © {new Date().getFullYear()} CreditX. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

const Feature = ({ children }) => (
  <li className="flex items-center gap-2">
    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
      ✓
    </span>
    {children}
  </li>
);
