export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseStyle = "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-blue-600 shadow-sm",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
}