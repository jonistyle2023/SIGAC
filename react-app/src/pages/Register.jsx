import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Shield, Mail, Lock, User, IdCard, Phone, MapPin,
    AlertCircle, Loader2, Info, CheckCircle, Eye, EyeOff, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const fieldClass = 'block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all';
const labelClass = 'block text-sm font-semibold text-gray-700 mb-1';

const Check = ({ ok, label }) => (
    <span className={`flex items-center gap-1 text-xs font-medium ${ok ? 'text-green-600' : 'text-gray-400'}`}>
        {ok
            ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
            : <X className="h-3.5 w-3.5 flex-shrink-0" />}
        {label}
    </span>
);

const Register = () => {
    const [formData, setFormData] = useState({
        cedula: '', nombre: '', apellido: '', email: '',
        telefono: '', direccion: '', password: '', confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const set = (field) => (e) => setFormData(p => ({ ...p, [field]: e.target.value }));

    const pw = formData.password;
    const pwChecks = {
        length:        pw.length >= 8,
        letter:        /[a-zA-Z]/.test(pw),
        numberOrSymbol:/[0-9!@#$%^&*()\-_+=.,;:'"<>?/\\[\]{}|`~]/.test(pw),
    };
    const pwStrong  = Object.values(pwChecks).every(Boolean);
    const pwTouched = pw.length > 0;
    const confirmOk = formData.confirmPassword.length > 0 && pw === formData.confirmPassword;
    const confirmBad = formData.confirmPassword.length > 0 && pw !== formData.confirmPassword;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!pwStrong) {
            setError('La contraseña no cumple los requisitos mínimos de seguridad.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setIsSubmitting(true);
        try {
            await register(formData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Error en el registro. Verifica los datos.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-10 px-5 sm:px-8">
            {/* Header */}
            <div className="mx-auto w-full max-w-md">
                <div className="flex justify-center">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
                        <Shield className="text-white w-8 h-8" />
                    </div>
                </div>
                <h2 className="mt-5 text-center text-2xl font-extrabold text-gray-900">
                    Crea tu cuenta ciudadana
                </h2>
                <p className="mt-1.5 text-center text-sm text-gray-500">
                    Únete a SIGAC para reportar problemas en tu comunidad
                </p>
            </div>

            <div className="mt-6 mx-auto w-full max-w-md space-y-4">
                {/* Info banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
                    <Info className="text-blue-500 w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">¿Para qué sirve registrarse?</p>
                        <ul className="space-y-0.5 text-blue-700 text-xs">
                            <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" /> Reportar problemas en tu barrio o ciudad</li>
                            <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" /> Hacer seguimiento en tiempo real de tus reportes</li>
                            <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" /> Ver cuándo se resuelve tu caso</li>
                        </ul>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white py-7 px-6 shadow-xl rounded-3xl border border-gray-100">
                    <form className="space-y-4" onSubmit={handleSubmit}>

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-xl flex items-start gap-3">
                                <AlertCircle className="text-red-500 w-4 h-4 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-red-700 font-medium">{error}</p>
                            </div>
                        )}

                        {/* ── Cédula ── */}
                        <div>
                            <label className={labelClass}>Cédula de identidad</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><IdCard className="h-4.5 w-4.5 text-gray-400" /></div>
                                <input name="cedula" type="text" required inputMode="numeric" maxLength={10}
                                    onChange={set('cedula')} value={formData.cedula}
                                    className={fieldClass} placeholder="Ej: 0901234567" />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">10 dígitos, sin guiones ni espacios</p>
                        </div>

                        {/* ── Nombre + Apellido ── */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Nombre</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-gray-400" /></div>
                                    <input name="nombre" type="text" required
                                        onChange={set('nombre')} value={formData.nombre}
                                        className={fieldClass} placeholder="Ej: Juan" />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Apellido</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-gray-400" /></div>
                                    <input name="apellido" type="text"
                                        onChange={set('apellido')} value={formData.apellido}
                                        className={fieldClass} placeholder="Ej: García" />
                                </div>
                            </div>
                        </div>

                        {/* ── Email ── */}
                        <div>
                            <label className={labelClass}>Correo electrónico</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-gray-400" /></div>
                                <input name="email" type="email" required
                                    onChange={set('email')} value={formData.email}
                                    className={fieldClass} placeholder="tucorreo@ejemplo.com" />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Con este correo iniciarás sesión</p>
                        </div>

                        {/* ── Teléfono ── */}
                        <div>
                            <label className={labelClass}>Teléfono <span className="text-gray-400 font-normal">(opcional)</span></label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-gray-400" /></div>
                                <input name="telefono" type="tel"
                                    onChange={set('telefono')} value={formData.telefono}
                                    className={fieldClass} placeholder="Ej: 0991234567" />
                            </div>
                        </div>

                        {/* ── Dirección ── */}
                        <div>
                            <label className={labelClass}>Dirección <span className="text-gray-400 font-normal">(opcional)</span></label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPin className="h-4 w-4 text-gray-400" /></div>
                                <input name="direccion" type="text"
                                    onChange={set('direccion')} value={formData.direccion}
                                    className={fieldClass} placeholder="Ej: Av. Amazonas N21-147 y Colón" />
                            </div>
                        </div>

                        {/* ── Separador seguridad ── */}
                        <div className="flex items-center gap-3 pt-1">
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                <Lock className="h-3 w-3" /> Seguridad
                            </span>
                            <div className="flex-1 h-px bg-gray-100" />
                        </div>

                        {/* ── Contraseña ── */}
                        <div>
                            <label className={labelClass}>Contraseña</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-gray-400" /></div>
                                <input name="password" type={showPassword ? 'text' : 'password'} required
                                    onChange={set('password')} value={formData.password}
                                    className={fieldClass} placeholder="Mínimo 8 caracteres" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>

                            {/* Requisitos */}
                            {pwTouched && (
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1">
                                    <Check ok={pwChecks.length}        label="8 caracteres" />
                                    <Check ok={pwChecks.letter}        label="Una letra" />
                                    <Check ok={pwChecks.numberOrSymbol} label="Un número o símbolo" />
                                </div>
                            )}
                        </div>

                        {/* ── Confirmar contraseña ── */}
                        <div>
                            <label className={labelClass}>Confirmar contraseña</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-gray-400" /></div>
                                <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} required
                                    onChange={set('confirmPassword')} value={formData.confirmPassword}
                                    className={`${fieldClass} ${confirmBad ? 'border-red-300 focus:ring-red-400' : confirmOk ? 'border-green-300 focus:ring-green-400' : ''}`}
                                    placeholder="Repite tu contraseña" />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(v => !v)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    tabIndex={-1}
                                    aria-label={showConfirm ? 'Ocultar contraseña' : 'Ver contraseña'}
                                >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {confirmOk  && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Las contraseñas coinciden</p>}
                            {confirmBad && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><X className="h-3 w-3" /> Las contraseñas no coinciden</p>}
                        </div>

                        {/* ── Submit ── */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all disabled:opacity-70"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Crear mi cuenta'}
                            </button>
                        </div>
                    </form>
                </div>

                <p className="text-center text-sm text-gray-500">
                    ¿Ya tienes una cuenta?{' '}
                    <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
                        Inicia sesión aquí
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
