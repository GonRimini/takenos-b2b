"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";

// 👇 agregá esto
interface DbUser {
  id: string;
  email: string;
  name: string;
  last_name: string;
  company_id: string;
  company: {
    id: string;
    name: string;
    // otros campos de la tabla companies si los necesitás
  } | null;
  nationality: string;
  // después le agregás los campos reales de tu tabla public.users
  [key: string]: unknown;
}

type EnrichedUser = User & {
  dbUser?: DbUser; // acá va lo que viene de public.users
};

interface AuthContextType {
  user: EnrichedUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<EnrichedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const loadUserWithDbData = async (authUser: User | null) => {
    if (!authUser) {
      setUser(null);
      return;
    }

    console.log(authUser);

    const { data, error } = await supabase
      .from("users") // 👈 tu tabla en schema public
      .select("*, company:companies(*)")
      .eq("id", authUser.id)
      .single();

    console.log("Loaded DB user data:", data);
    if (error) {
      // si falla el select, al menos guardamos el user “pelado”
      console.log("Error loading DB user data:", error.message);
      setUser({ ...authUser } as EnrichedUser);
      return;
    }

    const dbUser = data as DbUser;

    setUser({
      ...authUser,
      dbUser, // 👈 acá queda todo lo de public.users dentro de user
    } as EnrichedUser);
  };

  useEffect(() => {
    // Obtener sesión inicial SOLO si no estamos haciendo logout
    const getInitialSession = async () => {
      if (isSigningOut) {
        setLoading(false);
        return;
      }

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        // Si hay error al obtener la sesión, dejamos al usuario como no autenticado
        if (error) {
          console.error("❌ Error obteniendo sesión:", error);
          setUser(null);
          setSession(null);
        } else if (!session) {
          // Si no hay sesión, dejamos al usuario como no autenticado
          setUser(null);
          setSession(null);
        } else {
          // Sesión válida, continuar normalmente
          setSession(session);
          await loadUserWithDbData(session.user ?? null);
        }
      } catch (error) {
        console.error("❌ Error inesperado en getInitialSession:", error);
        setUser(null);
        setSession(null);
      } finally {
        // Pase lo que pase, dejar de mostrar el loading
        setLoading(false);
      }
    };

    getInitialSession();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Si estamos haciendo logout, ignorar cambios de sesión temporales
      if (isSigningOut && event !== "SIGNED_OUT") {
        return;
      }

      // Si no hay sesión (o se ha cerrado), limpiar todo
      if (!session) {
        setSession(null);
        setUser(null);
        setIsSigningOut(false);
        setLoading(false);
        return;
      }

      // Actualizar sesión y usuario
      setSession(session);
      await loadUserWithDbData(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isSigningOut]);

  // Manejo de rutas protegidas
  useEffect(() => {
    if (loading) {
      return;
    }

    // Rutas públicas que no requieren autenticación
    const publicRoutes = ["/login", "/auth/callback"];

    // Si no hay usuario Y no estamos en una ruta pública
    if (!user && !publicRoutes.includes(pathname)) {
      router.push("/login");
      return;
    }

    // Si hay usuario Y estamos en login, redirigir al dashboard
    if (user && pathname === "/login") {
      router.push("/dashboard");
      return;
    }
  }, [user, loading, pathname, router]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    // Marcar que estamos haciendo logout para evitar consultas de sesión
    setIsSigningOut(true);

    // Forzar limpieza inmediata del estado
    setUser(null);
    setSession(null);
    setLoading(false);

    // Limpiar TODO el localStorage y sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // Hacer signOut de Supabase DESPUÉS de limpiar el estado local
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch (err) {}

    return { error: null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  // Mostrar loading mientras se inicializa la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6d37d5] mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
