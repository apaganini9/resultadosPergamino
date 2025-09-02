import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, Vote } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Por favor, complete todos los campos');
      setIsLoading(false);
      return;
    }

    try {
      const success = await login(email, password);
      
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Credenciales inválidas. Verifique su email y contraseña.');
      }
    } catch (error) {
      setError('Error de conexión. Verifique que el servidor esté funcionando.');
    } finally {
      setIsLoading(false);
    }
  };

  const credencialesPrueba = [
    { email: 'admin@pergamino.gov.ar', password: 'admin123', rol: 'Administrador' },
    { email: 'operador1@pergamino.gov.ar', password: 'operador123', rol: 'Operador' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
            <Vote className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Centro de Cómputos Electoral
          </h1>
          <p className="text-blue-200">
            Pergamino - Buenos Aires
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="usuario@pergamino.gov.ar"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-white font-medium transition-all ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="ml-2">Ingresando...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <h3 className="text-white font-medium mb-3 text-center">Credenciales de Prueba</h3>
          <div className="space-y-2">
            {credencialesPrueba.map((cred, index) => (
              <div
                key={index}
                className="cursor-pointer hover:bg-white/10 p-2 rounded transition-colors"
                onClick={() => {
                  setEmail(cred.email);
                  setPassword(cred.password);
                }}
              >
                <div className="text-xs text-blue-200">
                  <strong className="text-white">{cred.rol}:</strong> {cred.email}
                </div>
                <div className="text-xs text-blue-300 font-mono">
                  Contraseña: {cred.password}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-300 text-center mt-2">
            Click en cualquier credencial para auto-completar
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;