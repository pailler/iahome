const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkModulePrices() {
  console.log('🔍 Analyse des prix des modules...\n');
  
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
    
    // Analyse des prix
    console.log('📊 Analyse des prix:');
    console.log('─'.repeat(80));
    
    const modulesByPriceType = {
      free: [],
      paid: [],
      unknown: []
    };
    
    modules.forEach(module => {
      const priceStr = module.price?.toString().toLowerCase() || '';
      
      // Détection des modules gratuits
      if (priceStr.includes('gratuit') || 
          priceStr.includes('free') || 
          priceStr === '0' || 
          priceStr === '0.00' ||
          priceStr.includes('€0') ||
          priceStr.includes('0€')) {
        modulesByPriceType.free.push(module);
      }
      // Détection des modules payants
      else if (priceStr.includes('€') || 
               priceStr.includes('euros') || 
               priceStr.includes('euro') ||
               /\d+\.\d+/.test(priceStr) ||
               /\d+,\d+/.test(priceStr)) {
        modulesByPriceType.paid.push(module);
      }
      // Prix non reconnus
      else {
        modulesByPriceType.unknown.push(module);
      }
    });
    
    console.log(`🆓 Modules gratuits (${modulesByPriceType.free.length}):`);
    modulesByPriceType.free.forEach(m => {
      console.log(`   • ${m.title}: "${m.price}"`);
    });
    console.log();
    
    console.log(`💰 Modules payants (${modulesByPriceType.paid.length}):`);
    modulesByPriceType.paid.forEach(m => {
      console.log(`   • ${m.title}: "${m.price}"`);
    });
    console.log();
    
    if (modulesByPriceType.unknown.length > 0) {
      console.log(`❓ Prix non reconnus (${modulesByPriceType.unknown.length}):`);
      modulesByPriceType.unknown.forEach(m => {
        console.log(`   • ${m.title}: "${m.price}"`);
      });
      console.log();
    }
    
    // Test de la logique de filtrage actuelle
    console.log('🧪 Test de la logique de filtrage actuelle:');
    console.log('─'.repeat(80));
    
    const testFilterLogic = (module) => {
      const priceStr = module.price?.toString().toLowerCase() || '';
      
      // Logique actuelle (problématique)
      const currentLogic = {
        isFree: priceStr === '0' || priceStr === '0.00',
        isPaid: parseFloat(priceStr) > 0
      };
      
      // Logique corrigée
      const correctedLogic = {
        isFree: priceStr.includes('gratuit') || 
                priceStr.includes('free') || 
                priceStr === '0' || 
                priceStr === '0.00' ||
                priceStr.includes('€0') ||
                priceStr.includes('0€'),
        isPaid: priceStr.includes('€') || 
                priceStr.includes('euros') || 
                priceStr.includes('euro') ||
                /\d+\.\d+/.test(priceStr) ||
                /\d+,\d+/.test(priceStr)
      };
      
      return { currentLogic, correctedLogic };
    };
    
    modules.forEach(module => {
      const { currentLogic, correctedLogic } = testFilterLogic(module);
      
      if (currentLogic.isFree !== correctedLogic.isFree || currentLogic.isPaid !== correctedLogic.isPaid) {
        console.log(`⚠️  ${module.title}:`);
        console.log(`   Prix: "${module.price}"`);
        console.log(`   Logique actuelle: gratuit=${currentLogic.isFree}, payant=${currentLogic.isPaid}`);
        console.log(`   Logique corrigée: gratuit=${correctedLogic.isFree}, payant=${correctedLogic.isPaid}`);
        console.log();
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

checkModulePrices(); 