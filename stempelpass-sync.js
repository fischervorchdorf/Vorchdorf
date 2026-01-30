// ==========================================
// VORCHDORF STEMPELPASS - CLOUD SYNC
// ==========================================

const CLOUD_SYNC_URL = 'https://script.google.com/macros/s/AKfycbwvKhuEHP7T24IVl7NVpGFXrpqXypyQWvO0IMi7HhHRIgKHxWwSO-6BRPhfG-TQePI72Q/exec'; // <-- WICHTIG: Ersetzen!

// Offline-Queue für Stempel wenn kein Internet
let offlineQueue = JSON.parse(localStorage.getItem('stempel_offline_queue') || '[]');

// Synchronisiere einzelnen Stempel zur Cloud
async function syncStampToCloud(passId, companyId, deviceInfo = null) {
    const userId = getUserId();
    const timestamp = new Date().toISOString();
    const date = new Date().toISOString().split('T')[0];

    if (!deviceInfo) {
        deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
        };
    }

    const stampData = {
        action: 'add_stamp',
        user_id: userId,
        pass_id: passId,
        company_id: companyId,
        timestamp: timestamp,
        date: date,
        device_info: JSON.stringify(deviceInfo)
    };

    try {
        const response = await fetch(CLOUD_SYNC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stampData)
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Stempel zur Cloud synchronisiert');
            return true;
        } else {
            console.warn('⚠️ Cloud-Sync fehlgeschlagen:', result.message);
            // Füge zur Offline-Queue hinzu
            addToOfflineQueue(stampData);
            return false;
        }
    } catch (error) {
        console.error('❌ Cloud-Sync Fehler:', error);
        // Offline → Queue
        addToOfflineQueue(stampData);
        return false;
    }
}

// Füge Stempel zur Offline-Queue hinzu
function addToOfflineQueue(stampData) {
    offlineQueue.push(stampData);
    localStorage.setItem('stempel_offline_queue', JSON.stringify(offlineQueue));
    console.log('📦 Stempel zur Offline-Queue hinzugefügt');
}

// Verarbeite Offline-Queue (bei Reconnect)
async function processOfflineQueue() {
    if (offlineQueue.length === 0) return;

    console.log(`📤 Verarbeite ${offlineQueue.length} Offline-Stempel...`);

    const processed = [];

    for (const stampData of offlineQueue) {
        try {
            const response = await fetch(CLOUD_SYNC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stampData)
            });

            const result = await response.json();

            if (result.success) {
                processed.push(stampData);
                console.log('✅ Offline-Stempel synchronisiert');
            }
        } catch (error) {
            console.error('❌ Offline-Stempel konnte nicht synchronisiert werden');
            break; // Stoppe bei Fehler
        }
    }

    // Entferne verarbeitete Items
    offlineQueue = offlineQueue.filter(item => !processed.includes(item));
    localStorage.setItem('stempel_offline_queue', JSON.stringify(offlineQueue));

    console.log(`✅ ${processed.length} Offline-Stempel erfolgreich synchronisiert`);
}

// Lade alle Stempel von der Cloud
async function loadStampsFromCloud(userId) {
    try {
        const response = await fetch(`${CLOUD_SYNC_URL}?user_id=${userId}`);
        const result = await response.json();

        if (result.success && result.data) {
            console.log('✅ Stempel von Cloud geladen:', result.data);
            return result.data;
        } else {
            console.warn('⚠️ Keine Cloud-Daten gefunden');
            return {};
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden von Cloud:', error);
        return {};
    }
}

// Merge lokale und Cloud-Stempel (neueste gewinnt)
function mergeStamps(localStamps, cloudStamps) {
    const merged = { ...cloudStamps };

    // Füge lokale Stempel hinzu die nicht in Cloud sind
    for (const passId in localStamps) {
        if (!merged[passId]) {
            merged[passId] = localStamps[passId];
        } else {
            // Merge beide Arrays und entferne Duplikate
            const combined = [...merged[passId], ...localStamps[passId]];

            // Deduplizierung basierend auf companyId + date
            const unique = {};
            combined.forEach(stamp => {
                const key = `${stamp.companyId}_${stamp.date}`;
                if (!unique[key] || new Date(stamp.timestamp) > new Date(unique[key].timestamp)) {
                    unique[key] = stamp;
                }
            });

            merged[passId] = Object.values(unique);
        }
    }

    return merged;
}

// Vollständige Synchronisation (beim App-Start)
async function fullSync() {
    const userId = getUserId();

    // 1. Lade Cloud-Daten
    const cloudStamps = await loadStampsFromCloud(userId);

    // 2. Merge mit lokalen Daten
    const localStamps = JSON.parse(localStorage.getItem('vorchdorf_stamps') || '{}');
    const mergedStamps = mergeStamps(localStamps, cloudStamps);

    // 3. Speichere gemergte Daten lokal
    localStorage.setItem('vorchdorf_stamps', JSON.stringify(mergedStamps));
    userStamps = mergedStamps;

    // 4. Verarbeite Offline-Queue
    await processOfflineQueue();

    // 5. Synce lokale Stempel die nicht in Cloud sind
    await syncLocalToCloud(localStamps, cloudStamps);

    console.log('✅ Vollständige Synchronisation abgeschlossen');
    return mergedStamps;
}

// Synce lokale Stempel die noch nicht in Cloud sind
async function syncLocalToCloud(localStamps, cloudStamps) {
    const toSync = [];

    for (const passId in localStamps) {
        localStamps[passId].forEach(localStamp => {
            const cloudPassStamps = cloudStamps[passId] || [];
            const exists = cloudPassStamps.some(cs =>
                cs.companyId === localStamp.companyId && cs.date === localStamp.date
            );

            if (!exists) {
                toSync.push({ passId, stamp: localStamp });
            }
        });
    }

    if (toSync.length > 0) {
        console.log(`📤 Synce ${toSync.length} lokale Stempel zur Cloud...`);

        for (const item of toSync) {
            await syncStampToCloud(item.passId, item.stamp.companyId);
        }
    }
}

// Online-Status überwachen
window.addEventListener('online', () => {
    console.log('🌐 Internet-Verbindung wiederhergestellt');
    processOfflineQueue();
});

window.addEventListener('offline', () => {
    console.log('📴 Offline-Modus aktiviert');
});