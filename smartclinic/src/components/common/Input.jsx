export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 mb-4 ${className}`}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input 
        className={`border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-shadow
          ${error 
            ? 'border-red-500 focus:ring-red-200' 
            : 'border-gray-300 focus:border-primary focus:ring-blue-100'
          }`}
        {...props} 
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}