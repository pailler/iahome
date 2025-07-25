# Guide de configuration Stripe - IAHome

## 1. Créer un compte Stripe

1. Allez sur [stripe.com](https://stripe.com) et créez un compte
2. Complétez la vérification de votre compte

## 2. Récupérer les clés API

### En mode Test (recommandé pour le développement)

1. Connectez-vous à votre [Dashboard Stripe](https://dashboard.stripe.com)
2. Assurez-vous d'être en mode "Test" (toggle en haut à droite)
3. Allez dans **Developers** > **API keys**
4. Copiez les clés suivantes :
   - **Publishable key** (commence par `pk_test_`)
   - **Secret key** (commence par `sk_test_`)

### En mode Production (pour le déploiement)

1. Basculez en mode "Live" dans le dashboard
2. Récupérez les clés de production :
   - **Publishable key** (commence par `pk_live_`)
   - **Secret key** (commence par `sk_live_`)

## 3. Configurer les variables d'environnement

1. Créez ou modifiez le fichier `.env.local` à la racine du projet
2. Ajoutez vos clés Stripe :

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique
```

## 4. Tester le paiement

### Cartes de test Stripe

Utilisez ces cartes pour tester les paiements :

- **Paiement réussi** : `4242 4242 4242 4242`
- **Paiement refusé** : `4000 0000 0000 0002`
- **CVC incorrect** : `4000 0000 0000 0127`
- **Date d'expiration incorrecte** : `4000 0000 0000 0069`

**Informations communes pour les tests :**
- Date d'expiration : n'importe quelle date future (ex: 12/25)
- CVC : n'importe quels 3 chiffres (ex: 123)
- Code postal : n'importe quoi (ex: 12345)

## 5. Webhooks (optionnel pour le développement)

Pour une intégration complète en production, configurez les webhooks Stripe pour :
- Confirmer les paiements
- Gérer les abonnements
- Traiter les remboursements

## 6. Déploiement

Lors du déploiement en production :
1. Basculez vers les clés de production
2. Configurez les webhooks Stripe
3. Testez avec de vraies cartes

## 7. Sécurité

⚠️ **Important :**
- Ne partagez JAMAIS votre clé secrète
- Utilisez toujours HTTPS en production
- Validez les paiements côté serveur
- Gérez les erreurs de paiement

## Support

- [Documentation Stripe](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Elements](https://stripe.com/docs/stripe-js) 