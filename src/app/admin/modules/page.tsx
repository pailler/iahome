'use client';
import { useEffect, useState } from "react";
import { supabase } from "../../../utils/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumb from "../../../components/Breadcrumb";

interface Module {
  id: string;
  title: string;
  description: string;
  subtitle?: string;
  category: string;
  price: number;
  youtube_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface TokenInfo {
  moduleName: string;
  baseUrl: string;
  accessUrl: string;
  permissions: string[];
  expiresIn: string;
  jwtSecret: string;
}

export default function AdminModulesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession?.user) {
        setCurrentUser(currentSession.user);
        checkAdminStatus(currentSession.user.id);
      } else {
        setIsAdmin(false);
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setCurrentUser(session?.user || null);
        if (session?.user) {
          checkAdminStatus(session.user.id);
        } else {
          setIsAdmin(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      console.log('🔍 Vérification du statut admin pour:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (error) {
        console.error('❌ Erreur lors de la vérification admin:', error);
        setIsAdmin(false);
        return;
      }
      const userIsAdmin = data?.role === 'admin';
      console.log('✅ Statut admin:', userIsAdmin, 'Role:', data?.role);
      setIsAdmin(userIsAdmin);
    } catch (err) {
      console.error('❌ Erreur inattendue lors de la vérification admin:', err);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      console.log('🚀 Chargement des modules car utilisateur est admin');
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      console.log('📡 Tentative de chargement des données depuis Supabase...');
      
      // Charger les modules avec toutes leurs données
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .order('title', { ascending: true });

      if (modulesError) {
        console.error('❌ Erreur lors du chargement des modules:', modulesError);
        alert('Erreur lors du chargement des modules: ' + modulesError.message);
      } else {
        console.log('✅ Modules chargés:', modulesData?.length || 0);
        console.log('📊 Données brutes des modules:', modulesData);
        
                 // Traiter les données pour s'assurer que tous les champs existent
         const processedModules = (modulesData || []).map(module => ({
          id: module.id,
          title: module.title || '',
          description: module.description || '',
          subtitle: module.subtitle || '',
          category: module.category || '',
          price: module.price || 0,
          youtube_url: module.youtube_url || '',
          created_at: module.created_at,
          updated_at: module.updated_at
         }));
        
        console.log('🔧 Modules traités avec tous les champs:', processedModules);
        setModules(processedModules);
        
        // Afficher un message de succès si des modules sont trouvés
        if (processedModules.length > 0) {
          console.log('✅ Données des modules chargées avec succès');
        } else {
          console.log('ℹ️ Aucun module trouvé dans la base de données');
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      alert('Erreur lors du chargement des données: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditModule = (module: Module) => {
    console.log('🔧 Édition du module:', module);
    console.log('🔧 Données complètes du module:', JSON.stringify(module, null, 2));
    
         // S'assurer que toutes les données sont présentes
     const completeModule = {
      id: module.id,
      title: module.title || '',
      description: module.description || '',
      subtitle: module.subtitle || '',
      category: module.category || '',
      price: module.price || 0,
      youtube_url: module.youtube_url || '',
      created_at: module.created_at,
      updated_at: module.updated_at
     };
    
    console.log('🔧 Module complet pour édition:', completeModule);
    setEditingModule(completeModule);
    setIsAddingModule(false);
    setShowModal(true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce module ?')) {
      try {
                 // Supprimer le module directement
         const { error } = await supabase
           .from('modules')
           .delete()
           .eq('id', moduleId);
        
        if (error) {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression du module');
        } else {
          fetchData();
          alert('Module supprimé avec succès');
        }
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleAddModule = () => {
    setEditingModule(null);
    setIsAddingModule(true);
    setShowModal(true);
  };

  const handleManageModule = (module: Module) => {
    console.log('🔧 Gestion du module:', module.title);
    console.log('🔧 Données complètes du module:', JSON.stringify(module, null, 2));
    console.log('🔧 handleManageModule appelée - début de la fonction');
    
    // S'assurer que toutes les données sont présentes
    const completeModule = {
      id: module.id,
      title: module.title || '',
      description: module.description || '',
      subtitle: module.subtitle || '',
      category: module.category || '',
      price: module.price || 0,
      youtube_url: module.youtube_url || '',
      created_at: module.created_at,
      updated_at: module.updated_at
    };
    

    
    // Rediriger vers la page de gestion spécifique au module
    // Pour l'instant, on ouvre le modal d'édition
    // Plus tard, on pourra créer des pages spécifiques pour chaque module
    setEditingModule(completeModule);
    setIsAddingModule(false);
    setShowModal(true);
  };

  const checkServiceStatus = async (moduleTitle: string) => {
    try {
      console.log('🔍 Vérification du statut pour:', moduleTitle);
      
      if (moduleTitle === 'Metube') {
        // Vérifier le statut de Metube sur le port 7862
        const response = await fetch('http://localhost:7862/', { 
          method: 'HEAD',
          mode: 'no-cors' // Pour éviter les erreurs CORS
        });
        
        // Si on arrive ici, le service répond
        alert('✅ Service Metube accessible sur le port 7862');
      } else {
        alert(`🔍 Vérification du statut pour ${moduleTitle} - Fonctionnalité en développement`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du statut:', error);
      alert('❌ Service non accessible ou erreur de connexion');
    }
  };

    const handleSaveModule = async (moduleData: any) => {
    try {
      console.log('💾 Tentative de sauvegarde avec moduleData:', moduleData);

      console.log('💾 Données à sauvegarder:', moduleData);

      if (isAddingModule) {
        // Ajouter le module
        const { data: newModule, error: moduleError } = await supabase
          .from('modules')
          .insert([moduleData])
          .select()
          .single();
        
        if (moduleError) {
          console.error('Erreur lors de l\'ajout du module:', moduleError);
          alert(`Erreur lors de l'ajout du module: ${moduleError.message}`);
          return;
        }
        
        console.log('✅ Module ajouté avec ID:', newModule.id);
      } else {
        // Modifier le module
        const { error: moduleError } = await supabase
          .from('modules')
          .update(moduleData)
          .eq('id', editingModule!.id);
        
        if (moduleError) {
          console.error('Erreur lors de la modification du module:', moduleError);
          alert(`Erreur lors de la modification du module: ${moduleError.message}`);
          return;
        }
        
        console.log('✅ Module modifié avec ID:', editingModule!.id);
      }

      fetchData();
      setShowModal(false);
      setEditingModule(null);
      setIsAddingModule(false);
      
      const action = isAddingModule ? 'ajouté' : 'modifié';
      alert(`Module ${action} avec succès`);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  // Contrôles d'accès
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h1>
            <p className="text-gray-600 mb-8">Vous devez être connecté pour accéder à cette page.</p>
            <Link href="/login" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Se connecter</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h1>
            <p className="text-gray-600 mb-8">Vous devez avoir les droits d'administrateur pour accéder à cette page.</p>
            <Link href="https://home.regispailler.fr/admin/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Retour à l'administration</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-20">
        <Breadcrumb />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête */}
          <div className="mt-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Modules</h1>
              <p className="text-gray-600 mt-2">Gérez vos modules et leurs pages détaillées intégrées</p>
            </div>
                         <div className="flex items-center space-x-4">
              <button
                onClick={handleAddModule}
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Ajouter un module
              </button>
            </div>
          </div>
        </div>

        {/* Liste des modules */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-500">Chargement des modules...</div>
            <div className="text-sm text-gray-400 mt-2">Récupération des données depuis la base de données</div>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">Aucun module trouvé</div>
            <button
              onClick={handleAddModule}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Créer le premier module
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 font-medium">
                  {modules.length} module{modules.length > 1 ? 's' : ''} chargé{modules.length > 1 ? 's' : ''} avec succès
                </span>
              </div>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <div key={module.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-block px-2 py-1 text-xs font-bold rounded bg-blue-100 text-blue-700">
                      {module.category}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleManageModule(module)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Gérer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditModule(module)}
                        className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                        title="Modifier"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteModule(module.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{module.title}</h3>
                    {module.subtitle && (
                      <p className="text-sm text-gray-600 mb-2 italic">{module.subtitle}</p>
                    )}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{module.description}</p>
                  
                                     <div className="space-y-2 mb-4">
                     <div className="text-sm text-gray-500">
                       <strong>Prix:</strong> {module.price}€
                     </div>
                   </div>
                  
                  {/* Bouton Gérer */}
                  <div className="border-t pt-4 mt-4">
                    <button
                      onClick={() => handleManageModule(module)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Gérer {module.title}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

        {/* Modal d'édition/ajout unifié */}
        {showModal && (
          <>
            {editingModule && (
              <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded z-50">
                <strong>Debug:</strong> Module en cours d'édition: {editingModule.title} (ID: {editingModule.id})
              </div>
            )}
                         <UnifiedModuleModal 
               module={editingModule}
               isAdding={isAddingModule}
               onSave={handleSaveModule}
               onClose={() => {
                 setShowModal(false);
                 setEditingModule(null);
                 setIsAddingModule(false);
                 setTokenInfo(null);
               }}
               onCheckStatus={checkServiceStatus}
               tokenInfo={tokenInfo}
             />
          </>
        )}
        </div>
      </div>
    </div>
  );
}

// Composant modal unifié pour l'édition/ajout de modules
function UnifiedModuleModal({ module, isAdding, onSave, onClose, onCheckStatus, tokenInfo }: {
  module: Module | null;
  isAdding: boolean;
  onSave: (moduleData: any) => void;
  onClose: () => void;
  onCheckStatus?: (moduleTitle: string) => void;
  tokenInfo?: TokenInfo | null;
}) {
  // Fonction pour générer les informations du token
  const getTokenInfo = (module: Module): TokenInfo => {
    const moduleName = module.title.toLowerCase().replace(/\s+/g, '');
    
    // Mapping des URLs des modules
    const moduleUrls: { [key: string]: string } = {
      'stablediffusion': 'http://localhost:7860',
      'iaphoto': 'http://localhost:7861', 
      'iametube': 'http://localhost:7862',
      'chatgpt': 'http://localhost:7863',
      'librespeed': 'https://librespeed.regispailler.fr',
      'psitransfer': 'https://psitransfer.regispailler.fr',
      'pdf+': 'https://pdfplus.regispailler.fr',
      'aiassistant': 'http://localhost:7864'
    };

    const baseUrl = moduleUrls[moduleName] || 'http://localhost:7862';
    const accessUrl = `${baseUrl}?token={JWT_TOKEN}`;
    
    return {
      moduleName,
      baseUrl,
      accessUrl,
      permissions: tokenSettings.permissions,
      expiresIn: tokenSettings.expiresIn,
      jwtSecret: process.env.JWT_SECRET || 'iahome-super-secret-jwt-key-2025-change-in-production'
    };
  };
  const [isManaging, setIsManaging] = useState(false);
  const [tokenSettings, setTokenSettings] = useState({
    expiresIn: '72h',
    permissions: ['read', 'access', 'write', 'advanced_features']
  });
  console.log('🎯 UnifiedModuleModal rendu - module:', module);
  console.log('🎯 UnifiedModuleModal rendu - isAdding:', isAdding);
                 const [formData, setFormData] = useState(() => {
    console.log('🎯 Initialisation du formData avec module:', module);
    
    // Initialiser avec les données du module si disponible
    if (module) {
      const initialData = {
        // Champs du module
        title: module.title || '',
        description: module.description || '',
        subtitle: module.subtitle || '',
        category: module.category || '',
        price: module.price || 0,
        youtube_url: module.youtube_url || ''
      };
      console.log('🎯 FormData initialisé avec les données du module:', initialData);
      return initialData;
    }
    
    const emptyData = {
      // Champs du module
      title: '',
      description: '',
      subtitle: '',
      category: '',
      price: 0,
      youtube_url: ''
    };
    console.log('🎯 FormData initialisé avec des données vides:', emptyData);
    return emptyData;
  });

  // Mettre à jour le formulaire quand le module change
  useEffect(() => {
    console.log('🔄 useEffect triggered - module:', module);
    console.log('🔄 isAdding:', isAdding);
    
    if (module) {
      console.log('📝 Mise à jour du formulaire avec les données du module:', module);
      console.log('📝 Données complètes du module:', JSON.stringify(module, null, 2));
      
      const newFormData = {
        title: module.title || '',
        description: module.description || '',
        subtitle: module.subtitle || '',
        category: module.category || '',
        price: module.price || 0,
        youtube_url: module.youtube_url || ''
      };
      
      console.log('📝 Nouveau formData:', newFormData);
      setFormData(newFormData);
    } else if (isAdding) {
      console.log('➕ Réinitialisation du formulaire pour un nouvel ajout');
      const emptyFormData = {
        title: '',
        description: '',
        subtitle: '',
        category: '',
        price: 0,
        youtube_url: ''
      };
      console.log('➕ FormData vide:', emptyFormData);
      setFormData(emptyFormData);
    }
  }, [module, isAdding]); // Utiliser module au lieu de module?.id pour une meilleure réactivité

  // Force la mise à jour du formulaire quand le modal s'ouvre
  useEffect(() => {
    if (module && !isAdding) {
      console.log('🔄 Force mise à jour du formulaire pour module:', module.title);
      const newFormData = {
        title: module.title || '',
        description: module.description || '',
        subtitle: module.subtitle || '',
        category: module.category || '',
        price: module.price || 0,
        youtube_url: module.youtube_url || ''
      };
      setFormData(newFormData);
      
      // Détecter si c'est un mode "gestion" (venant du bouton Gérer)
      setIsManaging(true);
    } else {
      setIsManaging(false);
    }
  }, [module, isAdding]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Soumission du formulaire avec formData:', formData);
    
         // Préparer les données pour le module
     const moduleData = {
       title: formData.title || '',
       description: formData.description || '',
       subtitle: formData.subtitle || '',
       category: formData.category || '',
       price: formData.price || 0,
       youtube_url: formData.youtube_url || ''
     };
    
    console.log('📝 moduleData:', moduleData);
    
    onSave(moduleData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
                     <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold text-gray-900">
               {isAdding ? 'Ajouter un module' : isManaging ? `Gérer ${module?.title}` : 'Modifier le module'}
             </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section Informations du module */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 Informations du module</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Titre du module
                   </label>
                   <input
                     type="text"
                     value={formData.title}
                     onChange={(e) => setFormData({...formData, title: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Titre du module"
                   />
                   <p className="text-xs text-gray-500 mt-1">
                     Valeur actuelle: "{formData.title}"
                   </p>

                   {module && (
                     <div className="text-xs text-gray-500 mt-1 space-y-1">
                       <p>ID du module: {module.id}</p>
                       <p>Données chargées: ✅</p>
                     </div>
                   )}
                </div>

                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Sous-titre du module (optionnel)
                   </label>
                   <input
                     type="text"
                     value={formData.subtitle}
                     onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Sous-titre du module"
                   />
                   <p className="text-xs text-gray-500 mt-1">
                     Valeur actuelle: "{formData.subtitle}"
                   </p>
                   {module && module.subtitle && (
                     <p className="text-xs text-green-600 mt-1">
                       ✅ Sous-titre existant chargé
                     </p>
                   )}
                </div>

                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Catégorie
                   </label>
                   <select
                     value={formData.category}
                     onChange={(e) => setFormData({...formData, category: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                   >
                    <option value="">Sélectionner une catégorie</option>
                    <option value="IA ASSISTANT">IA ASSISTANT</option>
                    <option value="IA BUREAUTIQUE">IA BUREAUTIQUE</option>
                    <option value="IA PHOTO">IA PHOTO</option>
                    <option value="IA VIDEO">IA VIDEO</option>
                    <option value="IA MAO">IA MAO</option>
                    <option value="IA PROMPTS">IA PROMPTS</option>
                    <option value="IA MARKETING">IA MARKETING</option>
                    <option value="IA DESIGN">IA DESIGN</option>
                  </select>
                </div>

                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Prix (€)
                   </label>
                   <input
                     type="number"
                     min="0"
                     step="0.01"
                     value={formData.price}
                     onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="0.00"
                   />
                </div>

                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     URL YouTube (optionnel)
                   </label>
                   <input
                     type="url"
                     value={formData.youtube_url}
                     onChange={(e) => setFormData({...formData, youtube_url: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="https://www.youtube.com/embed/..."
                   />
                 </div>

                                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Description du module
                   </label>
                   <textarea
                     value={formData.description}
                     onChange={(e) => setFormData({...formData, description: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     rows={3}
                     placeholder="Description du module"
                   />
                </div>

                
              </div>
            </div>

            {/* Section Informations du token (visible uniquement en mode gestion) */}
            {!isAdding && module && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-4">🔑 Informations du token d'accès</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    const currentTokenInfo = tokenInfo || getTokenInfo(module);
                    return (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom du module (pour le token)
                          </label>
                          <input
                            type="text"
                            value={currentTokenInfo.moduleName}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Nom utilisé pour générer le token JWT
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL de base du service
                          </label>
                          <input
                            type="url"
                            value={currentTokenInfo.baseUrl}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            URL du service associé à ce module
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL d'accès avec token
                          </label>
                          <input
                            type="url"
                            value={currentTokenInfo.accessUrl}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            URL complète avec placeholder pour le token JWT
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Permissions du token
                          </label>
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                            {tokenSettings.permissions.map((permission, index) => (
                              <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                                {permission}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Permissions accordées par le token (configurées automatiquement)
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Durée de validité
                          </label>
                          <select
                            value={tokenSettings.expiresIn}
                            onChange={(e) => setTokenSettings({...tokenSettings, expiresIn: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="1h">1 heure</option>
                            <option value="6h">6 heures</option>
                            <option value="12h">12 heures</option>
                            <option value="24h">24 heures (1 jour)</option>
                            <option value="72h">72 heures (3 jours)</option>
                            <option value="168h">168 heures (7 jours)</option>
                            <option value="720h">720 heures (30 jours)</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Durée de validité du token JWT (affecte les nouveaux tokens générés)
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Clé secrète JWT (masquée)
                          </label>
                          <input
                            type="password"
                            value={currentTokenInfo.jwtSecret}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Clé secrète utilisée pour signer les tokens (JWT_SECRET)
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Bouton pour tester la génération de token */}
                <div className="mt-4 pt-4 border-t border-green-200">
                  <button
                    type="button"
                    onClick={async () => {
                      if (module) {
                        try {
                          console.log('🔑 Génération de token avec paramètres:', tokenSettings);
                          
                          // Récupérer la session actuelle pour l'authentification
                          const { data: { session } } = await supabase.auth.getSession();
                          if (!session) {
                            alert('Vous devez être connecté pour générer un token');
                            return;
                          }
                          
                          // Appeler l'API pour générer un token personnalisé
                          const response = await fetch('/api/generate-custom-token', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({
                              moduleId: module.id,
                              moduleName: module.title.toLowerCase().replace(/\s+/g, ''),
                              expiresIn: tokenSettings.expiresIn,
                              permissions: tokenSettings.permissions
                            }),
                          });
                          
                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
                          }
                          
                          const tokenData = await response.json();
                          console.log('🔑 Token généré avec succès:', tokenData);
                          
                          // Afficher les informations du token généré
                          const tokenInfo = getTokenInfo(module);
                          alert(`Token généré avec succès !\n\nModule: ${tokenInfo.moduleName}\nDurée: ${tokenSettings.expiresIn}\nURL: ${tokenInfo.accessUrl}\n\nToken ID: ${tokenData.accessToken.substring(0, 20)}...\n\nLe token a été généré avec vos paramètres personnalisés.`);
                        } catch (error) {
                          console.error('❌ Erreur lors de la génération du token:', error);
                          alert(`Erreur lors de la génération du token: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
                        }
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 15.75l.394 1.183a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                    Générer un token de test
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
                             <button
                 type="submit"
                 className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
               >
                 {isAdding ? 'Créer le module' : isManaging ? 'Sauvegarder la configuration' : 'Modifier le module'}
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 