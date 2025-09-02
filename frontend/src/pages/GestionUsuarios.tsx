import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  Shield,
  User,
  Mail
} from 'lucide-react';

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'OPERADOR' | 'CONSULTOR';
  activo: boolean;
  createdAt: string;
  actasCargadas?: number;
}

const GestionUsuarios: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    password: '',
    rol: 'OPERADOR' as 'ADMIN' | 'OPERADOR' | 'CONSULTOR'
  });

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      // Simular datos por ahora
      const usuariosSimulados: Usuario[] = [
        {
          id: 1,
          email: 'admin@pergamino.gov.ar',
          nombre: 'Administrador del Sistema',
          rol: 'ADMIN',
          activo: true,
          createdAt: '2024-01-15',
          actasCargadas: 0
        },
        {
          id: 2,
          email: 'operador1@pergamino.gov.ar',
          nombre: 'Juan Pérez',
          rol: 'OPERADOR',
          activo: true,
          createdAt: '2024-01-20',
          actasCargadas: 12
        },
        {
          id: 3,
          email: 'operador2@pergamino.gov.ar',
          nombre: 'María González',
          rol: 'OPERADOR',
          activo: true,
          createdAt: '2024-01-22',
          actasCargadas: 8
        }
      ];
      
      setUsuarios(usuariosSimulados);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.rol === 'ADMIN') {
      cargarUsuarios();
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para crear/editar usuario
    console.log('Crear/editar usuario:', formData);
    setShowModal(false);
    setEditingUser(null);
    setFormData({ email: '', nombre: '', password: '', rol: 'OPERADOR' });
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario);
    setFormData({
      email: usuario.email,
      nombre: usuario.nombre,
      password: '',
      rol: usuario.rol
    });
    setShowModal(true);
  };

  const handleToggleActive = async (usuario: Usuario) => {
    console.log('Toggle active:', usuario.id);
    // Aquí iría la lógica para activar/desactivar
  };

  if (currentUser?.rol !== 'ADMIN') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600">Solo los administradores pueden acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-600">Administrar usuarios del sistema electoral</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actas Cargadas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registro</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{usuario.nombre}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {usuario.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    usuario.rol === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                    usuario.rol === 'OPERADOR' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {usuario.rol}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {usuario.activo ? (
                      <>
                        <UserCheck className="h-3 w-3 mr-1" />
                        Activo
                      </>
                    ) : (
                      <>
                        <UserX className="h-3 w-3 mr-1" />
                        Inactivo
                      </>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {usuario.actasCargadas || 0}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(usuario.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(usuario)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(usuario)}
                      className={`${usuario.activo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                    >
                      {usuario.activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña {editingUser && '(dejar en blanco para no cambiar)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={!editingUser}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({...formData, rol: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="OPERADOR">Operador</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="CONSULTOR">Consultor</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setFormData({ email: '', nombre: '', password: '', rol: 'OPERADOR' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUsuarios;