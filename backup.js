import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';
import fs from 'fs/promises';

const firebaseConfig = {
  apiKey: "AIzaSyB4gt3kN-1QSXcUFaaOUYJjbG5La-5iA64",
  authDomain: "media-tracker-94a70.firebaseapp.com",
  projectId: "media-tracker-94a70",
  storageBucket: "media-tracker-94a70.firebasestorage.app",
  messagingSenderId: "753329770698",
  appId: "1:753329770698:web:2fb091751e1de2696ce433"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

async function backup() {
  try {
    const mediaRef = collection(db, 'media_items');
    const snapshot = await getDocs(mediaRef);
    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    
    const jsonData = JSON.stringify(items, null, 2);
    
    // Save images locally
    const backupDir = 'backup_images';
    await fs.mkdir(backupDir, { recursive: true });
    
    let imageBackupCount = 0;
    for (const item of items) {
      if (item.cover_url) {
        let path = null;
        if (!item.cover_url.startsWith('http')) {
          path = item.cover_url;
        } else if (item.cover_url.includes('/covers/')) {
          const parts = item.cover_url.split('/covers/');
          if (parts.length > 1) {
            path = parts[1].split('?')[0];
          }
        }
        
        if (path) {
          const localImagePath = `${backupDir}/${path.replace(/[\\/]/g, '_')}`;
          let imageBuffer = null;
          try {
            await fs.access(localImagePath);
            imageBuffer = await fs.readFile(localImagePath);
          } catch {
            // File doesn't exist locally, download it
            try {
              const imageRef = ref(storage, `covers/${path}`);
              const url = await getDownloadURL(imageRef);
              const response = await fetch(url);
              if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                imageBuffer = Buffer.from(arrayBuffer);
                await fs.writeFile(localImagePath, imageBuffer);
                imageBackupCount++;
              }
            } catch (imgErr) {
              console.error(`Failed to backup image ${path} locally:`, imgErr.message);
            }
          }
          
          // Now ensure it is also uploaded to the Cloud Backup folder
          if (imageBuffer) {
            const backupImageRef = ref(storage, `backups/images/${path.replace(/[\\/]/g, '_')}`);
            try {
              await getDownloadURL(backupImageRef); // check if it exists in backup folder
            } catch {
              try {
                // Upload to cloud backup folder if missing
                await uploadBytes(backupImageRef, new Uint8Array(imageBuffer), { contentType: 'image/jpeg' });
              } catch (uploadErr) {
                console.error(`Failed to upload image ${path} to cloud backup:`, uploadErr.message);
              }
            }
          }
        }
      }
    }

    
    // Save locally
    await fs.writeFile('backup.json', jsonData);
    
    // Save to Google Cloud / Firebase Storage
    const timestamp = new Date().toISOString();
    const backupRef = ref(storage, `backups/backup-${timestamp.replace(/:/g, '-')}.json`);
    await uploadString(backupRef, jsonData, 'raw', { contentType: 'application/json' });
    
    console.log(`Backup completed successfully at ${timestamp}. Backed up ${items.length} items locally and to Cloud Storage, and downloaded ${imageBackupCount} new images.`);
    process.exit(0);
  } catch (error) {
    console.error("Backup failed:", error);
    process.exit(1);
  }
}

backup();
