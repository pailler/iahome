const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testModulesSubtitles() {
  console.log('🔍 Test des sous-titres des modules...\n');
  
  try {
    // Test de connexion
    console.log('1. Test de connexion...');
    const { data: testData, error: testError } = await supabase
      .from('modules')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erreur de connexion:', testError);
      return;
    }
    console.log('✅ Connexion réussie\n');
    
    // Récupération de tous les modules
    console.log('2. Récupération des modules...');
    const { data: modules, error } = await supabase
      .from('modules')
      .select('*');
    
    if (error) {
      console.error('❌ Erreur lors de la récupération:', error);
      return;
    }
    
    console.log(`✅ ${modules.length} modules récupérés\n`);
    
    // Analyse des sous-titres
    console.log('3. Analyse des sous-titres:');
    console.log('─'.repeat(80));
    
    const modulesWithSubtitles = modules.filter(m => m.subtitle);
    const modulesWithoutSubtitles = modules.filter(m => !m.subtitle);
    
    console.log(`📊 Modules avec sous-titres: ${modulesWithSubtitles.length}/${modules.length}`);
    console.log(`📊 Modules sans sous-titres: ${modulesWithoutSubtitles.length}/${modules.length}\n`);
    
    if (modulesWithSubtitles.length > 0) {
      console.log('📝 Modules avec sous-titres:');
      modulesWithSubtitles.forEach(m => {
        console.log(`   • ${m.title}: "${m.subtitle}"`);
      });
      console.log();
    }
    
    if (modulesWithoutSubtitles.length > 0) {
      console.log('❌ Modules sans sous-titres:');
      modulesWithoutSubtitles.forEach(m => {
        console.log(`   • ${m.title}`);
      });
      console.log();
    }
    
    // Vérification de la structure des données
    console.log('4. Structure des données:');
    if (modules.length > 0) {
      const sampleModule = modules[0];
      console.log('Champs disponibles:', Object.keys(sampleModule));
      console.log('Exemple de module:', JSON.stringify(sampleModule, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

testModulesSubtitles(); 