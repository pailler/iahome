const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configuration Supabase
const supabaseUrl = 'https://xemtoyzcihmncbrlsmhr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlbXRveXpjaWhtbmNicmxzbWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDUzMDUsImV4cCI6MjA2NTk4MTMwNX0.afcRGhlB5Jj-7kgCV6IzUDRdGUQkHkm1Fdl1kzDdj6M';

console.log('🔍 Création d\'un magic link de test pour localhost...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createLocalMagicLink() {
  try {
    // Récupérer un user_id existant
    const { data: users } = await supabase.from('users').select('id').limit(1);
    if (!users || users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
      return;
    }
    
    const userId = users[0].id;
    console.log('👤 Utilisateur trouvé:', userId);

    // Données de test
    const testData = {
      userId: userId,
      subscriptionId: 'test-sub-456',
      moduleName: 'test-module',
      userEmail: 'test@example.com',
      redirectUrl: null // Pas de redirection pour tester l'URL locale
    };

    // Générer un token sécurisé
    const token = crypto.randomBytes(32).toString('hex');
    
    // Définir l'expiration (24 heures)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    console.log('🔍 Token généré:', token);
    console.log('🔍 Expiration:', expiresAt.toISOString());

    // Insérer le magic link dans Supabase
    console.log('\n📝 Insertion dans la table magic_links...');
    const { data, error } = await supabase
      .from('magic_links')
      .insert({
        token,
        user_id: testData.userId,
        subscription_id: testData.subscriptionId,
        module_name: testData.moduleName,
        user_email: testData.userEmail,
        redirect_url: testData.redirectUrl,
        expires_at: expiresAt.toISOString(),
        is_used: false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur insertion magic link:', error);
      return;
    }

    console.log('✅ Magic link créé avec succès !');
    console.log('📋 Détails du magic link:');
    console.log('   - ID:', data.id);
    console.log('   - Token:', token);
    console.log('   - User ID:', data.user_id);
    console.log('   - Module:', data.module_name);
    console.log('   - Email:', data.user_email);
    console.log('   - Expiration:', data.expires_at);
    console.log('   - Utilisé:', data.is_used);

    // Construire l'URL du magic link pour localhost
    const localUrl = `http://localhost:8021/access/${testData.moduleName}?token=${token}&user=${testData.userId}`;
    const productionUrl = `https://home.regispailler.fr/access/${testData.moduleName}?token=${token}&user=${testData.userId}`;
    
    console.log('\n🔗 URLs du magic link:');
    console.log('   Local:', localUrl);
    console.log('   Production:', productionUrl);

    // Vérifier que le magic link a bien été créé
    console.log('\n🔍 Vérification de la création...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .single();

    if (verifyError) {
      console.error('❌ Erreur lors de la vérification:', verifyError);
    } else {
      console.log('✅ Magic link vérifié dans la base de données');
      console.log('   - Trouvé dans la table:', !!verifyData);
      console.log('   - Token correspond:', verifyData.token === token);
    }

    // Afficher les informations pour tester
    console.log('\n🧪 Pour tester ce magic link:');
    console.log('1. Assurez-vous que le serveur Next.js est démarré (npm run dev)');
    console.log('2. Copiez l\'URL locale ci-dessus');
    console.log('3. Ouvrez-la dans un navigateur');
    console.log('4. Vérifiez que l\'accès fonctionne');
    console.log('5. Le magic link sera marqué comme "utilisé" après validation');

    // Afficher la requête SQL pour vérifier manuellement
    console.log('\n📊 Requête SQL pour vérifier manuellement:');
    console.log(`SELECT * FROM magic_links WHERE token = '${token}';`);

  } catch (error) {
    console.error('❌ Erreur lors de la création du magic link:', error);
  }
}

// Exécuter le script
createLocalMagicLink()
  .then(() => {
    console.log('\n🎉 Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });