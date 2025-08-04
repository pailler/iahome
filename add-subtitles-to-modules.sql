-- Script pour ajouter des sous-titres aux modules
-- Mise à jour des sous-titres pour les modules existants

UPDATE modules 
SET subtitle = 'Générez des images avec l''intelligence artificielle'
WHERE title = 'Stable diffusion' AND subtitle IS NULL;

UPDATE modules 
SET subtitle = 'Créez et modifiez des documents PDF professionnels'
WHERE title = 'PDF Pro+' AND subtitle IS NULL;

UPDATE modules 
SET subtitle = 'Créez des bannières publicitaires avec l''IA'
WHERE title = 'Bannière HA' AND subtitle IS NULL;

UPDATE modules 
SET subtitle = 'Assistant IA pour vos tâches quotidiennes'
WHERE title = 'AI Assistant' AND subtitle IS NULL;

UPDATE modules 
SET subtitle = 'Studio de création avec IA avancée'
WHERE title = 'Cogstudio' AND subtitle IS NULL;

UPDATE modules 
SET subtitle = 'Générez des images avec Invoke AI'
WHERE title = 'Invoke' AND subtitle IS NULL;

UPDATE modules 
SET subtitle = 'Testez la vitesse de votre connexion internet'
WHERE title = 'Librespeed' AND subtitle IS NULL;

UPDATE modules 
SET subtitle = 'Traitement et conversion de documents PDF'
WHERE title = 'PDF+' AND subtitle IS NULL;

UPDATE modules 
SET subtitle = 'Transfert de fichiers sécurisé et rapide'
WHERE title = 'PSitransfer' AND subtitle IS NULL;

UPDATE modules 
SET subtitle = 'Générez des QR codes dynamiques personnalisés'
WHERE title = 'QR codes dynamiques' AND subtitle IS NULL;

UPDATE modules 
SET subtitle = 'Interface Fooocus pour Stable Diffusion'
WHERE title = 'ruinedfooocus' AND subtitle IS NULL;

UPDATE modules 
SET subtitle = 'Interface SDNext pour la génération d''images'
WHERE title = 'SDnext' AND subtitle IS NULL;

UPDATE modules 
SET subtitle = 'Éditeur vidéo en ligne avec IA'
WHERE title = 'Video Editor' AND subtitle IS NULL;

-- Vérification des mises à jour
SELECT title, subtitle FROM modules ORDER BY title; 