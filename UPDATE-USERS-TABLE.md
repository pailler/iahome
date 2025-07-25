# Mise à jour pour utiliser la table users - IAHome

## 🔧 **Problème résolu**

L'erreur `relation "profiles" does not exist` indiquait que votre base de données utilise la table `users` au lieu de `profiles`. J'ai mis à jour le code pour utiliser la bonne structure.

## 📋 **Étapes de configuration**

### 1. **Exécuter le script SQL corrigé**

1. Allez dans votre dashboard Supabase
2. Ouvrez le "SQL Editor"
3. Copiez et exécutez le contenu du fichier `fix-users-table.sql`
4. Ce script va :
   - Vérifier la structure de votre table `users`
   - Ajouter une colonne `role` si elle n'existe pas
   - Configurer les politiques RLS correctement
   - Créer le trigger pour les nouveaux utilisateurs

### 2. **Vérifier la structure de la table users**

Après avoir exécuté le script, vérifiez que votre table `users` contient :
- `id` (UUID, clé primaire)
- `email` (TEXT)
- `role` (TEXT, avec contrainte 'user' ou 'admin')
- Autres colonnes existantes

### 3. **Tester la création d'admin**

1. Votre serveur est déjà démarré sur `http://localhost:4000`
2. Allez sur `http://localhost:4000/setup-admin`
3. Créez votre compte administrateur

## 🔍 **Vérifications**

### **Dans Supabase Dashboard :**

1. **Table Editor** → Vérifiez que `users` existe
2. **Authentication** → **Policies** → Vérifiez les politiques RLS
3. **SQL Editor** → Exécutez cette requête pour vérifier :
   ```sql
   SELECT table_name, column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'users' AND table_schema = 'public';
   ```

### **Dans votre application :**

1. **Console du navigateur** (F12) → Vérifiez les logs
2. **Terminal** → Vérifiez les logs du serveur Next.js

## 🚨 **Si vous avez encore des erreurs**

### **Erreur "column role does not exist"**
- Exécutez cette commande SQL dans Supabase :
  ```sql
  ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
  ```

### **Erreur "policy already exists"**
- C'est normal, les politiques existent déjà
- Vous pouvez ignorer ces erreurs

### **Erreur "function already exists"**
- C'est normal, les fonctions existent déjà
- Vous pouvez ignorer ces erreurs

## 📝 **Structure attendue de la table users**

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    -- autres colonnes existantes...
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ✅ **Test final**

1. Allez sur `http://localhost:4000/setup-admin`
2. Créez un compte avec :
   - Email : votre email
   - Mot de passe : minimum 6 caractères
3. Si la création réussit, vous devriez voir un message de succès
4. Connectez-vous sur `http://localhost:4000/login`
5. Accédez au panneau admin sur `http://localhost:4000/admin`

Votre application est maintenant configurée pour utiliser la table `users` existante ! 🎉 