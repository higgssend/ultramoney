import re

path = r'c:\Users\Dell\Downloads\ultramoney\pages\Settings.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import
content = content.replace("import { insforge } from '../lib/insforge';", "import { insforge } from '../lib/insforge';\nimport { LoanProductsTab } from '../components/LoanProductsTab';")

# 2. Add to activeTab type
content = content.replace("const [activeTab, setActiveTab] = useState<'company' | 'roles' | 'users' | 'audit' | 'security' | 'backup' | 'api'>('company');", "const [activeTab, setActiveTab] = useState<'company' | 'products' | 'roles' | 'users' | 'audit' | 'security' | 'backup' | 'api'>('company');")

# 3. Add to sidebar
button_code = """
           <button 
             onClick={() => setActiveTab('products')}
             className={`p-3 rounded-lg text-left font-medium flex items-center gap-3 transition-colors ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
           >
             <Briefcase className="w-5 h-5" /> Productos de Préstamo
           </button>
"""
content = content.replace("           <button \n             onClick={() => setActiveTab('security')}", button_code + "           <button \n             onClick={() => setActiveTab('security')}")

# Add Briefcase icon if not imported
if "Briefcase" not in content:
    content = content.replace("Activity, Shield, ShieldCheck, Eye, EyeOff,", "Activity, Shield, ShieldCheck, Eye, EyeOff, Briefcase,")
    content = content.replace("Shield, Users, Activity, Database,", "Shield, Users, Activity, Database, Briefcase,")
    content = content.replace("Database, Key, CreditCard,", "Database, Key, CreditCard, Briefcase,")
    content = content.replace("UserPlus, Settings as SettingsIcon, Save,", "UserPlus, Settings as SettingsIcon, Save, Briefcase,")

# 4. Add rendering
render_code = """
          {activeTab === 'products' && (
              <LoanProductsTab />
          )}

"""
content = content.replace("          {/* Security & Profile Settings */}", render_code + "          {/* Security & Profile Settings */}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Settings.tsx patched successfully!")
