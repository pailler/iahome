# Configuration du Premier Utilisateur Admin - IAHome

Ce guide vous explique comment configurer le premier utilisateur administrateur pour votre application IAHome.

## Prérequis

1. **Projet Supabase configuré** avec les variables d'environnement suivantes dans votre fichier `.env.local` :
   ```
   NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_supabase
   ```

2. **Base de données Supabase initialisée** avec le script SQL fourni.

## Étapes de Configuration

### 1. Configuration de la Base de Données

1. Connectez-vous à votre dashboard Supabase
2. Allez dans la section "SQL Editor"
3. Copiez et exécutez le contenu du fichier `database-setup.sql`
4. Vérifiez que les tables suivantes ont été créées :
   - `profiles` (gestion des utilisateurs et rôles)
   - `cartes` (templates et applications)
   - `abonnements` (gestion des abonnements)

### 2. Création du Premier Admin

1. **Démarrez votre application** :
   ```bash
   npm run dev
   ```

2. **Accédez à la page de configuration** :
   ```
   http://localhost:4000/setup-admin
   ```

3. **Remplissez le formulaire** avec :
   - Email : votre adresse email
   - Mot de passe : un mot de passe sécurisé (minimum 6 caractères)
   - Confirmation du mot de passe

4. **Cliquez sur "Créer le compte administrateur"**

5. **Vérifiez votre email** pour confirmer votre compte

### 3. Connexion en tant qu'Admin

1. **Allez sur la page de connexion** :
   ```
   http://localhost:4000/login
   ```

2. **Connectez-vous** avec vos identifiants

3. **Accédez au panneau d'administration** :
   ```
   http://localhost:4000/admin
   ```

## Fonctionnalités Admin Disponibles

Une fois connecté en tant qu'admin, vous pourrez :

- **Gérer les cartes/templates** : Ajouter, modifier, supprimer des templates
- **Voir tous les utilisateurs** : Consulter les profils des utilisateurs
- **Gérer les abonnements** : Voir et gérer les abonnements des utilisateurs

## Sécurité

- La page `/setup-admin` ne sera accessible qu'une seule fois
- Une fois le premier admin créé, cette page redirigera automatiquement vers `/login`
- Seuls les utilisateurs avec le rôle `admin` peuvent accéder au panneau d'administration

## Dépannage

### Erreur "Missing Supabase environment variables"
- Vérifiez que votre fichier `.env.local` contient les bonnes variables
- Redémarrez votre serveur de développement

### Erreur lors de la création du profil
- Vérifiez que le script SQL a été exécuté correctement
- Vérifiez que la table `profiles` existe dans votre base de données

### Erreur d'authentification
- Vérifiez que vous avez confirmé votre email
- Vérifiez que les paramètres d'authentification sont corrects dans Supabase

## Structure de la Base de Données

### Table `profiles`
- `id` : UUID (référence auth.users)
- `email` : Email de l'utilisateur
- `role` : 'user' ou 'admin'
- `created_at` : Date de création
- `updated_at` : Date de mise à jour

### Table `cartes`
- `id` : UUID unique
- `title` : Titre du template
- `description` : Description du template
- `category` : Catégorie (ex: "BUILDING BLOCKS")
- `price` : Prix en euros
- `youtube_url` : URL de la vidéo YouTube
- `created_at` : Date de création
- `updated_at` : Date de mise à jour

### Table `abonnements`
- `id` : UUID unique
- `user_id` : Référence vers l'utilisateur
- `type` : 'monthly' ou 'yearly'
- `status` : 'active', 'cancelled', ou 'expired'
- `start_date` : Date de début
- `end_date` : Date de fin
- `created_at` : Date de création
- `updated_at` : Date de mise à jour

## Support

Si vous rencontrez des problèmes, vérifiez :
1. Les logs de la console du navigateur
2. Les logs du serveur de développement
3. La configuration de votre projet Supabase 