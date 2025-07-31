const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configuration Supabase
const supabaseUrl = 'https://xemtoyzcihmncbrlsmhr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlbXRveXpjaWhtbmNicmxzbWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDUzMDUsImV4cCI6MjA2NTk4MTMwNX0.afcRGhlB5Jj-7kgCV6IzUDRdGUQkHkm1Fdl1kzDdj6M';

console.log('🔍 Création d\'un magic link pour Stable Diffusion...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createStableDiffusionMagicLink() {
  try {
    // Récupérer un user_id existant
    const { data: users } = await supabase.from('users').select('id').limit(1);
    if (!users || users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
      return;
    }
    
    const userId = users[0].id;
    console.log('👤 Utilisateur trouvé:', userId);

    // Données spécifiques pour Stable Diffusion
    const stableDiffusionData = {
      userId: userId,
      subscriptionId: 'stablediffusion-sub-789',
      moduleName: 'stablediffusion',
      userEmail: 'admin@stablediffusion.local',
      redirectUrl: 'https://stablediffusion.regispailler.fr'
    };

    // Générer un token sécurisé
    const token = crypto.randomBytes(32).toString('hex');
    
    // Définir l'expiration (24 heures)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    console.log('🔍 Token généré:', token);
    console.log('🔍 Expiration:', expiresAt.toISOString());
    console.log('🔍 Module: stablediffusion');
    console.log('🔍 Credentials: admin/Rasulova75');

    // Insérer le magic link dans Supabase
    console.log('\n📝 Insertion dans la table magic_links...');
    const { data, error } = await supabase
      .from('magic_links')
      .insert({
        token,
        user_id: stableDiffusionData.userId,
        subscription_id: stableDiffusionData.subscriptionId,
        module_name: stableDiffusionData.moduleName,
        user_email: stableDiffusionData.userEmail,
        redirect_url: stableDiffusionData.redirectUrl,
        expires_at: expiresAt.toISOString(),
        is_used: false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur insertion magic link:', error);
      return;
    }

    console.log('✅ Magic link Stable Diffusion créé avec succès !');
    console.log('📋 Détails du magic link:');
    console.log('   - ID:', data.id);
    console.log('   - Token:', token);
    console.log('   - User ID:', data.user_id);
    console.log('   - Module: stablediffusion');
    console.log('   - Email:', data.user_email);
    console.log('   - Expiration:', data.expires_at);
    console.log('   - Utilisé:', data.is_used);
    console.log('   - Credentials: admin/Rasulova75');

    // Construire l'URL du magic link
    const localUrl = `http://localhost:8021/api/proxy-access?token=${token}&module=stablediffusion`;
    const productionUrl = `https://votre-domaine.com/api/proxy-access?token=${token}&module=stablediffusion`;
    
    console.log('\n🔗 URLs du magic link Stable Diffusion:');
    console.log('   Local:', localUrl);
    console.log('   Production:', productionUrl);

    console.log('\n🎨 Ce magic link permet d\'accéder à Stable Diffusion avec authentification automatique !');
    console.log('🔐 Les credentials admin/Rasulova75 sont automatiquement injectés.');

  } catch (error) {
    console.error('❌ Erreur lors de la création du magic link:', error);
  }
}

// Exécuter le script
createStableDiffusionMagicLink()
  .then(() => {
    console.log('\n🎉 Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }); 