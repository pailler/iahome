# Guide de Configuration Supabase - IAHome

## Étape 1 : Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Cliquez sur "Start your project"
3. Connectez-vous avec GitHub ou créez un compte
4. Cliquez sur "New project"
5. Choisissez votre organisation
6. Donnez un nom à votre projet (ex: "iahome")
7. Créez un mot de passe pour la base de données
8. Choisissez une région proche de vous
9. Cliquez sur "Create new project"

## Étape 2 : Récupérer les clés d'API

1. Une fois le projet créé, allez dans "Settings" (⚙️) dans la sidebar
2. Cliquez sur "API"
3. Copiez :
   - **Project URL** (ex: `https://your-project-id.supabase.co`)
   - **anon public** key (commence par `eyJ...`)

## Étape 3 : Configurer les variables d'environnement

1. Dans votre projet local, créez un fichier `.env.local`
2. Ajoutez vos variables :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Remplacez `your-project-id` et `your-anon-key-here` par vos vraies valeurs

## Étape 4 : Exécuter le script SQL

### Méthode 1 : Copier-coller le script complet

1. Dans Supabase, allez dans "SQL Editor" dans la sidebar
2. Cliquez sur "New query"
3. Copiez le contenu du fichier `supabase-setup.sql`
4. Collez-le dans l'éditeur
5. Cliquez sur "Run" (ou Ctrl+Enter)

### Méthode 2 : Exécuter par sections (recommandé)

Si vous avez des erreurs, exécutez le script par sections :

#### Section 1 : Tables
```sql
-- Créer la table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table des cartes/templates
CREATE TABLE IF NOT EXISTS cartes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    youtube_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table des abonnements
CREATE TABLE IF NOT EXISTS abonnements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('monthly', 'yearly')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Section 2 : RLS
```sql
-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartes ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonnements ENABLE ROW LEVEL SECURITY;
```

#### Section 3 : Politiques (exécutez une par une)
```sql
-- Politiques pour profiles
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

```sql
-- Politiques pour cartes
CREATE POLICY "Anyone can view cartes" ON cartes
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert cartes" ON cartes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update cartes" ON cartes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete cartes" ON cartes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

```sql
-- Politiques pour abonnements
CREATE POLICY "Users can view their own subscriptions" ON abonnements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON abonnements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON abonnements
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON abonnements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

#### Section 4 : Fonctions et triggers
```sql
-- Créer la fonction pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer les triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cartes_updated_at BEFORE UPDATE ON cartes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_abonnements_updated_at BEFORE UPDATE ON abonnements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

```sql
-- Créer la fonction pour les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger pour les nouveaux utilisateurs
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

#### Section 5 : Données et index
```sql
-- Insérer des cartes d'exemple
INSERT INTO cartes (title, description, category, price, youtube_url) VALUES
('Canvas Building Framework', 'Framework complet pour construire des applications web modernes', 'BUILDING BLOCKS', 29.99, 'https://www.youtube.com/watch?v=example1'),
('AI Chat Interface', 'Interface de chat intelligente avec intégration IA', 'BUILDING BLOCKS', 19.99, 'https://www.youtube.com/watch?v=example2'),
('E-commerce Template', 'Template complet pour boutique en ligne', 'BUILDING BLOCKS', 39.99, 'https://www.youtube.com/watch?v=example3')
ON CONFLICT DO NOTHING;

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_cartes_category ON cartes(category);
CREATE INDEX IF NOT EXISTS idx_abonnements_user_id ON abonnements(user_id);
CREATE INDEX IF NOT EXISTS idx_abonnements_status ON abonnements(status);
```

## Étape 5 : Vérifier la configuration

1. Allez dans "Table Editor" dans Supabase
2. Vérifiez que vous voyez les tables :
   - `profiles`
   - `cartes`
   - `abonnements`
3. Cliquez sur `cartes` pour voir les données d'exemple

## Étape 6 : Configurer l'authentification

1. Allez dans "Authentication" dans la sidebar
2. Cliquez sur "Settings"
3. Vérifiez que "Enable email confirmations" est activé
4. Optionnel : Désactivez "Enable email confirmations" pour les tests

## Étape 7 : Tester l'application

1. Redémarrez votre serveur de développement :
   ```bash
   npm run dev
   ```

2. Allez sur `http://localhost:4000/setup-admin`

3. Créez votre premier compte administrateur

## Dépannage

### Erreur "syntax error at or near '-'"
- Assurez-vous de ne pas copier les commentaires avec des tirets doubles
- Utilisez le fichier `supabase-setup.sql` au lieu de `database-setup.sql`

### Erreur "relation does not exist"
- Exécutez les sections dans l'ordre
- Vérifiez que chaque section s'est bien exécutée avant de passer à la suivante

### Erreur "policy already exists"
- C'est normal, les politiques existent déjà
- Vous pouvez ignorer ces erreurs

### Erreur "function already exists"
- C'est normal, les fonctions existent déjà
- Vous pouvez ignorer ces erreurs 