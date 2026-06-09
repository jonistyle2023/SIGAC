import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, MessageSquare, BarChart3, Users, ArrowRight } from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Shield className="text-white w-6 h-6" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 tracking-tight">SIGAC</span>
                </div>
                <div className="flex items-center gap-6">
                    <Link to="/login" className="text-gray-600 font-medium hover:text-blue-600 transition-colors">Iniciar Sesión</Link>
                    <Link to="/register" className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                        Registrarse
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main>
                <section className="px-8 py-20 lg:py-32 max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 mb-8 leading-tight">
                        Gestión Inteligente de <br />
                        <span className="text-blue-600">Incidencias Ciudadanas</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Conectamos a los ciudadanos con sus instituciones para construir ciudades más seguras, limpias y eficientes mediante inteligencia artificial.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-blue-100">
                            Empezar ahora
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#features" className="w-full sm:w-auto px-8 py-4 text-gray-600 font-bold text-lg hover:text-blue-600 transition-colors">
                            Saber más
                        </a>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="bg-gray-50 py-24 px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid md:grid-cols-3 gap-12">
                            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-blue-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                                    <MessageSquare className="text-blue-600 w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Reportes Simples</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Registra incidencias en segundos con fotos y ubicación GPS exacta.
                                </p>
                            </div>
                            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-green-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                                    <Shield className="text-green-600 w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">IA Clasificadora</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Nuestro sistema analiza la gravedad y tipo de incidencia automáticamente para una respuesta rápida.
                                </p>
                            </div>
                            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-purple-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                                    <BarChart3 className="text-purple-600 w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Transparencia Total</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Sigue el estado de tu reporte en tiempo real desde que es asignado hasta su resolución.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-12 px-8 border-t border-gray-100">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-gray-500">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold">SIGAC</span>
                    </div>
                    <p>© 2026 SIGAC. Sistema de Gestión de Incidencias Ciudadanas.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
