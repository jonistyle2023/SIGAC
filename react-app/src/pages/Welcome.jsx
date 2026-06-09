import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogOut, CheckCircle2, LayoutDashboard, PlusCircle, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Welcome = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Simple Dashboard Navbar */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <Shield className="text-blue-600 w-6 h-6" />
                    <span className="text-xl font-bold text-gray-900 tracking-tight">SIGAC Dashboard</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right mr-4 hidden sm:block">
                        <p className="text-sm font-bold text-gray-900">{user?.nombre} {user?.apellido}</p>
                        <p className="text-xs text-gray-500">{user?.rol}</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Cerrar Sesión</span>
                    </button>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-12">
                {/* Welcome Card */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8 overflow-hidden relative">
                    <div className="relative z-10">
                        <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                            <CheckCircle2 className="text-green-600 w-10 h-10" />
                        </div>
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                            ¡Ingreso Exitoso!
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-lg leading-relaxed">
                            Bienvenido, <span className="font-bold text-gray-900">{user?.nombre}</span>. Has accedido correctamente al sistema de gestión ciudadana.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100">
                                <PlusCircle className="w-5 h-5" />
                                Reportar Incidencia
                            </button>
                            <button className="bg-white text-gray-700 border border-gray-200 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
                                <History className="w-5 h-5" />
                                Ver mis reportes
                            </button>
                        </div>
                    </div>
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
                </div>

                {/* Status Quick View */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-gray-500 text-sm font-medium mb-1">Incidencias Activas</p>
                        <p className="text-3xl font-extrabold text-gray-900">0</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-gray-500 text-sm font-medium mb-1">En Proceso</p>
                        <p className="text-3xl font-extrabold text-blue-600">0</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-gray-500 text-sm font-medium mb-1">Resueltas</p>
                        <p className="text-3xl font-extrabold text-green-600">0</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Welcome;
