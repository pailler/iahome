const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction utilitaire pour déterminer si un module est gratuit (copiée du code)
const isModuleFree = (module) => {
  const priceStr = module.price?.toString().toLowerCase() || '';
  return priceStr === '0' || priceStr === '0.00' || priceStr.includes('gratuit') || priceStr.includes('free');
};

const isModulePaid = (module) => {
  const priceStr = module.price?.toString().toLowerCase() || '';
  const isFree = isModuleFree(module);
  return !isFree && (priceStr.includes('€') || priceStr.includes('euros') || priceStr.includes('euro') || /\d+\.\d+/.test(priceStr) || /\d+,\d+/.test(priceStr));
};

async function testFiltering() {
  console.log('🧪 Test de la logique de filtrage...\n');
  
  try {
    // Récupération de tous les modules
    const { data: modules, error } = await supabase
      .from('modules')
      .select('id, title, price');
    
    if (error) {
      console.error('❌ Erreur lors de la récupération:', error);
      return;
    }
    
    console.log(`✅ ${modules.length} modules récupérés\n`);
    
    // Test de la logique de filtrage
    console.log('📊 Test de la logique de filtrage:');
    console.log('─'.repeat(80));
    
    const freeModules = modules.filter(isModuleFree);
    const paidModules = modules.filter(isModulePaid);
    const unclassifiedModules = modules.filter(m => !isModuleFree(m) && !isModulePaid(m));
    
    console.log(`🆓 Modules gratuits (${freeModules.length}):`);
    freeModules.forEach(m => {
      console.log(`   • ${m.title}: "${m.price}"`);
    });
    console.log();
    
    console.log(`💰 Modules payants (${paidModules.length}):`);
    paidModules.forEach(m => {
      console.log(`   • ${m.title}: "${m.price}"`);
    });
    console.log();
    
    if (unclassifiedModules.length > 0) {
      console.log(`❓ Modules non classés (${unclassifiedModules.length}):`);
      unclassifiedModules.forEach(m => {
        console.log(`   • ${m.title}: "${m.price}"`);
      });
      console.log();
    }
    
    // Test de simulation du filtrage
    console.log('🎯 Simulation du filtrage "modules gratuits":');
    console.log('─'.repeat(80));
    
    const priceFilter = 'free';
    const filteredModules = modules.filter(module => {
      const matchesPrice = priceFilter === 'all' || 
        (priceFilter === 'free' && isModuleFree(module)) ||
        (priceFilter === 'paid' && isModulePaid(module));
      
      return matchesPrice;
    });
    
    console.log(`✅ Modules filtrés (filtre "gratuit"): ${filteredModules.length}`);
    filteredModules.forEach(m => {
      console.log(`   • ${m.title}: "${m.price}"`);
    });
    
    // Vérification
    if (filteredModules.length === freeModules.length) {
      console.log('\n✅ SUCCÈS: Le filtrage fonctionne correctement !');
    } else {
      console.log('\n❌ ERREUR: Le filtrage ne fonctionne pas correctement');
      console.log(`   Attendu: ${freeModules.length} modules gratuits`);
      console.log(`   Obtenu: ${filteredModules.length} modules filtrés`);
    }
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

testFiltering(); 