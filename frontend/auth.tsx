import { useState, useEffect } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { Terminal } from './app';
import ky from 'ky';

const AuthPage = () => {
    const [accessKey, setAccessKey] = useState(localStorage.getItem('access_key') ?? '');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        if (accessKey) {
            tryLogin();
        } else {
            setIsLoading(false);
        }
    }, []);

    const tryLogin = async () => {
        const key = accessKey;
        if (!key.trim()) {
            setError('Access key is required');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        setError('');




        try {
            const response = await ky.post("/login", { throwHttpErrors: false, headers: { authorization: key } });

            if (response.status === 200) {
                // Store the access key in localStorage
                localStorage.setItem('access_key', key);
                setIsAuthenticated(true);
            } else {
                setError('Invalid access key');
                // Remove invalid key from localStorage
                localStorage.removeItem('access_key');
            }
        } catch (err) {
            setError('Connection failed. Server may be unavailable.');
            // Remove key from localStorage on connection error (might be stale)
            localStorage.removeItem('access_key');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: any) => {
        e.preventDefault();
        await tryLogin();
    };

    // Render Terminal component if authenticated
    if (isAuthenticated) {
        return <Terminal accessKey={accessKey} />;
    }

    // Render loading state during initial authentication attempt
    if (isLoading && !error) {
        return (
            <div className="flex h-screen bg-gray-900 text-green-400 font-mono">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-400 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-green-300">Authenticating...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-900 text-green-400 font-mono">
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <Lock size={48} className="text-green-300" />
                        </div>
                        <h1 className="text-2xl font-bold text-green-300 mb-2">
                            Bakerysoft Server Console
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Enter your access key to continue
                        </p>
                    </div>

                    {/* Auth Form */}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="accessKey" className="block text-sm font-medium text-green-300 mb-2">
                                Access Key
                            </label>
                            <input
                                id="accessKey"
                                type="password"
                                value={accessKey}
                                onChange={(e) => setAccessKey(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleLogin(e);
                                    }
                                }}
                                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-3 text-green-400 focus:outline-none focus:border-green-400 transition-colors"
                                placeholder="Enter your access key..."
                                autoComplete="off"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center space-x-2 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Login Button */}
                        <button
                            onClick={handleLogin}
                            disabled={isLoading}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded text-white font-semibold transition-colors flex items-center justify-center space-x-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <Lock size={16} />
                                    <span>Access Console</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center space-x-2 text-xs text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                            <span>Secure Connection</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-green-400 to-green-500 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-green-400 to-green-500 opacity-50"></div>
        </div>
    );
};

export default AuthPage;