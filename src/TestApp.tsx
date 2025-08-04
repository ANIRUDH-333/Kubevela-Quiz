import React from 'react';

const TestApp: React.FC = () => {
    React.useEffect(() => {
        console.log('🧪 Test App mounted successfully!');

        // Test backend connection
        const testBackend = async () => {
            try {
                console.log('🔗 Testing backend connection...');
                const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
                const response = await fetch(`${apiUrl}/health`);
                const data = await response.json();
                console.log('✅ Backend response:', data);
            } catch (error) {
                console.error('❌ Backend connection failed:', error);
            }
        };

        testBackend();
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h1>🧪 Frontend Test Page</h1>
            <p>If you can see this, React is working!</p>
            <p>Check the console for backend connection test results.</p>
            <div style={{ background: '#f0f0f0', padding: '10px', margin: '10px 0' }}>
                <strong>Environment:</strong>
                <br />
                API URL: {import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')}
                <br />
                Mode: {import.meta.env.MODE}
                <br />
                Dev: {import.meta.env.DEV ? 'true' : 'false'}
            </div>
        </div>
    );
};

export default TestApp;
