import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role, Cargo, Employee, ApiKey } from '../../types';
import type { UserProfileDB, ApiKeyDB } from '../../types.db';
import { insforge } from '../../lib/insforge';
import { useToast } from '../ToastContext';
import { logger } from '../../utils/logger';

interface AuthContextType {
  currentUser: User | null;
  isLoadingAuth: boolean;
  users: User[];
  roles: Role[];
  cargos: Cargo[];
  employees: Employee[];
  apiKeys: ApiKey[];
  
  login: (identifier: string, password: string) => boolean;
  logout: () => void;
  loginEmployee: (username: string, pin: string) => Promise<boolean>;
  logoutSystem: () => void;
  registerUser: (user: User) => void;
  updateUser: (user: User) => void;
  addRole: (role: Role) => void;
  updateRole: (id: string, role: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  addCargo: (cargo: Cargo) => void;
  updateCargo: (id: string, cargo: Partial<Cargo>) => void;
  deleteCargo: (id: string) => void;
  addEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  generateApiKey: (name: string) => void;
  deleteApiKey: (id: string) => void;
  updateApiKey: (id: string, newName: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();

  // Lazy-initialize user state directly from persistent storage to avoid auth flash / session loss on PWA or tab reopen
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const empSession = localStorage.getItem('employee_session');
      if (empSession) {
        const empData = JSON.parse(empSession) as User;
        if (empData && empData.id) return empData;
      }
      const saved = localStorage.getItem('um_user_session');
      if (saved) {
        const parsed = JSON.parse(saved) as User;
        if (parsed && parsed.id) return parsed;
      }
    } catch {
      // ignore JSON parse error
    }
    return null;
  });

  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const hasLocalSession = !!(localStorage.getItem('employee_session') || localStorage.getItem('um_user_session'));
    return !hasLocalSession;
  });

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  useEffect(() => {
    let unmounted = false;
    let authSub: (() => void) | { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      try {
        // 1. Employee PIN session check
        const empSession = localStorage.getItem('employee_session');
        if (empSession) {
          try {
            const empData = JSON.parse(empSession) as User;
            if (empData && empData.id) {
              if (!unmounted) {
                setCurrentUser(empData);
                setIsLoadingAuth(false);
              }
              return;
            }
          } catch {
            localStorage.removeItem('employee_session');
          }
        }

        // 2. Set saved access token if present
        const savedAccessToken = localStorage.getItem('um_access_token');
        const savedRefreshToken = localStorage.getItem('um_refresh_token');

        if (savedAccessToken) {
          try {
            insforge.setAccessToken(savedAccessToken);
          } catch (e) {
            console.warn("Unable to set initial access token:", e);
          }
        }

        // 3. Current user verification from InsForge backend
        type InsforgeUser = {
          id: string;
          email?: string;
          user_metadata?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
          profile?: { name?: string; roleId?: string; roleIds?: string[] };
        };

        let activeUser: User | null = null;

        if (savedAccessToken) {
          const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
          if (!userError && userData?.user) {
            const u = userData.user as InsforgeUser;
            const meta = u.user_metadata || u.metadata || {};
            activeUser = {
              id: u.id,
              email: u.email || '',
              name: (u.profile?.name || meta.name || u.email || 'Usuario') as string,
              roleId: (meta.roleId || u.profile?.roleId || 'Admin') as string,
              username: (meta.username || u.email?.split('@')[0] || 'usuario') as string,
              roleIds: (meta.roleIds || []) as string[],
              status: 'Active'
            };
          }
        }

        // 4. If access token was expired/invalid, attempt refresh
        if (!activeUser && savedRefreshToken) {
          try {
            const { data: refreshData, error: refreshErr } = await insforge.auth.refreshSession({
              refreshToken: savedRefreshToken
            });
            if (!refreshErr && refreshData?.accessToken) {
              localStorage.setItem('um_access_token', refreshData.accessToken);
              insforge.setAccessToken(refreshData.accessToken);
              if (refreshData.refreshToken) {
                localStorage.setItem('um_refresh_token', refreshData.refreshToken);
              }
              if (refreshData.user) {
                const u = refreshData.user as InsforgeUser;
                const meta = (u.metadata || u.user_metadata || {}) as Record<string, unknown>;
                const profileObj = u.profile;
                activeUser = {
                  id: u.id,
                  email: u.email || '',
                  name: (profileObj?.name || meta.name || u.email || 'Usuario') as string,
                  roleId: (meta.roleId || profileObj?.roleId || 'Admin') as string,
                  username: (meta.username || u.email?.split('@')[0] || 'usuario') as string,
                  roleIds: (Array.isArray(meta.roleIds) ? meta.roleIds : []) as string[],
                  status: 'Active'
                };
              }
            }
          } catch (refErr) {
            logger.warn("Token refresh attempt failed:", refErr);
          }
        }

        // 5. Apply session or clear stale state
        if (!unmounted) {
          if (activeUser) {
            setCurrentUser(activeUser);
            localStorage.setItem('um_user_session', JSON.stringify(activeUser));
          } else {
            // No valid active session on backend: clear local storage to prevent ghost state
            localStorage.removeItem('um_user_session');
            localStorage.removeItem('um_access_token');
            localStorage.removeItem('um_refresh_token');
            try {
              insforge.setAccessToken(null);
            } catch {
              // ignore
            }
            setCurrentUser(null);
          }
          setIsLoadingAuth(false);
        }

        // 6. Listen for auth state changes
        type AuthCallback = (event: string, session: { user?: { id: string; email?: string; user_metadata?: Record<string, unknown>; metadata?: Record<string, unknown>; profile?: { name?: string; roleId?: string } } } | null) => void;
        const unsubscribe = (insforge.auth.onAuthStateChange as (cb: AuthCallback) => () => void)(async (event, session) => {
          if (unmounted) return;
          const u = session?.user;
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && u) {
            const meta = u.user_metadata || u.metadata || {};
            const loggedInUser: User = {
              id: u.id,
              email: u.email || '',
              name: (u.profile?.name || meta.name || u.email || 'Usuario') as string,
              roleId: (meta.roleId || u.profile?.roleId || 'Admin') as string,
              username: (meta.username || u.email?.split('@')[0] || 'usuario') as string,
              roleIds: (Array.isArray(meta.roleIds) ? meta.roleIds : []) as string[],
              status: 'Active'
            };
            setCurrentUser(loggedInUser);
            localStorage.setItem('um_user_session', JSON.stringify(loggedInUser));
          } else if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
            localStorage.removeItem('employee_session');
            localStorage.removeItem('um_user_session');
            localStorage.removeItem('um_access_token');
            localStorage.removeItem('um_refresh_token');
            try {
              insforge.setAccessToken(null);
            } catch {
              // ignore
            }
          }
        });
        authSub = unsubscribe;

      } catch (error) {
        logger.error("Auth init error:", error);
        if (!unmounted) {
          setIsLoadingAuth(false);
        }
      }
    };

    initAuth();

    return () => {
      unmounted = true;
      if (typeof authSub === 'function') {
        authSub();
      } else if (authSub?.unsubscribe) {
        authSub.unsubscribe();
      }
    };
  }, []);

  // Fetch admin data if logged in
  useEffect(() => {
    if (!currentUser) {
      setUsers([]); setRoles([]); setCargos([]); setEmployees([]); setApiKeys([]);
      return;
    }

    const fetchData = async () => {
      try {
        const [rolesRes, cargosRes, usersRes, apiKeysRes, employeesRes] = await Promise.all([
          insforge.database.from('roles').select('*').order('name'),
          insforge.database.from('cargos').select('*').order('name'),
          insforge.database.from('user_profiles').select('*').order('created_at'),
          insforge.database.from('api_keys').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
          insforge.database.from('employees').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false })
        ]);

        if (rolesRes.data) setRoles(rolesRes.data);
        if (cargosRes.data) setCargos(cargosRes.data);
        if (usersRes.data) {
           const mappedUsers = (usersRes.data as UserProfileDB[]).map((u) => ({
             id: u.id, name: u.name || u.email || 'Usuario', username: u.username,
             email: u.email, employeeId: u.employee_id,
             status: (u.status || 'Active') as User['status'],
             roleIds: u.usuario_roles ? u.usuario_roles.map(ur => ur.role_id) : [],
             created_at: u.created_at
           }));
           setUsers(mappedUsers);
        }
        if (apiKeysRes.data) setApiKeys((apiKeysRes.data as ApiKeyDB[]).map((k) => ({ id: k.id, name: k.name, key: k.key, createdAt: k.created_at })));
        if (employeesRes.data) setEmployees(employeesRes.data);

      } catch (error) {
        logger.error("Error fetching auth data:", error);
      }
    };
    fetchData();
  }, [currentUser]);

  const login = (_identifier: string, _password: string): boolean => false; // Supabase handles this via UI
  
  const logout = async () => {
    try {
      await insforge.auth.signOut();
    } catch (e) {
      console.warn("Signout error:", e);
    }
    try {
      insforge.setAccessToken(null);
    } catch {
      // ignore
    }
    localStorage.removeItem('employee_session');
    localStorage.removeItem('um_user_session');
    localStorage.removeItem('um_access_token');
    localStorage.removeItem('um_refresh_token');
    localStorage.removeItem('um_notifications');
    document.documentElement.classList.remove('dark');
    setCurrentUser(null);
    window.location.href = '/login';
  };

  const logoutSystem = async () => {
    try {
      await insforge.auth.signOut();
    } catch (e) {
      console.warn("Signout error:", e);
    }
    try {
      insforge.setAccessToken(null);
    } catch {
      // ignore
    }
    localStorage.removeItem('employee_session');
    localStorage.removeItem('um_user_session');
    localStorage.removeItem('um_access_token');
    localStorage.removeItem('um_refresh_token');
    localStorage.removeItem('um_notifications');
    document.documentElement.classList.remove('dark');
    setCurrentUser(null);
    window.location.href = '/login';
  };

  const loginEmployee = async (username: string, pin: string) => {
    const { data, error } = await insforge.database
      .from('employees')
      .select('*')
      .eq('username', username)
      .eq('employee_pin', pin)
      .single();

    if (data && !error) {
      const empUser: User = {
        id: data.lender_id || data.id,
        email: `${username}@ultramoney.local`,
        name: data.name,
        roleId: data.role === 'Admin' ? 'Admin' : 'Employee',
        isEmployee: true,
        employeeData: data,
        status: 'Active'
      };
      localStorage.setItem('employee_session', JSON.stringify(empUser));
      setCurrentUser(empUser);
      return true;
    }
    return false;
  };

  const registerUser = async (user: User) => {
    try {
      // InsForge SDK: signUp method shape not fully typed; cast to expected signature
      type SignUpFn = (opts: { email: string; password: string; name: string }) => Promise<{ data: { user?: { id: string } }; error: { message: string } | null }>;
      const { data, error: authError } = await (insforge.auth.signUp as SignUpFn)({
        email: user.email || `${user.username}@app.ultramoney.com`,
        password: user.password || '123456',
        name: user.name
      });
      if (authError) { addToast(authError.message, 'error'); return; }
      
      const newUserId = data.user?.id;
      if (newUserId) {
        await insforge.database.from('user_profiles').insert([{
          id: newUserId, lender_id: currentUser?.id, name: user.name, username: user.username, email: user.email, employee_id: user.employeeId
        }]);
        if (user.roleIds && user.roleIds.length > 0) {
           const roleInserts = user.roleIds.map(rid => ({ user_id: newUserId, role_id: rid }));
           await insforge.database.from('usuario_roles').insert(roleInserts);
        }
        setUsers(prev => [...prev, { ...user, id: newUserId }]);
        addToast("Usuario creado", "success");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      addToast(msg, 'error');
    }
  };

  const updateUser = async (updatedUser: User) => {
    const { error } = await insforge.database.from('user_profiles').update({
      name: updatedUser.name, username: updatedUser.username, email: updatedUser.email, employee_id: updatedUser.employeeId
    }).eq('id', updatedUser.id);
    if (!error) {
      if (updatedUser.roleIds && updatedUser.roleIds.length > 0) {
         await insforge.database.from('usuario_roles').delete().eq('user_id', updatedUser.id);
         const roleInserts = updatedUser.roleIds.map(rid => ({ user_id: updatedUser.id, role_id: rid }));
         await insforge.database.from('usuario_roles').insert(roleInserts);
      }
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (currentUser && currentUser.id === updatedUser.id) {
        setCurrentUser(prev => prev ? { ...prev, name: updatedUser.name, email: updatedUser.email } : null);
      }
      addToast("Usuario actualizado", "success");
    }
  };

  const addRole = async (role: Role) => {
    const { data, error } = await insforge.database.from('roles').insert([{
      lender_id: currentUser?.id, name: role.name, description: role.description, permissions: role.permissions
    }]).select().single();
    if (data && !error) setRoles(prev => [...prev, data]);
  };

  const updateRole = async (id: string, role: Partial<Role>) => {
    const { error } = await insforge.database.from('roles').update(role).eq('id', id);
    if (!error) setRoles(prev => prev.map(r => r.id === id ? { ...r, ...role } : r));
  };

  const deleteRole = async (id: string) => {
    const { error } = await insforge.database.from('roles').delete().eq('id', id);
    if (!error) setRoles(prev => prev.filter(r => r.id !== id));
  };

  const addCargo = async (cargo: Cargo) => {
    const { data, error } = await insforge.database.from('cargos').insert([{
      lender_id: currentUser?.id, name: cargo.name, description: cargo.description, permissions: cargo.permissions
    }]).select().single();
    if (data && !error) setCargos(prev => [...prev, data]);
  };

  const updateCargo = async (id: string, cargo: Partial<Cargo>) => {
    const { error } = await insforge.database.from('cargos').update(cargo).eq('id', id);
    if (!error) setCargos(prev => prev.map(c => c.id === id ? { ...c, ...cargo } : c));
  };

  const deleteCargo = async (id: string) => {
    const { error } = await insforge.database.from('cargos').delete().eq('id', id);
    if (!error) setCargos(prev => prev.filter(c => c.id !== id));
  };

  const addEmployee = async (employee: Employee) => {
    const payload = {
      lender_id: currentUser?.id, name: employee.name, role: employee.role || 'Employee', phone: employee.phone,
      assigned_route: employee.assignedRoute, performance: employee.performance, active_routes: employee.activeRoutes,
      collections: employee.collections, sucursal_id: employee.sucursalId, cargo_id: employee.cargoId,
      username: employee.username, employee_pin: employee.employeePin
    };
    const { data, error } = await insforge.database.from('employees').insert([payload]).select().single();
    if (data && !error) {
      const newEmp: Employee = {
        id: data.id, name: data.name, phone: data.phone, assignedRoute: data.assigned_route,
        performance: data.performance, activeRoutes: data.active_routes, collections: data.collections,
        cargoId: data.cargo_id, username: data.username, employeePin: data.employee_pin
      };
      setEmployees(prev => [newEmp, ...prev]);
      addToast("Empleado agregado", "success");
    }
  };

  const deleteEmployee = async (id: string) => {
    const { error } = await insforge.database.from('employees').delete().eq('id', id);
    if (!error) {
      setEmployees(prev => prev.filter(e => e.id !== id));
      addToast("Empleado eliminado", "success");
    }
  };

  const generateApiKey = async (name: string) => {
    const newKey = `um_${Array.from({length: 32}, () => Math.random().toString(36)[2]).join('')}`;
    
    let finalUserId = currentUser?.id;
    if (currentUser?.employeeData) {
        const empLenderId = (currentUser.employeeData as { lender_id?: string; employer_id?: string }).lender_id || (currentUser.employeeData as { lender_id?: string; employer_id?: string }).employer_id;
        if (empLenderId) {
            finalUserId = empLenderId;
        }
    }

    const payload = { user_id: finalUserId, name, key: newKey, last_used: null };
    const { data, error } = await insforge.database.from('api_keys').insert([payload]).select().single();
    if (error) {
      logger.error("Error generating API Key:", error);
      addToast("Error al generar API Key: " + error.message, "error");
    } else if (data) {
      setApiKeys(prev => [{ ...data, createdAt: data.created_at }, ...prev]);
      addToast("API Key generada", "success");
    }
  };

  const updateApiKey = async (id: string, newName: string) => {
    const { error } = await insforge.database.from('api_keys').update({ name: newName }).eq('id', id);
    if (!error) setApiKeys(prev => prev.map(k => k.id === id ? { ...k, name: newName } : k));
  };

  const deleteApiKey = async (id: string) => {
    const { error } = await insforge.database.from('api_keys').delete().eq('id', id);
    if (!error) setApiKeys(prev => prev.filter(k => k.id !== id));
  };

  return (
    <AuthContext.Provider value={{
      currentUser, isLoadingAuth, users, roles, cargos, employees, apiKeys,
      login, logout, loginEmployee, logoutSystem, registerUser, updateUser,
      addRole, updateRole, deleteRole, addCargo, updateCargo, deleteCargo,
      addEmployee, deleteEmployee, generateApiKey, updateApiKey, deleteApiKey
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
