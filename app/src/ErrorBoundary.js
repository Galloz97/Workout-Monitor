import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      errorMessage: error.toString()
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '30px',
          textAlign: 'center',
          backgroundColor: '#fff'
        }}>
          <h2 style={{ color: 'red' }}>⚠️ Si è verificato un errore</h2>
          <p style={{ 
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '5px',
            margin: '20px 0',
            fontFamily: 'monospace'
          }}>
            {this.state.errorMessage}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔄 Ricarica
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
