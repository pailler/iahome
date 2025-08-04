const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Définition des sous-titres pour chaque module
const subtitles = {
  'Stable diffusion': 'Générez des images avec l\'intelligence artificielle',
  'PDF Pro+': 'Créez et modifiez des documents PDF professionnels',
  'Bannière HA': 'Créez des bannières publicitaires avec l\'IA',
  'AI Assistant': 'Assistant IA pour vos tâches quotidiennes',
  'Cogstudio': 'Studio de création avec IA avancée',
  'Invoke': 'Générez des images avec Invoke AI',
  'Librespeed': 'Testez la vitesse de votre connexion internet',
  'PDF+': 'Traitement et conversion de documents PDF',
  'PSitransfer': 'Transfert de fichiers sécurisé et rapide',
  'QR codes dynamiques': 'Générez des QR codes dynamiques personnalisés',
  'ruinedfooocus': 'Interface Fooocus pour Stable Diffusion',
  'SDnext': 'Interface SDNext pour la génération d\'images',
  'Video Editor': 'Éditeur vidéo en ligne avec IA'
};

async function updateModulesSubtitles() {
  console.log('🔧 Mise à jour des sous-titres des modules...\n');
  
  try {
    // Récupération de tous les modules
    console.log('1. Récupération des modules...');
    const { data: modules, error } = await supabase
      .from('modules')
      .select('id, title, subtitle');
    
    if (error) {
      console.error('❌ Erreur lors de la récupération:', error);
      return;
    }
    
    console.log(`✅ ${modules.length} modules récupérés\n`);
    
    // Mise à jour des sous-titres
    console.log('2. Mise à jour des sous-titres...');
    let updatedCount = 0;
    
    for (const module of modules) {
      const newSubtitle = subtitles[module.title];
      
      if (newSubtitle && (!module.subtitle || module.subtitle.trim() === '')) {
        console.log(`   📝 Mise à jour: ${module.title}`);
        console.log(`      Ancien: "${module.subtitle || 'Aucun'}"`);
        console.log(`      Nouveau: "${newSubtitle}"`);
        
        const { error: updateError } = await supabase
          .from('modules')
          .update({ subtitle: newSubtitle })
          .eq('id', module.id);
        
        if (updateError) {
          console.error(`   ❌ Erreur pour ${module.title}:`, updateError);
        } else {
          console.log(`   ✅ Succès pour ${module.title}`);
          updatedCount++;
        }
        console.log();
      } else if (newSubtitle) {
        console.log(`   ⏭️  ${module.title}: Déjà un sous-titre présent`);
      } else {
        console.log(`   ⚠️  ${module.title}: Pas de sous-titre défini`);
      }
    }
    
    console.log(`\n📊 Résumé: ${updatedCount} modules mis à jour`);
    
    // Vérification finale
    console.log('\n3. Vérification finale...');
    const { data: finalModules, error: finalError } = await supabase
      .from('modules')
      .select('title, subtitle')
      .order('title');
    
    if (finalError) {
      console.error('❌ Erreur lors de la vérification:', finalError);
      return;
    }
    
    console.log('\n📋 État final des modules:');
    console.log('─'.repeat(80));
    
    const modulesWithSubtitles = finalModules.filter(m => m.subtitle);
    const modulesWithoutSubtitles = finalModules.filter(m => !m.subtitle);
    
    console.log(`📊 Modules avec sous-titres: ${modulesWithSubtitles.length}/${finalModules.length}`);
    console.log(`📊 Modules sans sous-titres: ${modulesWithoutSubtitles.length}/${finalModules.length}\n`);
    
    if (modulesWithSubtitles.length > 0) {
      console.log('📝 Modules avec sous-titres:');
      modulesWithSubtitles.forEach(m => {
        console.log(`   • ${m.title}: "${m.subtitle}"`);
      });
    }
    
    if (modulesWithoutSubtitles.length > 0) {
      console.log('\n❌ Modules sans sous-titres:');
      modulesWithoutSubtitles.forEach(m => {
        console.log(`   • ${m.title}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

updateModulesSubtitles(); 