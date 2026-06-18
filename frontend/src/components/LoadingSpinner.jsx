const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizes = {
    small: 30,
    medium: 50,
    large: 70
  };
  
  const spinnerSize = sizes[size];
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      padding: '2rem'
    }}>
      {/* Animated Spinner */}
      <div style={{
        position: 'relative',
        width: `${spinnerSize}px`,
        height: `${spinnerSize}px`
      }}>
        {/* Outer Ring */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: '4px solid #e0e7ff',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        
        {/* Inner Ring */}
        <div style={{
          position: 'absolute',
          width: '70%',
          height: '70%',
          top: '15%',
          left: '15%',
          border: '3px solid #fef3c7',
          borderBottom: '3px solid #f59e0b',
          borderRadius: '50%',
          animation: 'spin-reverse 1.5s linear infinite'
        }}></div>
        
        {/* Center Dot */}
        <div style={{
          position: 'absolute',
          width: '30%',
          height: '30%',
          top: '35%',
          left: '35%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          animation: 'pulse 2s ease-in-out infinite'
        }}></div>
      </div>
      
      {/* Loading Text */}
      {message && (
        <div style={{
          color: '#667eea',
          fontSize: '1.1rem',
          fontWeight: '600',
          animation: 'fade 1.5s ease-in-out infinite'
        }}>
          {message}
        </div>
      )}
      
      {/* Animated Dots */}
      <div style={{
        display: 'flex',
        gap: '0.5rem'
      }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              background: '#667eea',
              borderRadius: '50%',
              animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`
            }}
          ></div>
        ))}
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes spin-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        @keyframes fade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: translateY(0);
          }
          40% { 
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;