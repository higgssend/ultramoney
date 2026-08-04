import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role, Cargo, Employee, ApiKey } from '../../types';
import { insforge } from '../../lib/insforge';
import { useToast } from '../ToastContext';

interface AuthContextType {
  currentUser: any | null;
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
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  useEffect(() => {
    let unmounted = false;
    let authSub: any;

    const initAuth = async () => {
      try {
        const empSession = localStorage.getItem('employee_session');
        if (empSession) {
          const empData = JSON.parse(empSession);
          if (!unmounted) setCurrentUser(empData);
          setIsLoadingAuth(false);
          return;
        }

        const { data: { session } } = await insforge.auth.getSession();
        
        if (!unmounted) {
          if (session?.user) {
            setCurrentUser({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.email,
              roleId: session.user.user_metadata?.roleId || 'Admin',
              username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
              roleIds: session.user.user_metadata?.roleIds || []
            });
          } else {
            setCurrentUser(null);
          }
          setIsLoadingAuth(false);
        }

        const { data: authListener } = insforge.auth.onAuthStateChange(async (event, session) => {
          if (unmounted) return;
          if (event === 'SIGNED_IN' && session?.user) {
            setCurrentUser({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.email,
              roleId: session.user.user_metadata?.roleId || 'Admin',
              username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
              roleIds: session.user.user_metadata?.roleIds || []
            });
          } else if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
            localStorage.removeItem('employee_session');
          }
        });
        authSub = authListener.subscription;

      } catch (error) {
        console.error("Auth init error:", error);
        setIsLoadingAuth(false);
      }
    };

    initAuth();

    return () => {
      unmounted = true;
      if (authSub) authSub.unsubscribe();
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
          insforge.database.from('user_profiles').select('*, usuario_roles ( role_id )').order('created_at'),
          insforge.database.from('api_keys').select('*').order('created_at', { ascending: false }),
          insforge.database.from('employees').select('*').order('created_at', { ascending: false })
        ]);

        if (rolesRes.data) setRoles(rolesRes.data);
        if (cargosRes.data) setCargos(cargosRes.data);
        if (usersRes.data) {
           const mappedUsers = usersRes.data.map((u: any) => ({
             id: u.id, name: u.name, username: u.username, email: u.email, employeeId: u.employee_id,
             roleIds: u.usuario_roles ? u.usuario_roles.map((ur: any) => ur.role_id) : [],
             created_at: u.created_at
           }));
           setUsers(mappedUsers);
        }
        if (apiKeysRes.data) setApiKeys(apiKeysRes.data.map((k: any) => ({ ...k, key: k.api_key })));
        if (employeesRes.data) setEmployees(employeesRes.data);

      } catch (error) {
        console.error("Error fetching auth data:", error);
      }
    };
    fetchData();
  }, [currentUser]);

  const login = (_identifier: string, _password: string): boolean => false; // Supabase handles this via UI
  
  const logout = async () => {
    await insforge.auth.signOut();
    localStorage.removeItem('employee_session');
    setCurrentUser(null);
    window.location.href = '/login';
  };

  const logoutSystem = async () => {
    await insforge.auth.signOut();
    localStorage.removeItem('employee_session');
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
      const empUser = {
        id: data.lender_id || data.id,
        email: `${username}@ultramoney.local`,
        name: data.name,
        roleId: data.role === 'Admin' ? 'Admin' : 'Employee',
        isEmployee: true,
        employeeData: data
      };
      localStorage.setItem('employee_session', JSON.stringify(empUser));
      setCurrentUser(empUser);
      return true;
    }
    return false;
  };

  const registerUser = async (user: User) => {
    try {
      const { data, error: authError } = await insforge.auth.signUp({
        email: user.email || `${user.username}@app.ultramoney.com`,
        password: (user as any).password || '123456',
        options: { data: { name: user.name, username: user.username, roleId: user.roleId || 'Employee', roleIds: user.roleIds || [] } }
      });
      if (authError) { addToast(authError.message, 'error'); return; }
      
      const newUserId = data.user?.id;
      if (newUserId) {
        await insforge.database.from('user_profiles').insert({
          id: newUserId, lender_id: currentUser?.id, name: user.name, username: user.username, email: user.email, employee_id: user.employeeId
        });
        if (user.roleIds && user.roleIds.length > 0) {
           const roleInserts = user.roleIds.map(rid => ({ user_id: newUserId, role_id: rid }));
           await insforge.database.from('usuario_roles').insert(roleInserts);
        }
        setUsers(prev => [...prev, { ...user, id: newUserId }]);
        addToast("Usuario creado", "success");
      }
    } catch (e: any) { addToast(e.message, 'error'); }
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
      addToast("Usuario actualizado", "success");
    }
  };

  const addRole = async (role: Role) => {
    const { data, error } = await insforge.database.from('roles').insert({
      lender_id: currentUser?.id, name: role.name, description: role.description, permissions: role.permissions
    }).select().single();
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
    const { data, error } = await insforge.database.from('cargos').insert({
      lender_id: currentUser?.id, name: cargo.name, description: cargo.description, permissions: cargo.permissions
    }).select().single();
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
      lender_id: currentUser?.id, name: employee.name, role: employee.role, phone: employee.phone,
      assigned_route: employee.assignedRoute, performance: employee.performance, active_routes: employee.activeRoutes,
      collections: employee.collections, sucursal_id: employee.sucursalId, cargo_id: employee.cargoId,
      username: employee.username, employee_pin: employee.employeePin
    };
    const { data, error } = await insforge.database.from('employees').insert(payload).select().single();
    if (data && !error) {
      const newEmp: Employee = {
        id: data.id, name: data.name, role: data.role, phone: data.phone, assignedRoute: data.assigned_route,
        performance: data.performance, activeRoutes: data.active_routes, collections: data.collections,
        sucursalId: data.sucursal_id, cargoId: data.cargo_id, username: data.username, employeePin: data.employee_pin
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
    const payload = { lender_id: currentUser?.id, name, api_key: newKey, last_used: null };
    const { data, error } = await insforge.database.from('api_keys').insert(payload).select().single();
    if (data && !error) {
      setApiKeys(prev => [{ ...data, key: data.api_key }, ...prev]);
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
