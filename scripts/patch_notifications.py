import os
import re

file_path = r"c:\Users\Dell\Downloads\ultramoney\context\StoreContext.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix notifications persistence
old_notifications_state = """  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: '1', title: 'Bienvenido', message: 'Bienvenido a Ultramoney. Aqu aparecerǭn tus alertas.', date: new Date().toISOString(), read: false, type: 'info' }
  ]);"""

# Safe regex replacement in case of encoding differences in the text
new_notifications_state = """  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('um_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: '1', title: 'Bienvenido', message: 'Bienvenido a Ultramoney. Aqu apareceran tus alertas.', date: new Date().toISOString(), read: false, type: 'info' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('um_notifications', JSON.stringify(notifications));
  }, [notifications]);
"""

content = re.sub(r"  // Notifications State\s+const \[notifications, setNotifications\] = useState<AppNotification\[\]>\(\[[\s\S]*?\]\);", new_notifications_state, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("StoreContext.tsx patched for notifications persistence")
